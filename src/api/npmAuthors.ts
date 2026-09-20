import {
  fetchPackageDownloads,
  getMonthRangeError,
  type MonthRange,
  type PackageDownloadStats,
} from './npmDownloads.ts';
import { fetchNpmJson } from './npmFetch.ts';

export const AUTHOR_PACKAGE_LIMIT = 10;

export interface AuthorDownloadQuery extends MonthRange {
  authorName: string;
}

export interface AuthorPackageItem extends PackageDownloadStats {
  version: string;
  description: string;
}

export interface AuthorDownloadStats extends AuthorDownloadQuery {
  totalCombinedDownloads: number;
  packageCount: number;
  totalPackageCount: number;
  packages: AuthorPackageItem[];
}

interface SearchPackage {
  name: string;
  version?: string;
  description?: string;
}

interface AuthorSearchResponse {
  objects: { package: SearchPackage }[];
  total: number;
}

function isAuthorSearchResponse(value: unknown): value is AuthorSearchResponse {
  return (
    typeof value === 'object' &&
    value !== null &&
    'total' in value &&
    typeof value.total === 'number' &&
    Number.isSafeInteger(value.total) &&
    value.total >= 0 &&
    'objects' in value &&
    Array.isArray(value.objects) &&
    value.objects.every((item: unknown) => {
      if (typeof item !== 'object' || item === null || !('package' in item)) {
        return false;
      }
      const pkg = item.package;
      return (
        typeof pkg === 'object' &&
        pkg !== null &&
        'name' in pkg &&
        typeof pkg.name === 'string' &&
        pkg.name.length > 0 &&
        (!('version' in pkg) || typeof pkg.version === 'string') &&
        (!('description' in pkg) || typeof pkg.description === 'string')
      );
    })
  );
}

export function normalizeAuthorName(name: string): string {
  return name.trim().replace(/^@/, '').toLowerCase();
}

export async function fetchAuthorDownloads(
  query: AuthorDownloadQuery,
  now = new Date(),
): Promise<AuthorDownloadStats> {
  const authorName = normalizeAuthorName(query.authorName);
  if (!/^[a-z0-9][a-z0-9._-]*$/.test(authorName) || authorName.length > 214) {
    throw new Error('Enter an npm author username such as sindresorhus.');
  }
  const rangeError = getMonthRangeError(query.startMonth, query.endMonth, now);
  if (rangeError) throw new Error(rangeError);

  // Select npm's most popular matches, then rank these packages by range totals.
  const parameters = new URLSearchParams({
    text: `author:${authorName}`,
    size: String(AUTHOR_PACKAGE_LIMIT),
    popularity: '1',
    quality: '0',
    maintenance: '0',
  });
  const search = await fetchNpmJson(
    `https://registry.npmjs.org/-/v1/search?${parameters}`,
    {
      resource: 'author packages',
      parse: (data): AuthorSearchResponse => {
        if (!isAuthorSearchResponse(data)) {
          throw new Error(
            'npm returned unexpected author package data. Please retry.',
          );
        }
        return data;
      },
    },
  );

  const selectedPackages = Array.from(
    new Map(search.objects.map(({ package: pkg }) => [pkg.name, pkg])).values(),
  ).slice(0, AUTHOR_PACKAGE_LIMIT);
  const controller = new AbortController();

  try {
    const packages = await Promise.all(
      selectedPackages.map(async (pkg): Promise<AuthorPackageItem> => {
        try {
          const stats = await fetchPackageDownloads(
            {
              packageName: pkg.name,
              startMonth: query.startMonth,
              endMonth: query.endMonth,
            },
            now,
            controller.signal,
          );
          return {
            ...stats,
            version: pkg.version ?? '',
            description: pkg.description ?? '',
          };
        } catch (error) {
          const message =
            error instanceof Error ? error.message : 'Please retry.';
          throw new Error(
            `Could not load downloads for “${pkg.name}”. ${message}`,
          );
        }
      }),
    );
    packages.sort(
      (a, b) =>
        b.totalDownloads - a.totalDownloads ||
        a.packageName.localeCompare(b.packageName),
    );

    return {
      ...query,
      authorName,
      totalCombinedDownloads: packages.reduce(
        (sum, pkg) => sum + pkg.totalDownloads,
        0,
      ),
      packageCount: packages.length,
      totalPackageCount: search.total,
      packages,
    };
  } catch (error) {
    // Do not report an author's combined total if any package is missing.
    controller.abort();
    throw error;
  }
}
