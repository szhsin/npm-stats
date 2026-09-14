import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { fetchAuthorDownloads } from "../src/api/npmAuthors.ts";
import { fetchPackageDownloads } from "../src/api/npmDownloads.ts";
import { pointResponse, searchResponse } from "./helpers/npmResponses.ts";

const NOW = new Date("2026-09-16T01:00:00Z");
const DAY_MS = 24 * 60 * 60 * 1000;
const query = { packageName: "react", startMonth: "2024-01", endMonth: "2024-12" };
let entries: Map<string, string>;
let storage: Storage;
let currentTime: number;

beforeEach(() => {
  entries = new Map();
  storage = {
    get length() { return entries.size; },
    key: (index) => [...entries.keys()][index] ?? null,
    getItem: (key) => entries.get(key) ?? null,
    setItem: (key, value) => { entries.set(key, value); },
    removeItem: (key) => { entries.delete(key); },
    clear: () => entries.clear(),
  };
  vi.stubGlobal("window", globalThis);
  vi.stubGlobal("localStorage", storage);
  currentTime = NOW.getTime();
  vi.spyOn(Date, "now").mockImplementation(() => currentTime);
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

test("responses are reused for 24 hours without extending expiry on a cache hit", async () => {
  let downloads = 10;
  const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(async (url) => pointResponse(url, downloads));
  expect((await fetchPackageDownloads(query, NOW)).totalDownloads).toBe(10);

  downloads = 20;
  currentTime += DAY_MS - 1;
  expect((await fetchPackageDownloads(query, NOW)).totalDownloads).toBe(10);
  expect(fetchMock).toHaveBeenCalledTimes(1);

  currentTime += 1;
  expect((await fetchPackageDownloads(query, NOW)).totalDownloads).toBe(20);
  expect(fetchMock).toHaveBeenCalledTimes(2);
});

test("author requests populate the same package cache, with separate keys for packages and date ranges", async () => {
  const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(async (url) =>
    String(url).startsWith("https://registry.npmjs.org/")
      ? searchResponse(["react"])
      : pointResponse(url),
  );
  const authorQuery = { authorName: "example", startMonth: query.startMonth, endMonth: query.endMonth };
  const result = await fetchAuthorDownloads(authorQuery, NOW);
  expect(result.totalCombinedDownloads).toBe(10);
  expect(await fetchAuthorDownloads(authorQuery, NOW)).toStrictEqual(result);
  expect((await fetchPackageDownloads(query, NOW)).totalDownloads).toBe(10);
  expect(fetchMock).toHaveBeenCalledTimes(2);

  await fetchPackageDownloads({ ...query, packageName: "@scope/package" }, NOW);
  await fetchPackageDownloads({ ...query, endMonth: "2024-11" }, NOW);
  expect(fetchMock).toHaveBeenCalledTimes(4);
});

test("current-month data uses a new request URL when another day becomes available", async () => {
  const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(async (url) => pointResponse(url));
  const currentQuery = { ...query, startMonth: "2026-09", endMonth: "2026-09" };
  const beforeMidnight = new Date("2026-09-16T23:59:00Z");
  const afterMidnight = new Date("2026-09-17T00:01:00Z");
  currentTime = beforeMidnight.getTime();
  expect((await fetchPackageDownloads(currentQuery, beforeMidnight)).endDate).toBe("2026-09-15");
  currentTime = afterMidnight.getTime();
  expect((await fetchPackageDownloads(currentQuery, afterMidnight)).endDate).toBe("2026-09-16");
  expect(fetchMock).toHaveBeenCalledTimes(2);
});

test("HTTP failures, network failures, invalid JSON and invalid download data are never cached", async () => {
  for (const respond of [
    () => new Response(null, { status: 429 }),
    () => { throw new TypeError("Failed to fetch"); },
    () => new Response("not json"),
    () => Response.json({ error: "unavailable" }),
  ]) {
    entries.clear();
    let fail = true;
    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(async (url) => fail ? respond() : pointResponse(url));
    await expect(fetchPackageDownloads(query, NOW)).rejects.toThrow();
    expect(entries.size).toBe(0);
    fail = false;
    expect((await fetchPackageDownloads(query, NOW)).totalDownloads).toBe(10);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    fetchMock.mockRestore();
  }
});

test("invalid author search data is not cached", async () => {
  vi.spyOn(globalThis, "fetch").mockImplementation(async () => Response.json({ objects: [{}], total: 1 }));
  await expect(fetchAuthorDownloads({ ...query, authorName: "example" }, NOW)).rejects.toThrow(/unexpected author package data/);
  expect(entries.size).toBe(0);
});

test("corrupted and invalid cached payloads fall back to fetching", async () => {
  const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(async (url) => pointResponse(url));
  await fetchPackageDownloads(query, NOW);
  const key = [...entries.keys()][0];
  for (const raw of [
    "not json", "null", "{}",
    JSON.stringify({ storedAt: currentTime, data: { downloads: -1 } }),
    JSON.stringify({ storedAt: currentTime + DAY_MS, data: {} }),
  ]) {
    entries.set(key, raw);
    expect((await fetchPackageDownloads(query, NOW)).totalDownloads).toBe(10);
  }
  expect(fetchMock).toHaveBeenCalledTimes(6);
});

test("unavailable or full browser storage does not prevent successful queries", async () => {
  const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(async (url) => pointResponse(url));
  const deniedRead = vi.spyOn(storage, "getItem").mockImplementation(() => { throw new Error("Storage blocked"); });
  const deniedWrite = vi.spyOn(storage, "setItem").mockImplementation(() => { throw new Error("Quota exceeded"); });
  expect((await fetchPackageDownloads(query, NOW)).totalDownloads).toBe(10);
  deniedRead.mockRestore();
  expect((await fetchPackageDownloads(query, NOW)).totalDownloads).toBe(10);
  expect(fetchMock).toHaveBeenCalledTimes(2);
  expect(entries.size).toBe(0);
  deniedWrite.mockRestore();
});

test("an aborted request cannot return cached data", async () => {
  const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(async (url) => pointResponse(url));
  await fetchPackageDownloads(query, NOW);
  const controller = new AbortController();
  controller.abort();
  await expect(fetchPackageDownloads(query, NOW, controller.signal)).rejects.toMatchObject({ name: "AbortError" });
  expect(fetchMock).toHaveBeenCalledTimes(1);
});

test("cache pruning bounds storage and removes expired entries without touching other settings", async () => {
  entries.set("theme", "dark");
  vi.spyOn(globalThis, "fetch").mockImplementation(async (url) => pointResponse(url));
  for (let index = 0; index < 201; index++) {
    currentTime++;
    await fetchPackageDownloads({ ...query, packageName: `package-${index}` }, NOW);
  }
  expect(entries.size).toBe(201);
  expect(entries.get("theme")).toBe("dark");
  expect([...entries.keys()].some((key) => key.endsWith("/package-0"))).toBe(false);

  currentTime += DAY_MS;
  await fetchPackageDownloads(query, NOW);
  expect(entries.size).toBe(2);
  expect(entries.get("theme")).toBe("dark");
});
