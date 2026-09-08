import "server-only";

import type {
  CampaignResult,
  CampaignVerdict,
  OptimizeInput,
  OptimizeResult,
  ReallocationStep,
} from "./types";

// how far past break-even a campaign has to be before we treat it as a winner
const SCALE_MULTIPLE = 1.25;
// moved budget doesn't convert 1:1, so discount it for diminishing returns
const REALLOCATION_EFFICIENCY = 0.6;

function round(n: number): number {
  return Math.round(n);
}

function verdictNote(
  status: CampaignVerdict,
  roas: number,
  breakEvenRoas: number,
  currency: string,
): string {
  switch (status) {
    case "SCALE":
      return `Clearing break-even (${breakEvenRoas.toFixed(2)}×) with room to spare — a candidate for more budget.`;
    case "KEEP":
      return `Profitable but close to the ${breakEvenRoas.toFixed(2)}× break-even line — hold and optimise before scaling.`;
    case "CUT":
      return `Below the ${breakEvenRoas.toFixed(2)}× break-even ROAS — losing money on a contribution-margin basis.`;
  }
}

export function optimize(input: OptimizeInput): OptimizeResult {
  const margin = input.grossMargin / 100;
  const breakEvenRoas = margin > 0 ? 1 / margin : Infinity;

  const campaigns: CampaignResult[] = input.campaigns.map((c) => {
    const roas = c.spend > 0 ? c.revenue / c.spend : 0;
    const grossProfit = c.revenue * margin;
    const contribution = grossProfit - c.spend;
    const contributionPerDollar = c.spend > 0 ? contribution / c.spend : 0;

    let status: CampaignVerdict;
    if (contribution < 0) {
      status = "CUT";
    } else if (roas >= breakEvenRoas * SCALE_MULTIPLE) {
      status = "SCALE";
    } else {
      status = "KEEP";
    }

    return {
      name: c.name,
      spend: c.spend,
      revenue: c.revenue,
      roas,
      contribution,
      contributionPerDollar,
      status,
      note: verdictNote(status, roas, breakEvenRoas, input.currency),
    };
  });

  const totalSpend = campaigns.reduce((s, c) => s + c.spend, 0);
  const totalRevenue = campaigns.reduce((s, c) => s + c.revenue, 0);
  const totalContribution = campaigns.reduce((s, c) => s + c.contribution, 0);
  const blendedRoas = totalSpend > 0 ? totalRevenue / totalSpend : 0;
  const contributionMargin = totalRevenue > 0 ? (totalContribution / totalRevenue) * 100 : 0;

  const losers = campaigns.filter((c) => c.status === "CUT");
  const winners = campaigns.filter((c) => c.status === "SCALE");

  const monthlyBleed = losers.reduce((s, c) => s + Math.abs(c.contribution), 0);
  const freedBudget = losers.reduce((s, c) => s + c.spend, 0);

  const winnerSpend = winners.reduce((s, c) => s + c.spend, 0);
  const winnerContribution = winners.reduce((s, c) => s + c.contribution, 0);
  const avgWinnerCPD = winnerSpend > 0 ? winnerContribution / winnerSpend : 0;

  // pausing losers stops the bleed; the rest comes from moving their budget onto winners
  const incrementalProfit =
    winners.length > 0 ? freedBudget * avgWinnerCPD * REALLOCATION_EFFICIENCY : 0;

  const projectedMonthlyProfit = totalContribution + monthlyBleed + incrementalProfit;
  const monthlyUplift = projectedMonthlyProfit - totalContribution;
  const annualUplift = monthlyUplift * 12;

  const plan: ReallocationStep[] = [];
  for (const l of losers) {
    plan.push({ campaign: l.name, action: "Pause / rework", budgetChange: -round(l.spend) });
  }
  if (winners.length > 0 && freedBudget > 0) {
    for (const w of winners) {
      const share = winnerSpend > 0 ? w.spend / winnerSpend : 1 / winners.length;
      plan.push({
        campaign: w.name,
        action: "Scale up",
        budgetChange: round(freedBudget * share),
      });
    }
  }

  const headline = buildHeadline({
    currency: input.currency,
    monthlyUplift,
    annualUplift,
    cut: losers.length,
    scale: winners.length,
  });

  return {
    currency: input.currency,
    breakEvenRoas,
    totals: {
      spend: round(totalSpend),
      revenue: round(totalRevenue),
      blendedRoas,
      contribution: round(totalContribution),
      contributionMargin,
    },
    counts: {
      scale: winners.length,
      keep: campaigns.filter((c) => c.status === "KEEP").length,
      cut: losers.length,
    },
    monthlyBleed: round(monthlyBleed),
    reallocation: {
      freedBudget: round(freedBudget),
      efficiencyAssumption: REALLOCATION_EFFICIENCY,
      projectedMonthlyProfit: round(projectedMonthlyProfit),
      monthlyUplift: round(monthlyUplift),
      annualUplift: round(annualUplift),
      plan,
    },
    campaigns: campaigns.map((c) => ({
      ...c,
      spend: round(c.spend),
      revenue: round(c.revenue),
      contribution: round(c.contribution),
    })),
    headline,
  };
}

function buildHeadline(args: {
  currency: string;
  monthlyUplift: number;
  annualUplift: number;
  cut: number;
  scale: number;
}): string {
  if (args.monthlyUplift <= 0) {
    return "Your portfolio is already allocating budget efficiently — no obvious profit is being left on the table.";
  }
  if (args.cut > 0 && args.scale > 0) {
    return `Pausing ${args.cut} underperforming ${plural(args.cut, "campaign")} and moving that budget onto your ${plural(args.scale, "winner")} is where your upside is.`;
  }
  if (args.cut > 0) {
    return `You have ${args.cut} ${plural(args.cut, "campaign")} losing money each month — pausing them stops the bleed immediately.`;
  }
  return "There's room to reallocate budget toward your strongest campaigns.";
}

function plural(n: number, word: string): string {
  return n === 1 ? word : `${word}s`;
}
