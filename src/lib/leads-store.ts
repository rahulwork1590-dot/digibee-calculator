import "server-only";

import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";

export type LeadRecord = {
  id: string;
  createdAt: string;
  calculator: string;
  name: string;
  email: string;
  company: string | null;
  currency: string;
  totalSpend: number;
  monthlyUplift: number;
  annualUplift: number;
};

export type NewLead = Omit<LeadRecord, "id" | "createdAt">;

const DATA_DIR = path.join(process.cwd(), ".data");
const DATA_FILE = path.join(DATA_DIR, "leads.json");

let poolPromise: Promise<import("pg").Pool> | null = null;

function needsSsl(url: string): boolean {
  if (process.env.DATABASE_SSL === "disable") return false;
  return !/localhost|127\.0\.0\.1/.test(url);
}

async function getPool(): Promise<import("pg").Pool | null> {
  const url = process.env.DATABASE_URL;
  if (!url) return null;
  if (!poolPromise) {
    poolPromise = (async () => {
      const { Pool } = await import("pg");
      const pool = new Pool({
        connectionString: url,
        ssl: needsSsl(url) ? { rejectUnauthorized: false } : undefined,
        max: 3,
      });
      await pool.query(`
        CREATE TABLE IF NOT EXISTS leads (
          id UUID PRIMARY KEY,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          calculator TEXT NOT NULL,
          name TEXT NOT NULL,
          email TEXT NOT NULL,
          company TEXT,
          currency TEXT NOT NULL,
          total_spend NUMERIC NOT NULL,
          monthly_uplift NUMERIC NOT NULL,
          annual_uplift NUMERIC NOT NULL
        );
      `);
      return pool;
    })();
  }
  return poolPromise;
}

async function readFile(): Promise<LeadRecord[]> {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf8");
    return JSON.parse(raw) as LeadRecord[];
  } catch {
    return [];
  }
}

async function writeFile(records: LeadRecord[]): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(records, null, 2), "utf8");
}

export async function saveLead(lead: NewLead): Promise<{ stored: boolean; via: "postgres" | "file" | "none" }> {
  const record: LeadRecord = { id: randomUUID(), createdAt: new Date().toISOString(), ...lead };

  try {
    const pool = await getPool();
    if (pool) {
      await pool.query(
        `INSERT INTO leads
          (id, created_at, calculator, name, email, company, currency, total_spend, monthly_uplift, annual_uplift)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          record.id,
          record.createdAt,
          record.calculator,
          record.name,
          record.email,
          record.company,
          record.currency,
          record.totalSpend,
          record.monthlyUplift,
          record.annualUplift,
        ],
      );
      return { stored: true, via: "postgres" };
    }

    const existing = await readFile();
    existing.push(record);
    await writeFile(existing);
    return { stored: true, via: "file" };
  } catch (err) {
    // log it instead of failing silently so we notice dropped leads
    console.error("[leads-store] failed to persist lead:", err);
    return { stored: false, via: "none" };
  }
}

export async function listLeads(limit = 500): Promise<LeadRecord[]> {
  const pool = await getPool();
  if (pool) {
    const { rows } = await pool.query(
      `SELECT id, created_at, calculator, name, email, company, currency,
              total_spend, monthly_uplift, annual_uplift
         FROM leads
        ORDER BY created_at DESC
        LIMIT $1`,
      [limit],
    );
    return rows.map((r) => ({
      id: r.id,
      createdAt: new Date(r.created_at).toISOString(),
      calculator: r.calculator,
      name: r.name,
      email: r.email,
      company: r.company,
      currency: r.currency,
      totalSpend: Number(r.total_spend),
      monthlyUplift: Number(r.monthly_uplift),
      annualUplift: Number(r.annual_uplift),
    }));
  }

  const records = await readFile();
  return records
    .toSorted((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit);
}

export function storageMode(): "postgres" | "file" {
  return process.env.DATABASE_URL ? "postgres" : "file";
}
