import { NextRequest, NextResponse } from "next/server";

import { CALCULATOR } from "@/lib/config";
import { saveLead } from "@/lib/leads-store";
import { optimize } from "@/lib/optimizer";
import { rateLimit, sweepRateLimit } from "@/lib/rate-limit";
import type { OptimizeResponse } from "@/lib/types";
import { validateLead, validateOptimizeInput } from "@/lib/validation";

export const runtime = "nodejs";

function clientIp(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

export async function POST(req: NextRequest): Promise<NextResponse<OptimizeResponse>> {
  sweepRateLimit();
  const { allowed, retryAfter } = rateLimit(`optimize:${clientIp(req)}`);
  if (!allowed) {
    return NextResponse.json(
      { ok: false, error: `Too many requests. Try again in ${retryAfter}s.` },
      { status: 429, headers: { "Retry-After": String(retryAfter) } },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request body." }, { status: 400 });
  }

  const { input, lead } = (body ?? {}) as Record<string, unknown>;

  const leadCheck = validateLead(lead);
  if (!leadCheck.ok) {
    return NextResponse.json(
      { ok: false, error: leadCheck.error, fields: leadCheck.fields },
      { status: 400 },
    );
  }

  const inputCheck = validateOptimizeInput(input);
  if (!inputCheck.ok) {
    return NextResponse.json(
      { ok: false, error: inputCheck.error, fields: inputCheck.fields },
      { status: 400 },
    );
  }

  const result = optimize(inputCheck.value);

  const save = await saveLead({
    calculator: CALCULATOR.id,
    name: leadCheck.value.name,
    email: leadCheck.value.email,
    company: leadCheck.value.company ?? null,
    currency: result.currency,
    totalSpend: result.totals.spend,
    monthlyUplift: result.reallocation.monthlyUplift,
    annualUplift: result.reallocation.annualUplift,
  });
  if (!save.stored) {
    console.warn("[optimize] lead was not persisted:", leadCheck.value.email);
  }

  return NextResponse.json({ ok: true, result });
}
