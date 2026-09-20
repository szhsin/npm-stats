import { readNpmCache, writeNpmCache } from './npmCache.ts';

interface NpmFetchOptions<T> {
  parse: (data: unknown) => T;
  signal?: AbortSignal;
  resource?: string;
  notFoundMessage?: string;
}

export async function fetchNpmJson<T>(
  url: string,
  {
    parse,
    signal,
    resource = 'downloads',
    notFoundMessage,
  }: NpmFetchOptions<T>,
): Promise<T> {
  signal?.throwIfAborted();
  const cached = readNpmCache(url, parse);
  if (cached !== undefined) return cached;

  const response = await fetch(url, { signal }).catch((error: unknown) => {
    if (signal?.aborted) throw error;
    // CORS failures hide the response status, including possible rate limits.
    throw new Error(
      'The request to npm failed. It may be rate limited or affected by a connection issue. Please wait and try again later.',
      { cause: error },
    );
  });

  if (!response.ok) {
    if (response.status === 404 && notFoundMessage) {
      throw new Error(notFoundMessage);
    }
    if (response.status === 429) {
      throw new Error(
        'Rate limited by npm (HTTP 429). Please wait and try again later.',
      );
    }
    throw new Error(
      `npm could not load ${resource} (HTTP ${response.status}). Please wait and try again later.`,
    );
  }

  const data: unknown = await response.json().catch(() => {
    signal?.throwIfAborted();
    throw new Error('npm returned an invalid response. Please retry.');
  });
  signal?.throwIfAborted();
  const result = parse(data);
  writeNpmCache(url, data);
  return result;
}
