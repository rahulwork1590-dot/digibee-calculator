"use client";

import { useRef, useState } from "react";

import CampaignsEditor, { type CampaignRow } from "@/components/CampaignsEditor";
import LeadGate, { type LeadForm } from "@/components/LeadGate";
import ResultsView from "@/components/ResultsView";
import { CURRENCIES, DEFAULT_CURRENCY, LIMITS } from "@/lib/config";
import type { OptimizeResponse, OptimizeResult } from "@/lib/types";

function seedRows(): CampaignRow[] {
  return [
    { id: "seed-0", name: "", spend: "", revenue: "" },
    { id: "seed-1", name: "", spend: "", revenue: "" },
    { id: "seed-2", name: "", spend: "", revenue: "" },
  ];
}

const SAMPLE: { margin: string; currency: string; rows: CampaignRow[] } = {
  margin: "60",
  currency: "USD",
  rows: [
    { id: "s1", name: "Meta – Prospecting", spend: "18000", revenue: "41000" },
    { id: "s2", name: "Meta – Retargeting", spend: "6000", revenue: "24000" },
    { id: "s3", name: "Google – Brand", spend: "3000", revenue: "15000" },
    { id: "s4", name: "Google – Shopping", spend: "12000", revenue: "21000" },
    { id: "s5", name: "TikTok – Prospecting", spend: "9000", revenue: "9500" },
    { id: "s6", name: "Pinterest – Test", spend: "4000", revenue: "3800" },
  ],
};

const emptyLead: LeadForm = { name: "", email: "", company: "", consent: false };

export default function OptimizerApp() {
  const [currency, setCurrency] = useState(DEFAULT_CURRENCY);
  const [margin, setMargin] = useState("");
  const [rows, setRows] = useState<CampaignRow[]>(seedRows);

  const [gateOpen, setGateOpen] = useState(false);
  const [lead, setLead] = useState<LeadForm>(emptyLead);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [gateError, setGateError] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState(false);

  const [formError, setFormError] = useState<string | undefined>();
  const [result, setResult] = useState<OptimizeResult | null>(null);

  const resultsRef = useRef<HTMLDivElement>(null);

  function loadSample() {
    setCurrency(SAMPLE.currency);
    setMargin(SAMPLE.margin);
    setRows(SAMPLE.rows.map((r) => ({ ...r })));
    setFormError(undefined);
  }

  function validateInputs(): boolean {
    const m = Number(margin);
    if (!margin || !Number.isFinite(m) || m < LIMITS.minMarginPct || m > LIMITS.maxMarginPct) {
      setFormError(`Enter a gross margin between ${LIMITS.minMarginPct}% and ${LIMITS.maxMarginPct}%.`);
      return false;
    }
    const filled = rows.filter((r) => r.spend.trim() !== "" || r.revenue.trim() !== "");
    if (filled.length === 0) {
      setFormError("Add at least one campaign with spend and revenue.");
      return false;
    }
    for (const r of filled) {
      const s = Number(r.spend);
      const rev = Number(r.revenue);
      if (!Number.isFinite(s) || s <= 0) {
        setFormError(`Enter a spend greater than zero for "${r.name || "each campaign"}".`);
        return false;
      }
      if (!Number.isFinite(rev) || rev < 0) {
        setFormError(`Enter the revenue for "${r.name || "each campaign"}".`);
        return false;
      }
    }
    setFormError(undefined);
    return true;
  }

  function openGate() {
    if (!validateInputs()) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    setGateError(undefined);
    setFieldErrors({});
    setGateOpen(true);
  }

  async function submit() {
    setSubmitting(true);
    setGateError(undefined);
    setFieldErrors({});

    const input = {
      currency,
      grossMargin: Number(margin),
      campaigns: rows
        .filter((r) => r.spend.trim() !== "" || r.revenue.trim() !== "")
        .map((r) => ({ name: r.name, spend: Number(r.spend), revenue: Number(r.revenue) })),
    };

    try {
      const res = await fetch("/api/optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input, lead }),
      });
      const data: OptimizeResponse = await res.json();
      if (!data.ok) {
        setFieldErrors(data.fields ?? {});
        setGateError(data.error);
        return;
      }
      setResult(data.result);
      setGateOpen(false);
      setLead((l) => ({ ...l, consent: false }));
      requestAnimationFrame(() =>
        resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }),
      );
    } catch {
      setGateError("Something went wrong reaching the server. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (result) {
    return (
      <div ref={resultsRef}>
        <ResultsView result={result} onEdit={() => setResult(null)} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-2xl border border-border bg-surface">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
          <div>
            <h2 className="font-semibold text-foreground">Your campaigns</h2>
            <p className="text-xs text-muted">Enter last month&apos;s spend and revenue per campaign.</p>
          </div>
          <button
            type="button"
            onClick={loadSample}
            className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-accent transition hover:border-accent hover:bg-accent-soft"
          >
            Load sample data
          </button>
        </div>

        <div className="space-y-5 p-5">
          {/* Global inputs */}
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-foreground">Gross margin</span>
              <div className="relative">
                <input
                  type="number"
                  inputMode="decimal"
                  min="1"
                  max="95"
                  step="any"
                  value={margin}
                  onChange={(e) => setMargin(e.target.value)}
                  placeholder="60"
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2 pr-8 text-sm text-foreground outline-none transition placeholder:text-muted/60 focus:border-accent focus:ring-2 focus:ring-accent/20"
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted">
                  %
                </span>
              </div>
              <p className="mt-1 text-xs text-muted">
                After COGS, shipping &amp; fees — the share of revenue left before ad spend.
              </p>
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-foreground">Reporting currency</span>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
              >
                {CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.code} — {c.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <CampaignsEditor
            rows={rows}
            currency={currency}
            maxRows={LIMITS.maxCampaigns}
            onChange={setRows}
          />

          {formError && (
            <div className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{formError}</div>
          )}

          <button
            type="button"
            onClick={openGate}
            className="w-full rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-accent-foreground transition hover:opacity-90 sm:w-auto sm:px-8"
          >
            Analyze my campaigns →
          </button>
        </div>
      </div>

      <LeadGate
        open={gateOpen}
        value={lead}
        errors={fieldErrors}
        submitting={submitting}
        error={gateError}
        onChange={(patch) => setLead((l) => ({ ...l, ...patch }))}
        onSubmit={submit}
        onClose={() => setGateOpen(false)}
      />
    </div>
  );
}
