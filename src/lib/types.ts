// types shared between the browser and the API (no formulas live here)

export type CampaignInput = {
  name: string;
  spend: number;
  revenue: number;
};

export type OptimizeInput = {
  currency: string;
  grossMargin: number; // percent, 0-100
  campaigns: CampaignInput[];
};

export type LeadInput = {
  name: string;
  email: string;
  company?: string;
  consent: boolean;
};

export type OptimizeRequest = {
  input: OptimizeInput;
  lead: LeadInput;
};

export type CampaignVerdict = "SCALE" | "KEEP" | "CUT";

export type CampaignResult = {
  name: string;
  spend: number;
  revenue: number;
  roas: number;
  contribution: number; // monthly profit after ad spend
  contributionPerDollar: number;
  status: CampaignVerdict;
  note: string;
};

export type ReallocationStep = {
  campaign: string;
  action: string;
  budgetChange: number; // + increase, - decrease/pause
};

export type OptimizeResult = {
  currency: string;
  breakEvenRoas: number;
  totals: {
    spend: number;
    revenue: number;
    blendedRoas: number;
    contribution: number; // current monthly profit after ad spend
    contributionMargin: number; // % of revenue
  };
  counts: { scale: number; keep: number; cut: number };
  monthlyBleed: number; // money that losing campaigns lose each month
  reallocation: {
    freedBudget: number;
    efficiencyAssumption: number; // 0-1, shown for transparency
    projectedMonthlyProfit: number;
    monthlyUplift: number;
    annualUplift: number;
    plan: ReallocationStep[];
  };
  campaigns: CampaignResult[];
  headline: string;
};

export type OptimizeResponse =
  | { ok: true; result: OptimizeResult }
  | { ok: false; error: string; fields?: Record<string, string> };
