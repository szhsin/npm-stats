import { afterEach, expect, test, vi } from 'vitest';
import { fetchAuthorDownloads } from '../src/api/npmAuthors.ts';
import { pointResponse, searchResponse } from './helpers/npmResponses.ts';

const NOW = new Date('2026-09-15T01:00:00Z');
const query = {
  authorName: 'example',
  startMonth: '2024-01',
  endMonth: '2024-12',
};

afterEach(() => vi.restoreAllMocks());

test('selects at most 10 popular author packages, fetching all packages and chunks in parallel', async () => {
  const names = Array.from(
    { length: 22 },
    (_, index) => `@example/package-${index}`,
  );
  const pending: Array<{ url: string; resolve: (response: Response) => void }> =
    [];
  let searchUrl: URL | undefined;
  vi.spyOn(globalThis, 'fetch').mockImplementation((input) => {
    const url = String(input);
    if (url.startsWith('https://registry.npmjs.org/')) {
      searchUrl = new URL(url);
      return Promise.resolve(searchResponse(names, 100));
    }
    return new Promise<Response>((resolve) => pending.push({ url, resolve }));
  });

  const resultPromise = fetchAuthorDownloads(
    {
      authorName: ' @Example ',
      startMonth: '2023-03',
      endMonth: '2024-09',
    },
    NOW,
  );
  await new Promise<void>((resolve) => setImmediate(resolve));

  expect(searchUrl?.pathname).toBe('/-/v1/search');
  expect(Object.fromEntries(searchUrl!.searchParams)).toStrictEqual({
    text: 'author:example',
    size: '10',
    popularity: '1',
    quality: '0',
    maintenance: '0',
  });
  // Ten packages, each with two chunks, all started before any downloads resolve.
  expect(pending.length).toBe(20);
  expect(
    pending.every(({ url }) => url.includes('/%40example%2Fpackage-')),
  ).toBeTruthy();
  for (const { url, resolve } of pending.toReversed()) {
    const index = Number(url.match(/package-(\d+)$/)![1]);
    resolve(pointResponse(url, index + 1));
  }

  const result = await resultPromise;
  expect(result.authorName).toBe('example');
  expect(result.packageCount).toBe(10);
  expect(result.totalPackageCount).toBe(100);
  expect(result.totalCombinedDownloads).toBe(110);
  expect(result.packages.map((pkg) => pkg.totalDownloads)).toStrictEqual(
    Array.from({ length: 10 }, (_, index) => (10 - index) * 2),
  );
  expect(result.packages[0].packageName).toBe('@example/package-9');
  expect(result.packages[0].startDate).toBe('2023-03-01');
  expect(result.packages[0].endDate).toBe('2024-09-30');
});

test('no author matches returns an empty result without download requests', async () => {
  const fetchMock = vi
    .spyOn(globalThis, 'fetch')
    .mockImplementation(async () => searchResponse([]));
  expect(await fetchAuthorDownloads(query, NOW)).toStrictEqual({
    ...query,
    totalCombinedDownloads: 0,
    packageCount: 0,
    totalPackageCount: 0,
    packages: [],
  });
  expect(fetchMock).toHaveBeenCalledTimes(1);
});

test('duplicate search entries count only once and missing metadata is optional', async () => {
  const downloadUrls: string[] = [];
  vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
    const url = String(input);
    if (url.startsWith('https://registry.npmjs.org/')) {
      return Response.json({
        total: 2,
        objects: [
          { package: { name: 'react' } },
          { package: { name: 'react' } },
        ],
      });
    }
    downloadUrls.push(url);
    return pointResponse(url, 50);
  });
  const result = await fetchAuthorDownloads(query, NOW);
  expect(downloadUrls.length).toBe(1);
  expect(result.totalCombinedDownloads).toBe(50);
  expect(result.packageCount).toBe(1);
  expect(result.packages[0].version).toBe('');
  expect(result.packages[0].description).toBe('');
});

test('zero totals remain successful and tied packages have a stable name order', async () => {
  vi.spyOn(globalThis, 'fetch').mockImplementation(async (url) =>
    String(url).startsWith('https://registry.npmjs.org/')
      ? searchResponse(['zebra', 'alpha'])
      : pointResponse(url, 0),
  );
  const result = await fetchAuthorDownloads(query, NOW);
  expect(result.totalCombinedDownloads).toBe(0);
  expect(result.packages.map((pkg) => pkg.packageName)).toStrictEqual([
    'alpha',
    'zebra',
  ]);
});

test('invalid authors and ranges never send requests', async () => {
  const fetchMock = vi
    .spyOn(globalThis, 'fetch')
    .mockRejectedValue(new Error('Unexpected fetch'));
  for (const authorName of [
    '',
    '@',
    'someone author:else',
    'example&size=250',
    'https://npmjs.com/~example',
  ]) {
    await expect(
      fetchAuthorDownloads({ ...query, authorName }, NOW),
    ).rejects.toThrow(/Enter an npm author username/);
  }
  await expect(
    fetchAuthorDownloads({ ...query, startMonth: '2025-01' }, NOW),
  ).rejects.toThrow(/Start month/);
  expect(fetchMock).not.toHaveBeenCalled();
});

test('failed search requests and malformed search data are errors, not empty results', async () => {
  for (const [status, message] of [
    [429, /Rate limited.*429.*wait and try again later/],
    [503, /author packages.*HTTP 503/],
  ] as const) {
    vi.spyOn(globalThis, 'fetch').mockImplementation(
      async () => new Response(null, { status }),
    );
    await expect(fetchAuthorDownloads(query, NOW)).rejects.toThrow(message);
    vi.restoreAllMocks();
  }
  for (const body of [
    null,
    {},
    { total: -1, objects: [] },
    { total: 1, objects: [{ package: {} }] },
  ]) {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockImplementation(async () => Response.json(body));
    await expect(fetchAuthorDownloads(query, NOW)).rejects.toThrow(
      /unexpected author package data/,
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
    vi.restoreAllMocks();
  }
});

test("one failed package rejects the author's total and aborts every outstanding chunk", async () => {
  const signals: AbortSignal[] = [];
  vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, options) => {
    const url = String(input);
    if (url.startsWith('https://registry.npmjs.org/'))
      return searchResponse(['react', 'missing', 'vue']);
    signals.push(options!.signal!);
    return url.endsWith('/missing')
      ? new Response(null, { status: 404 })
      : pointResponse(url, 100);
  });
  await expect(
    fetchAuthorDownloads({ ...query, startMonth: '2023-01' }, NOW),
  ).rejects.toThrow(/Could not load downloads for “missing”/);
  expect(signals.length).toBe(6);
  expect(signals.every((signal) => signal.aborted)).toBeTruthy();
});

test('author download failures retain the possible rate-limit explanation when the browser hides the status', async () => {
  vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
    const url = String(input);
    if (url.startsWith('https://registry.npmjs.org/'))
      return searchResponse(['react']);
    throw new TypeError('Failed to fetch');
  });
  const result = fetchAuthorDownloads(query, NOW);
  await expect(result).rejects.toThrow(
    /Could not load downloads for “react”.*may be rate limited.*wait and try again later/,
  );
  await expect(result).rejects.not.toThrow(/HTTP \d+/);
});

test('current-month packages reuse available-day boundaries and retain partial coverage', async () => {
  vi.spyOn(globalThis, 'fetch').mockImplementation(async (url) =>
    String(url).startsWith('https://registry.npmjs.org/')
      ? searchResponse(['react'])
      : pointResponse(url, 100),
  );
  const result = await fetchAuthorDownloads(
    { ...query, startMonth: '2026-09', endMonth: '2026-09' },
    NOW,
  );
  expect(result.totalCombinedDownloads).toBe(100);
  expect(result.packages[0].endDate).toBe('2026-09-14');
});
