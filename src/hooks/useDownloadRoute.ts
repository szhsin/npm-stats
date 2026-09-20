import { useState, type FormEvent } from 'react';
import { useLocation } from 'wouter';
import { getMonthRangeError } from '../api/npmDownloads';
import {
  createDownloadUrl,
  normalizeDownloadName,
  readDownloadSearch,
  type DownloadTab,
} from '../routing/downloadRoutes';
import { useMonthRange } from './useMonthRange';

// Route pages are keyed by their search string to restore form state on navigation.
export function useDownloadRoute(tab: DownloadTab, search: string) {
  const [, navigate] = useLocation();
  const request = readDownloadSearch(tab, search);
  const [name, setName] = useState(request.name);
  const months = useMonthRange(request);
  const normalizedName = normalizeDownloadName(tab, name);
  const canSubmit = Boolean(normalizedName) && !months.error;
  const enabled =
    Boolean(request.name) &&
    !getMonthRangeError(request.startMonth, request.endMonth);

  const submit = (
    event: FormEvent,
    isFetching: boolean,
    refetch: () => unknown,
  ) => {
    event.preventDefault();
    if (!canSubmit || isFetching) return;

    const url = createDownloadUrl(tab, normalizedName, months.range);
    if (url === createDownloadUrl(tab, request.name, request)) {
      void refetch();
    } else {
      navigate(url);
    }
  };

  return { request, name, setName, months, enabled, canSubmit, submit };
}
