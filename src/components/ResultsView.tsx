"use client";

import { formatMoney, formatMoneySigned, formatMultiple, formatPercent } from "@/lib/format";
import type { CampaignResult, CampaignVerdict, OptimizeResult } from "@/lib/types";

function StatCard({
  label,
  value,
  hint,
  tone = "default",
}: Readonly<{
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "danger" | "success";
}>) {
  let valueTone = "text-foreground";
  if (tone === "danger") valueTone = "text-danger";
  else if (tone === "success") valueTone = "text-success";
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="text-xs font-medium uppercase tracking-wide text-muted">{label}</div>
      <div className={`mt-1 text-2xl font-semibold tabular-nums ${valueTone}`}>{value}</div>
      {hint && <div className="mt-0.5 text-xs text-muted">{hint}</div>}
    </div>
  );
}

const verdictStyles: Record<CampaignVerdict, { badge: string; label: string }> = {
  SCALE: { badge: "bg-success-soft text-success", label: "Scale" },
  KEEP: { badge: "bg-warning-soft text-warning", label: "Keep" },
  CUT: { badge: "bg-danger-soft text-danger", label: "Cut" },
};

function VerdictBadge({ status }: Readonly<{ status: CampaignVerdict }>) {
  const s = verdictStyles[status];
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${s.badge}`}>
      {s.label}
    </span>
  );
}

function CampaignRow({ c, currency }: Readonly<{ c: CampaignResult; currency: string }>) {
  return (
    <div className="space-y-2 rounded-xl border border-border bg-surface p-4 md:grid md:grid-cols-[1.8fr_0.7fr_1fr_1fr_auto] md:items-center md:gap-3 md:space-y-0 md:rounded-none md:border-0 md:border-b md:border-border md:bg-transparent md:p-3">
      <div>
        <div className="font-medium text-foreground">{c.name}</div>
        <div className="mt-0.5 text-xs text-muted">{c.note}</div>
      </div>
      <div className="flex justify-between md:block">
        <span className="text-xs text-muted md:hidden">ROAS</span>
        <span className="tabular-nums">{formatMultiple(c.roas)}</span>
      </div>
      <div className="flex justify-between md:block">
        <span className="text-xs text-muted md:hidden">Spend</span>
        <span className="tabular-nums">{formatMoney(c.spend, currency)}</span>
      </div>
      <div className="flex justify-between md:block">
        <span className="text-xs text-muted md:hidden">Monthly profit</span>
        <span
          className={`tabular-nums ${c.contribution < 0 ? "text-danger" : "text-foreground"}`}
        >
          {formatMoneySigned(c.contribution, currency)}
        </span>
      </div>
      <div className="flex justify-between md:block md:justify-self-end">
        <span className="text-xs text-muted md:hidden">Verdict</span>
        <VerdictBadge status={c.status} />
      </div>
    </div>
  );
}

export default function ResultsView({
  result,
  onEdit,
}: Readonly<{
  result: OptimizeResult;
  onEdit: () => void;
}>) {
  const { currency, totals, reallocation } = result;
  const healthy = reallocation.monthlyUplift <= 0;

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div
        className={`rounded-2xl border p-6 md:p-8 ${
          healthy
            ? "border-success/20 bg-success-soft"
            : "border-accent/20 bg-accent-soft"
        }`}
      >
        {healthy ? (
          <>
            <div className="text-sm font-medium text-success">Portfolio looks healthy</div>
            <div className="mt-2 text-2xl font-semibold text-foreground md:text-3xl">
              Your budget is already working hard.
            </div>
          </>
        ) : (
          <>
            <div className="text-sm font-medium text-accent">
              Estimated profit you could unlock
            </div>
            <div className="mt-2 text-4xl font-bold tabular-nums text-foreground md:text-5xl">
              {formatMoney(reallocation.annualUplift, currency)}
              <span className="ml-2 text-base font-medium text-muted">/ year</span>
            </div>
            <div className="mt-1 text-sm text-muted">
              ≈ {formatMoney(reallocation.monthlyUplift, currency)} per month by pausing losers and
              reallocating to winners.
            </div>
          </>
        )}
        <p className="mt-4 max-w-2xl text-sm text-foreground/80">{result.headline}</p>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Blended ROAS"
          value={formatMultiple(totals.blendedRoas)}
          hint={`Break-even at ${formatMultiple(result.breakEvenRoas)}`}
        />
        <StatCard
          label="Current monthly profit"
          value={formatMoney(totals.contribution, currency)}
          hint={`${formatPercent(totals.contributionMargin)} contribution margin`}
          tone={totals.contribution < 0 ? "danger" : "default"}
        />
        <StatCard
          label="Bleeding / month"
          value={formatMoney(result.monthlyBleed, currency)}
          hint={`${result.counts.cut} campaign${result.counts.cut === 1 ? "" : "s"} below break-even`}
          tone={result.monthlyBleed > 0 ? "danger" : "default"}
        />
        <StatCard
          label="Budget to reallocate"
          value={formatMoney(reallocation.freedBudget, currency)}
          hint={`${result.counts.scale} scale-ready winner${result.counts.scale === 1 ? "" : "s"}`}
        />
      </div>

      {/* Verdict table */}
      <div className="overflow-hidden rounded-2xl border border-border bg-surface">
        <div className="border-b border-border px-4 py-3">
          <h3 className="font-semibold text-foreground">Campaign-by-campaign verdict</h3>
          <p className="text-xs text-muted">
            Profit is contribution after ad spend (revenue × margin − spend).
          </p>
        </div>
        <div className="hidden gap-3 border-b border-border px-3 py-2 text-xs font-medium uppercase tracking-wide text-muted md:grid md:grid-cols-[1.8fr_0.7fr_1fr_1fr_auto]">
          <span>Campaign</span>
          <span>ROAS</span>
          <span>Spend</span>
          <span>Monthly profit</span>
          <span className="justify-self-end">Verdict</span>
        </div>
        <div className="space-y-3 p-3 md:space-y-0 md:p-0">
          {result.campaigns.map((c, i) => (
            <CampaignRow key={`${c.name}-${i}`} c={c} currency={currency} />
          ))}
        </div>
      </div>

      {/* Reallocation plan */}
      {reallocation.plan.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-border bg-surface">
          <div className="border-b border-border px-4 py-3">
            <h3 className="font-semibold text-foreground">Suggested reallocation plan</h3>
            <p className="text-xs text-muted">
              Move budget off losers and onto proven winners.
            </p>
          </div>
          <ul className="divide-y divide-border">
            {reallocation.plan.map((step) => (
              <li
                key={`${step.campaign}-${step.action}`}
                className="flex items-center justify-between px-4 py-3"
              >
                <div>
                  <span className="font-medium text-foreground">{step.campaign}</span>
                  <span className="ml-2 text-sm text-muted">{step.action}</span>
                </div>
                <span
                  className={`font-semibold tabular-nums ${
                    step.budgetChange >= 0 ? "text-success" : "text-danger"
                  }`}
                >
                  {formatMoneySigned(step.budgetChange, currency)}
                </span>
              </li>
            ))}
          </ul>
          <div className="flex flex-col gap-1 border-t border-border bg-surface-muted px-4 py-3 text-sm md:flex-row md:items-center md:justify-between">
            <span className="text-muted">Projected monthly profit after changes</span>
            <span className="text-lg font-semibold tabular-nums text-foreground">
              {formatMoney(reallocation.projectedMonthlyProfit, currency)}
            </span>
          </div>
        </div>
      )}

      {/* Assumptions / disclaimer */}
      <div className="rounded-xl border border-border bg-surface-muted p-4 text-xs leading-relaxed text-muted">
        <p>
          <strong className="text-foreground">How this is calculated:</strong> Each campaign&apos;s
          profit is its revenue times your gross margin, minus its ad spend. Reallocated budget is
          assumed to perform at {formatPercent(reallocation.efficiencyAssumption * 100, 0)} of your
          winners&apos; current efficiency — a deliberately conservative haircut to account for
          diminishing returns as you scale.
        </p>
        <p className="mt-2">
          These figures are directional estimates based on the numbers you entered, intended to
          highlight where to look — not a guarantee of results or financial advice.
        </p>
      </div>

      <div className="flex justify-center">
        <button
          type="button"
          onClick={onEdit}
          className="rounded-lg border border-border bg-surface px-5 py-2.5 text-sm font-medium text-foreground transition hover:border-accent hover:text-accent"
        >
          ← Edit inputs & recalculate
        </button>
      </div>
    </div>
  );
}
