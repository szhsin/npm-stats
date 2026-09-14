const numberFormatter = new Intl.NumberFormat("en-US");
const compactFormatter = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 2,
});

export const formatNumber = (number: number) => numberFormatter.format(number);
export const formatCompactNumber = (number: number) => compactFormatter.format(number);
