import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";

import { listLeads, storageMode, type LeadRecord } from "@/lib/leads-store";

export const runtime = "nodejs";

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

function authorized(req: NextRequest): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  const provided = req.headers.get("x-admin-key") ?? new URL(req.url).searchParams.get("key");
  if (!provided) return false;
  return safeEqual(provided, expected);
}

function stringify(value: unknown): string {
  if (typeof value === "number") return String(value);
  return typeof value === "string" ? value : "";
}

function csvCell(value: unknown): string {
  const s = value == null ? "" : stringify(value);
  return /[",\n]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s;
}

function toCsv(leads: LeadRecord[]): string {
  const header = [
    "created_at",
    "name",
    "email",
    "company",
    "calculator",
    "currency",
    "total_spend",
    "monthly_uplift",
    "annual_uplift",
  ];
  const rows = leads.map((l) =>
    [
      l.createdAt,
      l.name,
      l.email,
      l.company ?? "",
      l.calculator,
      l.currency,
      l.totalSpend,
      l.monthlyUplift,
      l.annualUplift,
    ]
      .map(csvCell)
      .join(","),
  );
  return [header.join(","), ...rows].join("\n");
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const leads = await listLeads();

  if (new URL(req.url).searchParams.get("format") === "csv") {
    return new NextResponse(toCsv(leads), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="leads.csv"',
      },
    });
  }

  return NextResponse.json({ ok: true, count: leads.length, storage: storageMode(), leads });
}
