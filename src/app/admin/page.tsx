"use client";

import { useEffect, useState } from "react";

import { formatMoney } from "@/lib/format";

type Lead = {
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

export default function AdminPage() {
  const [key, setKey] = useState("");
  const [authed, setAuthed] = useState(false);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [storage, setStorage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();

  async function load(k: string) {
    setLoading(true);
    setError(undefined);
    try {
      const res = await fetch("/api/admin/leads", { headers: { "x-admin-key": k } });
      if (res.status === 401) {
        setError("Invalid admin key.");
        setAuthed(false);
        sessionStorage.removeItem("adminKey");
        return;
      }
      const data = await res.json();
      setLeads(data.leads ?? []);
      setStorage(data.storage ?? "");
      setAuthed(true);
      sessionStorage.setItem("adminKey", k);
    } catch {
      setError("Could not load leads. Is the server running?");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const saved = sessionStorage.getItem("adminKey");
    if (saved) {
      setKey(saved);
      void load(saved);
    }
  }, []);

  async function downloadCsv() {
    const res = await fetch("/api/admin/leads?format=csv", { headers: { "x-admin-key": key } });
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "leads.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  function signOut() {
    sessionStorage.removeItem("adminKey");
    setAuthed(false);
    setKey("");
    setLeads([]);
  }

  if (!authed) {
    return (
      <div className="mx-auto flex min-h-full max-w-sm flex-col justify-center px-4 py-16">
        <h1 className="text-xl font-semibold text-foreground">Admin sign in</h1>
        <p className="mt-1 text-sm text-muted">Enter the admin key to view captured leads.</p>
        <form
          className="mt-5 space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            void load(key);
          }}
        >
          <input
            type="password"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="Admin key"
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
          />
          {error && <p className="text-xs text-danger">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground transition hover:opacity-90 disabled:opacity-70"
          >
            {loading ? "Checking…" : "Sign in"}
          </button>
        </form>
        <a href="/" className="mt-6 text-center text-xs text-muted underline hover:text-accent">
          ← Back to calculator
        </a>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Captured leads</h1>
          <p className="text-sm text-muted">
            {leads.length} total · storage:{" "}
            <span className="font-medium text-foreground">{storage || "unknown"}</span>
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={downloadCsv}
            className="rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-foreground transition hover:border-accent hover:text-accent"
          >
            Download CSV
          </button>
          <button
            onClick={signOut}
            className="rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-muted transition hover:border-danger hover:text-danger"
          >
            Sign out
          </button>
        </div>
      </div>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-border bg-surface">
        <table className="w-full min-w-180 text-left text-sm">
          <thead className="border-b border-border bg-surface-muted text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Company</th>
              <th className="px-4 py-3 text-right font-medium">Monthly uplift</th>
              <th className="px-4 py-3 text-right font-medium">Annual uplift</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {leads.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-muted">
                  No leads yet. Submit the calculator to see one appear here.
                </td>
              </tr>
            )}
            {leads.map((l) => (
              <tr key={l.id}>
                <td className="whitespace-nowrap px-4 py-3 text-muted">
                  {new Date(l.createdAt).toLocaleString()}
                </td>
                <td className="px-4 py-3 font-medium text-foreground">{l.name}</td>
                <td className="px-4 py-3 text-muted">{l.email}</td>
                <td className="px-4 py-3 text-muted">{l.company ?? "—"}</td>
                <td className="px-4 py-3 text-right tabular-nums">
                  {formatMoney(l.monthlyUplift, l.currency)}
                </td>
                <td className="px-4 py-3 text-right font-medium tabular-nums">
                  {formatMoney(l.annualUplift, l.currency)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <a href="/" className="mt-6 inline-block text-xs text-muted underline hover:text-accent">
        ← Back to calculator
      </a>
    </div>
  );
}
