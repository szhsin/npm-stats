import { useState } from "react";
import { getMonthRangeError, type MonthRange } from "../api/npmDownloads";

export function useMonthRange({ startMonth, endMonth }: MonthRange) {
  const [range, setRange] = useState({ startMonth, endMonth });
  const error = getMonthRangeError(range.startMonth, range.endMonth);
  return { range, setRange, error };
}
