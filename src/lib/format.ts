import { currencyMeta } from "./config";

export function formatMoney(value: number, currency: string): string {
  const meta = currencyMeta(currency);
  const safe = Number.isFinite(value) ? value : 0;
  return new Intl.NumberFormat(meta.locale, {
    style: "currency",
    currency: meta.code,
    maximumFractionDigits: 0,
  }).format(safe);
}

export function formatMoneySigned(value: number, currency: string): string {
  let sign = "";
  if (value > 0) sign = "+";
  else if (value < 0) sign = "−";
  return `${sign}${formatMoney(Math.abs(value), currency)}`;
}

export function formatMultiple(value: number): string {
  const safe = Number.isFinite(value) ? value : 0;
  return `${safe.toFixed(2)}×`;
}

export function formatPercent(value: number, digits = 1): string {
  const safe = Number.isFinite(value) ? value : 0;
  return `${safe.toFixed(digits)}%`;
}
