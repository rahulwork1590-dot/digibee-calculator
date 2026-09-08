import "server-only";

import { CURRENCIES } from "./config";
import type { CampaignInput, LeadInput, OptimizeInput } from "./types";

const MAX_MONEY = 100_000_000;
const MAX_CAMPAIGNS = 15;
const MIN_MARGIN = 1;
const MAX_MARGIN = 95;

export type ValidationError = { error: string; fields?: Record<string, string> };

function toNumber(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string" && value.trim() !== "") {
    const n = Number(value.replaceAll(",", ""));
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function clampMoney(n: number): number {
  if (n < 0) return 0;
  if (n > MAX_MONEY) return MAX_MONEY;
  return Math.round(n * 100) / 100;
}

function toStr(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return "";
}

export function validateOptimizeInput(
  raw: unknown,
): { ok: true; value: OptimizeInput } | { ok: false } & ValidationError {
  if (!raw || typeof raw !== "object") {
    return { ok: false, error: "Missing calculator inputs." };
  }
  const obj = raw as Record<string, unknown>;

  const currency = (toStr(obj.currency) || "USD").toUpperCase();
  if (!CURRENCIES.some((c) => c.code === currency)) {
    return { ok: false, error: "Unsupported currency.", fields: { currency: "Unsupported currency." } };
  }

  const margin = toNumber(obj.grossMargin);
  if (margin === null) {
    return { ok: false, error: "Enter a gross margin.", fields: { grossMargin: "Enter a gross margin." } };
  }
  if (margin < MIN_MARGIN || margin > MAX_MARGIN) {
    return {
      ok: false,
      error: `Gross margin must be between ${MIN_MARGIN}% and ${MAX_MARGIN}%.`,
      fields: { grossMargin: `Must be between ${MIN_MARGIN}% and ${MAX_MARGIN}%.` },
    };
  }

  const rawCampaigns = Array.isArray(obj.campaigns) ? obj.campaigns : [];
  if (rawCampaigns.length === 0) {
    return { ok: false, error: "Add at least one campaign." };
  }
  if (rawCampaigns.length > MAX_CAMPAIGNS) {
    return { ok: false, error: `You can compare up to ${MAX_CAMPAIGNS} campaigns.` };
  }

  const campaigns: CampaignInput[] = [];
  for (let i = 0; i < rawCampaigns.length; i++) {
    const entry = rawCampaigns[i] as Record<string, unknown>;
    const spend = toNumber(entry?.spend);
    const revenue = toNumber(entry?.revenue);
    const name = toStr(entry?.name).trim().slice(0, 60) || `Campaign ${i + 1}`;
    if (spend === null || revenue === null) {
      return {
        ok: false,
        error: `Enter spend and revenue for every campaign (check "${name}").`,
      };
    }
    const cleanSpend = clampMoney(spend);
    if (cleanSpend <= 0) {
      return { ok: false, error: `"${name}" needs a spend greater than zero.` };
    }
    campaigns.push({ name, spend: cleanSpend, revenue: clampMoney(revenue) });
  }

  return { ok: true, value: { currency, grossMargin: margin, campaigns } };
}

function isValidEmail(email: string): boolean {
  if (email.length < 3 || email.length > 200) return false;
  if (/\s/.test(email)) return false;
  const at = email.indexOf("@");
  if (at <= 0 || at !== email.lastIndexOf("@")) return false;
  const domain = email.slice(at + 1);
  return domain.includes(".") && !domain.startsWith(".") && !domain.endsWith(".");
}

export function validateLead(
  raw: unknown,
): { ok: true; value: LeadInput } | { ok: false } & ValidationError {
  if (!raw || typeof raw !== "object") {
    return { ok: false, error: "Missing your details." };
  }
  const obj = raw as Record<string, unknown>;
  const fields: Record<string, string> = {};

  const name = toStr(obj.name).trim().slice(0, 120);
  if (name.length < 2) fields.name = "Enter your name.";

  const email = toStr(obj.email).trim().slice(0, 200).toLowerCase();
  if (!isValidEmail(email)) fields.email = "Enter a valid email address.";

  const company = toStr(obj.company).trim().slice(0, 160);
  const consent = obj.consent === true;
  if (!consent) fields.consent = "Please acknowledge to continue.";

  if (Object.keys(fields).length > 0) {
    return { ok: false, error: "Please fix the highlighted fields.", fields };
  }

  return { ok: true, value: { name, email, company: company || undefined, consent } };
}
