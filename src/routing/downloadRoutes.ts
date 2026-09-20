import { normalizeAuthorName } from '../api/npmAuthors.ts';
import { getMonthRangeDefaults, type MonthRange } from '../api/npmDownloads.ts';

export type DownloadTab = 'package' | 'author';

export interface DownloadRouteValues extends MonthRange {
  name: string;
}

export function normalizeDownloadName(tab: DownloadTab, name: string): string {
  return tab === 'author' ? normalizeAuthorName(name) : name.trim();
}

export function readDownloadSearch(
  tab: DownloadTab,
  search: string,
  now = new Date(),
): DownloadRouteValues {
  const params = new URLSearchParams(search);
  const defaults = getMonthRangeDefaults(now);
  return {
    name: normalizeDownloadName(tab, params.get(tab) ?? ''),
    startMonth: params.get('from') ?? defaults.startMonth,
    endMonth: params.get('to') ?? defaults.endMonth,
  };
}

export function createDownloadUrl(
  tab: DownloadTab,
  name: string,
  range: MonthRange,
): string {
  const params = new URLSearchParams();
  const normalizedName = normalizeDownloadName(tab, name);
  if (normalizedName) params.set(tab, normalizedName);
  params.set('from', range.startMonth);
  params.set('to', range.endMonth);
  return `${tab === 'author' ? '/author' : '/'}?${params}`;
}
