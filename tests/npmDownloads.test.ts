import { afterEach, expect, test, vi } from 'vitest';
import { pointResponse } from './helpers/npmResponses.ts';
import {
  createDownloadRanges,
  fetchPackageDownloads,
  formatMonthRange,
  getMonthRangeDefaults,
  getMonthRangeError,
  hasPartialMonth,
} from '../src/api/npmDownloads.ts';

const NOW = new Date('2026-09-14T01:00:00Z');
const query = {
  packageName: 'react',
  startMonth: '2024-01',
  endMonth: '2024-12',
};

afterEach(() => vi.restoreAllMocks());

test('defaults to the current month, using UTC at year boundaries', () => {
  expect(getMonthRangeDefaults(NOW)).toStrictEqual({
    startMonth: '2025-09',
    endMonth: '2026-09',
    maxMonth: '2026-09',
  });
  expect(getMonthRangeDefaults(new Date('2026-01-01T00:30:00Z'))).toStrictEqual(
    {
      startMonth: '2025-01',
      endMonth: '2026-01',
      maxMonth: '2026-01',
    },
  );
});

test('on the first of a month, ranges stop at available history without an empty chunk', () => {
  const now = new Date('2026-01-01T00:30:00Z');
  const { startMonth, endMonth } = getMonthRangeDefaults(now);
  expect(getMonthRangeError(startMonth, endMonth, now)).toBeUndefined();
  expect(createDownloadRanges(startMonth, endMonth, now)).toStrictEqual([
    { start: '2025-01-01', end: '2025-12-31' },
  ]);
  expect(createDownloadRanges('2024-07', endMonth, now)).toStrictEqual([
    { start: '2024-07-01', end: '2025-12-31' },
  ]);
  expect(() => createDownloadRanges('2026-01', '2026-01', now)).toThrow(
    /not available/,
  );
});

test('a single month includes every day, including leap day', () => {
  expect(createDownloadRanges('2024-02', '2024-02', NOW)).toStrictEqual([
    { start: '2024-02-01', end: '2024-02-29' },
  ]);
  expect(createDownloadRanges('2023-02', '2023-02', NOW)).toStrictEqual([
    { start: '2023-02-01', end: '2023-02-28' },
  ]);
});

test('18 months use one request, and the 19th starts without overlap', () => {
  expect(createDownloadRanges('2023-03', '2024-08', NOW)).toStrictEqual([
    { start: '2023-03-01', end: '2024-08-31' },
  ]);
  expect(createDownloadRanges('2023-03', '2024-09', NOW)).toStrictEqual([
    { start: '2023-03-01', end: '2024-08-31' },
    { start: '2024-09-01', end: '2024-09-30' },
  ]);
});

test('multiple 18-month chunks and a remainder cover the entire range', () => {
  expect(createDownloadRanges('2021-01', '2024-01', NOW)).toStrictEqual([
    { start: '2021-01-01', end: '2022-06-30' },
    { start: '2022-07-01', end: '2023-12-31' },
    { start: '2024-01-01', end: '2024-01-31' },
  ]);
});

test("history boundaries are clamped to npm's first day and yesterday UTC", () => {
  expect(createDownloadRanges('2015-01', '2015-01', NOW)).toStrictEqual([
    { start: '2015-01-10', end: '2015-01-31' },
  ]);
  expect(createDownloadRanges('2026-09', '2026-09', NOW)).toStrictEqual([
    { start: '2026-09-01', end: '2026-09-13' },
  ]);
});

test('invalid, reversed, pre-history and future ranges are rejected', () => {
  for (const [start, end] of [
    ['', '2024-01'],
    ['2024-13', '2024-13'],
    ['2024-1', '2024-02'],
    ['2024-02', '2024-01'],
    ['2014-12', '2024-01'],
    ['2026-10', '2026-10'],
  ]) {
    expect(getMonthRangeError(start, end, NOW)).toBeTruthy();
    expect(() => createDownloadRanges(start, end, NOW)).toThrow();
  }
});

test('requests run in parallel and sum correctly when responses arrive out of order', async () => {
  const pending: Array<{ url: string; resolve: (response: Response) => void }> =
    [];
  const fetchMock = vi
    .spyOn(globalThis, 'fetch')
    .mockImplementation(
      (url) =>
        new Promise<Response>((resolve) =>
          pending.push({ url: String(url), resolve }),
        ),
    );
  const resultPromise = fetchPackageDownloads(
    {
      packageName: ' @szhsin/react-menu ',
      startMonth: '2021-01',
      endMonth: '2024-01',
    },
    NOW,
  );

  // All requests must be started before any response is available.
  expect(fetchMock).toHaveBeenCalledTimes(3);
  expect(
    pending.every(({ url }) => url.endsWith('/%40szhsin%2Freact-menu')),
  ).toBeTruthy();
  pending[2].resolve(pointResponse(pending[2].url, 30));
  pending[0].resolve(pointResponse(pending[0].url, 10));
  pending[1].resolve(pointResponse(pending[1].url, 20));

  expect(await resultPromise).toStrictEqual({
    packageName: '@szhsin/react-menu',
    startMonth: '2021-01',
    endMonth: '2024-01',
    totalDownloads: 60,
    startDate: '2021-01-01',
    endDate: '2024-01-31',
  });
});

test('zero downloads is a successful result', async () => {
  vi.spyOn(globalThis, 'fetch').mockImplementation(async (url) =>
    pointResponse(url, 0),
  );
  expect((await fetchPackageDownloads(query, NOW)).totalDownloads).toBe(0);
});

test('invalid package names and ranges never reach the network', async () => {
  const fetchMock = vi
    .spyOn(globalThis, 'fetch')
    .mockRejectedValue(new Error('Unexpected fetch'));
  for (const packageName of [
    '',
    ' ',
    'react,vue',
    'https://npmjs.com/react',
    '@scope',
    'a/b',
  ]) {
    await expect(
      fetchPackageDownloads({ ...query, packageName }, NOW),
    ).rejects.toThrow(/Enter a package name/);
  }
  await expect(
    fetchPackageDownloads({ ...query, startMonth: '2025-01' }, NOW),
  ).rejects.toThrow(/Start month/);
  expect(fetchMock).not.toHaveBeenCalled();
});

test('HTTP errors provide actionable messages', async () => {
  for (const [status, message] of [
    [404, /No download data found/],
    [409, /HTTP 409.*wait and try again later/],
    [429, /Rate limited.*429.*wait and try again later/],
    [503, /HTTP 503/],
  ] as const) {
    vi.spyOn(globalThis, 'fetch').mockImplementation(
      async () => new Response(null, { status }),
    );
    await expect(fetchPackageDownloads(query, NOW)).rejects.toThrow(message);
    vi.restoreAllMocks();
  }
});

test('one failed chunk rejects the total and aborts outstanding requests', async () => {
  const signals: AbortSignal[] = [];
  vi.spyOn(globalThis, 'fetch').mockImplementation(async (url, options) => {
    signals.push(options!.signal!);
    return signals.length === 2
      ? new Response(null, { status: 500 })
      : pointResponse(url, 100);
  });
  await expect(
    fetchPackageDownloads({ ...query, startMonth: '2021-01' }, NOW),
  ).rejects.toThrow(/HTTP 500/);
  expect(signals.length).toBe(3);
  expect(signals.every((signal) => signal.aborted)).toBeTruthy();
});

test('network failures and malformed payloads cannot become totals', async () => {
  const failure = new TypeError('Failed to fetch');
  vi.spyOn(globalThis, 'fetch').mockImplementation(async () => {
    throw failure;
  });
  const result = fetchPackageDownloads(query, NOW);
  await expect(result).rejects.toThrow(
    /may be rate limited.*connection issue.*wait and try again later/,
  );
  await expect(result).rejects.toHaveProperty('cause', failure);
  await expect(result).rejects.not.toThrow(/HTTP \d+/);
  vi.restoreAllMocks();

  vi.spyOn(globalThis, 'fetch').mockImplementation(
    async () => new Response('not json'),
  );
  await expect(fetchPackageDownloads(query, NOW)).rejects.toThrow(
    /invalid response/,
  );
  vi.restoreAllMocks();

  for (const body of [
    null,
    { error: 'package not found' },
    { package: 'react', start: '2024-01-01', end: '2024-12-31', downloads: -1 },
    { package: 'vue', start: '2024-01-01', end: '2024-12-31', downloads: 10 },
    { package: 'react', start: '2024-01-01', end: '2024-11-30', downloads: 10 },
  ]) {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async () =>
      Response.json(body),
    );
    await expect(fetchPackageDownloads(query, NOW)).rejects.toThrow(
      /unexpected download data/,
    );
    vi.restoreAllMocks();
  }
});

test('cancelled requests preserve the abort error instead of suggesting rate limiting', async () => {
  const controller = new AbortController();
  const abortError = new DOMException('Request cancelled', 'AbortError');
  controller.abort(abortError);
  vi.spyOn(globalThis, 'fetch').mockImplementation(async () => {
    throw abortError;
  });
  await expect(
    fetchPackageDownloads(query, NOW, controller.signal),
  ).rejects.toBe(abortError);
});

test('the actual API end date is retained when current-month reporting lags', async () => {
  vi.spyOn(globalThis, 'fetch').mockImplementation(async () =>
    Response.json({
      package: 'react',
      start: '2026-09-01',
      end: '2026-09-12',
      downloads: 10,
    }),
  );
  const stats = await fetchPackageDownloads(
    { ...query, startMonth: '2026-09', endMonth: '2026-09' },
    NOW,
  );
  expect(stats.endDate).toBe('2026-09-12');
  expect(hasPartialMonth(stats)).toBe(true);
});

test('result labels use the requested months and distinguish partial coverage', () => {
  expect(formatMonthRange('2024-02', '2024-02')).toBe('Feb 2024');
  expect(formatMonthRange('2023-01', '2024-12')).toBe('Jan 2023 – Dec 2024');
  expect(
    hasPartialMonth({
      ...query,
      totalDownloads: 0,
      startDate: '2024-01-01',
      endDate: '2024-12-31',
    }),
  ).toBe(false);
  expect(
    hasPartialMonth({
      ...query,
      startMonth: '2015-01',
      totalDownloads: 0,
      startDate: '2015-01-10',
      endDate: '2024-12-31',
    }),
  ).toBe(true);
});
