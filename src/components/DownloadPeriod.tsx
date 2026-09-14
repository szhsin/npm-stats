import { formatMonthRange, type MonthRange } from "../api/npmDownloads";

interface DownloadPeriodProps {
  range: MonthRange;
  partial: boolean;
}

export function DownloadPeriod({ range, partial }: DownloadPeriodProps) {
  return (
    <div className="stat-period">
      {formatMonthRange(range.startMonth, range.endMonth)}
      {partial && " · Includes a partial month"}
    </div>
  );
}
