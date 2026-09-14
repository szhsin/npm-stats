import { expect, test } from "vitest";
import { getMonthRangeError } from "../src/api/npmDownloads.ts";
import { createDownloadUrl, readDownloadSearch } from "../src/routing/downloadRoutes.ts";

const NOW = new Date("2026-09-16T01:00:00Z");
const defaults = { startMonth: "2025-09", endMonth: "2026-09" };

test("bare routes have an empty name and the current default month range", () => {
  for (const tab of ["package", "author"] as const) {
    expect(readDownloadSearch(tab, "", NOW)).toStrictEqual({ name: "", ...defaults });
    expect(readDownloadSearch(tab, `${tab}=%20%20`, NOW).name).toBe("");
  }
});

test("missing months independently fall back to defaults", () => {
  expect(readDownloadSearch("package", "package=react&from=2024-02", NOW)).toStrictEqual({
    name: "react", startMonth: "2024-02", endMonth: defaults.endMonth,
  });
  expect(readDownloadSearch("author", "author=example&to=2026-08", NOW)).toStrictEqual({
    name: "example", startMonth: defaults.startMonth, endMonth: "2026-08",
  });
});

test("each route only reads its own name parameter", () => {
  expect(readDownloadSearch("package", "author=example", NOW).name).toBe("");
  expect(readDownloadSearch("author", "package=react", NOW).name).toBe("");
  expect(readDownloadSearch("package", "package=react&author=example", NOW).name).toBe("react");
  expect(readDownloadSearch("author", "package=react&author=example", NOW).name).toBe("example");
});

test("scoped package names and explicit months round-trip through package links", () => {
  const range = { startMonth: "2023-03", endMonth: "2024-09" };
  const url = createDownloadUrl("package", " @scope/my-package ", range);
  expect(url).toBe("/?package=%40scope%2Fmy-package&from=2023-03&to=2024-09");
  expect(readDownloadSearch("package", new URL(url, "https://example.com").search, NOW)).toStrictEqual({
    name: "@scope/my-package", ...range,
  });
});

test("author links normalize usernames and use the author path", () => {
  const url = createDownloadUrl("author", " @Example ", defaults);
  expect(url).toBe("/author?author=example&from=2025-09&to=2026-09");
  expect(readDownloadSearch("author", "author=%20%40Example%20", NOW)).toStrictEqual({
    name: "example", ...defaults,
  });
});

test("a month-only URL does not invent a package or author name", () => {
  for (const tab of ["package", "author"] as const) {
    const url = new URL(createDownloadUrl(tab, "", defaults), "https://example.com");
    expect(url.searchParams.has(tab)).toBe(false);
    expect(readDownloadSearch(tab, url.search, NOW)).toStrictEqual({ name: "", ...defaults });
  }
});

test("explicit empty or invalid months are retained for validation, not silently replaced", () => {
  for (const search of [
    "package=react&from=", "package=react&to=bad-date",
    "package=react&from=2026-08&to=2026-07", "package=react&to=2099-01",
  ]) {
    const values = readDownloadSearch("package", search, NOW);
    expect(getMonthRangeError(values.startMonth, values.endMonth, NOW)).toBeTruthy();
  }
  expect(readDownloadSearch("package", "from=", NOW).startMonth).toBe("");
});
