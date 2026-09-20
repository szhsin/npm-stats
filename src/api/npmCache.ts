const CACHE_PREFIX = 'npm-stats:json:v1:';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const MAX_CACHE_ENTRIES = 200;

interface CacheEntry {
  storedAt: number;
  data: unknown;
}

function readEntry(storage: Storage, key: string): CacheEntry | undefined {
  const raw = storage.getItem(key);
  if (raw === null) return;

  try {
    const entry: unknown = JSON.parse(raw);
    if (
      typeof entry === 'object' &&
      entry !== null &&
      'storedAt' in entry &&
      typeof entry.storedAt === 'number' &&
      'data' in entry
    ) {
      const age = Date.now() - entry.storedAt;
      if (age >= 0 && age < CACHE_TTL_MS) {
        return { storedAt: entry.storedAt, data: entry.data };
      }
    }
  } catch {
    // Discard corrupted entries just like expired ones.
  }
  storage.removeItem(key);
}

export function readNpmCache<T>(
  url: string,
  parse: (data: unknown) => T,
): T | undefined {
  if (!('window' in globalThis)) return;
  try {
    const storage = globalThis.localStorage;
    const key = CACHE_PREFIX + url;
    const entry = readEntry(storage, key);
    if (entry) {
      try {
        return parse(entry.data);
      } catch {
        storage.removeItem(key);
      }
    }
  } catch {
    // Storage may be disabled; fetching must still work.
  }
}

export function writeNpmCache(url: string, data: unknown): void {
  if (!('window' in globalThis)) return;
  try {
    const storage = globalThis.localStorage;
    const key = CACHE_PREFIX + url;
    const entries: { key: string; storedAt: number }[] = [];
    // Prune expired data and bound storage without touching other app settings.
    for (let index = storage.length - 1; index >= 0; index--) {
      const existingKey = storage.key(index);
      if (!existingKey?.startsWith(CACHE_PREFIX) || existingKey === key)
        continue;
      const entry = readEntry(storage, existingKey);
      if (entry) entries.push({ key: existingKey, storedAt: entry.storedAt });
    }
    entries.sort((a, b) => a.storedAt - b.storedAt);
    for (const entry of entries.slice(
      0,
      Math.max(0, entries.length - MAX_CACHE_ENTRIES + 1),
    )) {
      storage.removeItem(entry.key);
    }
    storage.setItem(key, JSON.stringify({ storedAt: Date.now(), data }));
  } catch {
    // A full or unavailable cache must not turn a successful request into an error.
  }
}
