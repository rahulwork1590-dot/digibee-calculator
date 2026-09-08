// display config for the form (safe to ship to the browser)

export type CurrencyMeta = {
  code: string;
  symbol: string;
  label: string;
  locale: string;
};

export const CURRENCIES: CurrencyMeta[] = [
  { code: "USD", symbol: "$", label: "US Dollar", locale: "en-US" },
  { code: "EUR", symbol: "€", label: "Euro", locale: "en-IE" },
  { code: "GBP", symbol: "£", label: "British Pound", locale: "en-GB" },
  { code: "AUD", symbol: "A$", label: "Australian Dollar", locale: "en-AU" },
  { code: "CAD", symbol: "C$", label: "Canadian Dollar", locale: "en-CA" },
  { code: "NOK", symbol: "kr", label: "Norwegian Krone", locale: "nb-NO" },
  { code: "SEK", symbol: "kr", label: "Swedish Krona", locale: "sv-SE" },
  { code: "INR", symbol: "₹", label: "Indian Rupee", locale: "en-IN" },
];

export const DEFAULT_CURRENCY = "USD";

export function currencyMeta(code: string): CurrencyMeta {
  return CURRENCIES.find((c) => c.code === code) ?? CURRENCIES[0];
}

export const CALCULATOR = {
  id: "campaign-budget-optimizer",
  name: "Campaign Budget Optimizer",
  tagline: "Find the spend that's quietly losing money — and where to move it.",
};

// the server enforces these too; here they're just for the form
export const LIMITS = {
  maxCampaigns: 15,
  minCampaigns: 1,
  maxMoney: 100_000_000,
  maxMarginPct: 95,
  minMarginPct: 1,
};
