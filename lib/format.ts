// Currency datasets store values in thousands; counts are raw integers.

export function formatValue(
  value: number,
  unit: "currency" | "count",
  currencyCode = "EUR",
): string {
  if (unit === "currency") {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: currencyCode,
      notation: "compact",
      maximumFractionDigits: 2,
    }).format(value * 1000);
  }
  return new Intl.NumberFormat("en-GB").format(value);
}

export function formatPct(pct: number): string {
  const sign = pct > 0 ? "+" : "";
  return `${sign}${pct}%`;
}
