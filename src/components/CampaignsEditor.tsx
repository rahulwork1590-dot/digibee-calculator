"use client";

import { currencyMeta } from "@/lib/config";

export type CampaignRow = {
  id: string;
  name: string;
  spend: string;
  revenue: string;
};

export function newRow(name = ""): CampaignRow {
  return { id: crypto.randomUUID(), name, spend: "", revenue: "" };
}

const inputClass =
  "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none transition placeholder:text-muted/60 focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:opacity-60";

function MoneyInput({
  symbol,
  value,
  onChange,
  disabled,
  ariaLabel,
}: Readonly<{
  symbol: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  ariaLabel: string;
}>) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted">
        {symbol}
      </span>
      <input
        type="number"
        inputMode="decimal"
        min="0"
        step="any"
        value={value}
        disabled={disabled}
        aria-label={ariaLabel}
        onChange={(e) => onChange(e.target.value)}
        placeholder="0"
        className={`${inputClass} pl-9 tabular-nums`}
      />
    </div>
  );
}

function Field({ label, children }: Readonly<{ label: string; children: React.ReactNode }>) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-muted md:hidden">{label}</span>
      {children}
    </label>
  );
}

type Props = {
  rows: CampaignRow[];
  currency: string;
  disabled?: boolean;
  maxRows: number;
  onChange: (rows: CampaignRow[]) => void;
};

export default function CampaignsEditor({ rows, currency, disabled, maxRows, onChange }: Readonly<Props>) {
  const symbol = currencyMeta(currency).symbol;

  const update = (id: string, patch: Partial<CampaignRow>) =>
    onChange(rows.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  const remove = (id: string) => onChange(rows.filter((r) => r.id !== id));
  const add = () => {
    if (rows.length < maxRows) onChange([...rows, newRow()]);
  };

  return (
    <div className="space-y-3">
      <div className="hidden gap-3 px-1 text-xs font-medium uppercase tracking-wide text-muted md:grid md:grid-cols-[1.6fr_1fr_1fr_auto]">
        <span>Campaign</span>
        <span>Monthly spend</span>
        <span>Revenue generated</span>
        <span className="sr-only">Remove</span>
      </div>

      {rows.map((row, i) => {
        const fallbackName = row.name || `campaign ${i + 1}`;
        return (
        <div
          key={row.id}
          className="space-y-2 rounded-xl border border-border bg-surface-muted p-3 md:grid md:grid-cols-[1.6fr_1fr_1fr_auto] md:items-center md:gap-3 md:space-y-0 md:border-0 md:bg-transparent md:p-0"
        >
          <Field label="Campaign name">
            <input
              type="text"
              value={row.name}
              disabled={disabled}
              onChange={(e) => update(row.id, { name: e.target.value })}
              placeholder={`Campaign ${i + 1}`}
              maxLength={60}
              className={inputClass}
            />
          </Field>
          <Field label="Monthly spend">
            <MoneyInput
              symbol={symbol}
              value={row.spend}
              disabled={disabled}
              ariaLabel={`Monthly spend for ${fallbackName}`}
              onChange={(v) => update(row.id, { spend: v })}
            />
          </Field>
          <Field label="Revenue generated">
            <MoneyInput
              symbol={symbol}
              value={row.revenue}
              disabled={disabled}
              ariaLabel={`Revenue for ${fallbackName}`}
              onChange={(v) => update(row.id, { revenue: v })}
            />
          </Field>
          <button
            type="button"
            onClick={() => remove(row.id)}
            disabled={disabled || rows.length <= 1}
            className="flex w-full items-center justify-center rounded-lg border border-border py-2 text-sm text-muted transition hover:border-danger hover:text-danger disabled:cursor-not-allowed disabled:opacity-40 md:h-9 md:w-9 md:py-0"
          >
            <span className="md:hidden">Remove</span>
            <span className="hidden md:inline" aria-hidden>
              ✕
            </span>
          </button>
        </div>
        );
      })}

      <button
        type="button"
        onClick={add}
        disabled={disabled || rows.length >= maxRows}
        className="rounded-lg border border-dashed border-border px-4 py-2 text-sm font-medium text-accent transition hover:border-accent hover:bg-accent-soft disabled:cursor-not-allowed disabled:opacity-40"
      >
        + Add campaign
      </button>
    </div>
  );
}
