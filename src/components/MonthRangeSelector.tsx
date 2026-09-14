import {
  FIRST_DOWNLOAD_MONTH,
  getMonthRangeDefaults,
  type MonthRange,
} from "../api/npmDownloads";

interface MonthRangeSelectorProps {
  idPrefix: string;
  range: MonthRange;
  onChange: (range: MonthRange) => void;
  error?: string;
}

export function MonthRangeSelector({
  idPrefix,
  range,
  onChange,
  error,
}: MonthRangeSelectorProps) {
  const hintId = `${idPrefix}-range-hint`;
  const errorId = `${idPrefix}-range-error`;
  const { maxMonth } = getMonthRangeDefaults();
  const includesFirstMonth = range.startMonth === FIRST_DOWNLOAD_MONTH;
  const hint = error
    ? ""
    : [
        includesFirstMonth &&
          "npm only provides download data from January 2015 onward.",
        (includesFirstMonth || range.endMonth === maxMonth) &&
          "This range includes a partial month.",
      ]
        .filter(Boolean)
        .join(" ");

  return (
    <>
      <div className="month-range" role="group" aria-label="Download date range">
        {(
          [
            ["startMonth", "From"],
            ["endMonth", "To"],
          ] as const
        ).map(([field, label]) => (
          <label
            className="month-field"
            key={field}
            htmlFor={`${idPrefix}-${field}`}
          >
            {label}
            <input
              id={`${idPrefix}-${field}`}
              type="month"
              className="month-input"
              value={range[field]}
              min={FIRST_DOWNLOAD_MONTH}
              max={maxMonth}
              required
              aria-describedby={error ? errorId : hint ? hintId : undefined}
              aria-invalid={Boolean(error)}
              onChange={(event) =>
                onChange({ ...range, [field]: event.target.value })
              }
            />
          </label>
        ))}
      </div>
      {hint && (
        <p className="range-hint" id={hintId}>
          {hint}
        </p>
      )}
      {error && (
        <p className="range-error" id={errorId} role="alert">
          {error}
        </p>
      )}
    </>
  );
}
