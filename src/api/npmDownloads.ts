import { fetchNpmJson } from './npmFetch.ts';

export interface MonthRange {
  startMonth: string;
  endMonth: string;
}

export interface PackageDownloadQuery extends MonthRange {
  packageName: string;
}

export interface PackageDownloadStats extends PackageDownloadQuery {
  totalDownloads: number;
  startDate: string;
  endDate: string;
}

interface DownloadRange {
  start: string;
  end: string;
}

interface DownloadPoint extends DownloadRange {
  downloads: number;
  package: string;
}

function isDownloadPoint(value: unknown): value is DownloadPoint {
  return (
    typeof value === 'object' &&
    value !== null &&
    'downloads' in value &&
    typeof value.downloads === 'number' &&
    Number.isSafeInteger(value.downloads) &&
    value.downloads >= 0 &&
    'package' in value &&
    typeof value.package === 'string' &&
    'start' in value &&
    typeof value.start === 'string' &&
    'end' in value &&
    typeof value.end === 'string'
  );
}

export const FIRST_DOWNLOAD_MONTH = '2015-01';
const FIRST_DOWNLOAD_DATE = '2015-01-10';
const MAX_MONTHS_PER_REQUEST = 18;
const MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;

function monthIndex(month: string): number {
  const [year, monthNumber] = month.split('-').map(Number);
  return year * 12 + monthNumber - 1;
}

function monthDate(index: number, day = 1): string {
  return new Date(Date.UTC(Math.floor(index / 12), index % 12, day))
    .toISOString()
    .slice(0, 10);
}

function latestDownloadDate(now: Date): string {
  const yesterday = new Date(now);
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  return yesterday.toISOString().slice(0, 10);
}

export function getMonthRangeDefaults(now = new Date()) {
  const currentMonth = monthIndex(now.toISOString().slice(0, 7));
  return {
    startMonth: monthDate(currentMonth - 12).slice(0, 7),
    endMonth: monthDate(currentMonth).slice(0, 7),
    maxMonth: monthDate(currentMonth).slice(0, 7),
  };
}

export function getMonthRangeError(
  startMonth: string,
  endMonth: string,
  now = new Date(),
): string | undefined {
  if (!MONTH_PATTERN.test(startMonth) || !MONTH_PATTERN.test(endMonth)) {
    return 'Choose a valid start and end month.';
  }
  if (startMonth > endMonth) {
    return 'Start month must be on or before end month.';
  }
  if (startMonth < FIRST_DOWNLOAD_MONTH) {
    return 'npm download history starts in January 2015.';
  }
  if (endMonth > getMonthRangeDefaults(now).maxMonth) {
    return 'Choose a month with available download history.';
  }
  if (`${startMonth}-01` > latestDownloadDate(now)) {
    return 'Download data is not available for this month yet.';
  }
}

export function createDownloadRanges(
  startMonth: string,
  endMonth: string,
  now = new Date(),
): DownloadRange[] {
  const error = getMonthRangeError(startMonth, endMonth, now);
  if (error) throw new Error(error);

  const ranges: DownloadRange[] = [];
  const latestDate = latestDownloadDate(now);
  const endIndex = Math.min(
    monthIndex(endMonth),
    monthIndex(latestDate.slice(0, 7)),
  );

  for (
    let startIndex = monthIndex(startMonth);
    startIndex <= endIndex;
    startIndex += MAX_MONTHS_PER_REQUEST
  ) {
    const nextIndex = Math.min(
      startIndex + MAX_MONTHS_PER_REQUEST,
      endIndex + 1,
    );
    // npm's endpoints are inclusive: end on the day before the next chunk.
    const start = monthDate(startIndex);
    const end = monthDate(nextIndex, 0);
    ranges.push({
      start: start < FIRST_DOWNLOAD_DATE ? FIRST_DOWNLOAD_DATE : start,
      end: end > latestDate ? latestDate : end,
    });
  }

  return ranges;
}

export function formatMonthRange(startMonth: string, endMonth: string): string {
  const formatter = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
  const start = formatter.format(new Date(`${startMonth}-01T00:00:00Z`));
  return startMonth === endMonth
    ? start
    : `${start} – ${formatter.format(new Date(`${endMonth}-01T00:00:00Z`))}`;
}

export function hasPartialMonth(stats: PackageDownloadStats): boolean {
  return (
    stats.startDate !== `${stats.startMonth}-01` ||
    stats.endDate !== monthDate(monthIndex(stats.endMonth) + 1, 0)
  );
}

export async function fetchPackageDownloads(
  query: PackageDownloadQuery,
  now = new Date(),
  signal?: AbortSignal,
): Promise<PackageDownloadStats> {
  const packageName = query.packageName.trim();
  if (
    packageName.length > 214 ||
    !/^(@[a-z0-9~][a-z0-9._~-]*\/)?[a-z0-9~][a-z0-9._~-]*$/i.test(packageName)
  ) {
    throw new Error('Enter a package name such as react or @scope/package.');
  }

  const ranges = createDownloadRanges(query.startMonth, query.endMonth, now);
  const controller = new AbortController();
  const requestSignal = signal
    ? AbortSignal.any([signal, controller.signal])
    : controller.signal;

  try {
    const points = await Promise.all(
      ranges.map(({ start, end }) =>
        fetchNpmJson(
          `https://api.npmjs.org/downloads/point/${start}:${end}/${encodeURIComponent(packageName)}`,
          {
            signal: requestSignal,
            notFoundMessage: `No download data found for “${packageName}”. Check the package name.`,
            parse: (point): DownloadPoint => {
              if (
                !isDownloadPoint(point) ||
                point.package !== packageName ||
                point.start !== start ||
                !/^\d{4}-\d{2}-\d{2}$/.test(point.end) ||
                point.end < start ||
                point.end > end ||
                (point.end !== end && end !== latestDownloadDate(now))
              ) {
                throw new Error(
                  'npm returned unexpected download data. Please retry.',
                );
              }
              return point;
            },
          },
        ),
      ),
    );

    return {
      ...query,
      packageName,
      totalDownloads: points.reduce(
        (total, point) => total + point.downloads,
        0,
      ),
      startDate: points[0].start,
      endDate: points[points.length - 1].end,
    };
  } catch (error) {
    // A failed chunk must never produce a misleading partial total.
    controller.abort();
    throw error;
  }
}
