"use client";

import { useEffect, useRef } from "react";

export type LeadForm = {
  name: string;
  email: string;
  company: string;
  consent: boolean;
};

type Props = {
  open: boolean;
  value: LeadForm;
  errors: Record<string, string>;
  submitting: boolean;
  error?: string;
  onChange: (patch: Partial<LeadForm>) => void;
  onSubmit: () => void;
  onClose: () => void;
};

const inputBase =
  "w-full rounded-lg border bg-surface px-3 py-2 text-sm text-foreground outline-none transition placeholder:text-muted/60 focus:ring-2 focus:ring-accent/20";

function fieldClass(hasError: boolean): string {
  return `${inputBase} ${hasError ? "border-danger focus:border-danger" : "border-border focus:border-accent"}`;
}

export default function LeadGate({
  open,
  value,
  errors,
  submitting,
  error,
  onChange,
  onSubmit,
  onClose,
}: Readonly<Props>) {
  const firstRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => firstRef.current?.focus(), 50);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !submitting) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(t);
      window.removeEventListener("keydown", onKey);
    };
  }, [open, submitting, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close dialog"
        tabIndex={-1}
        className="absolute inset-0 cursor-default bg-slate-900/50 backdrop-blur-sm"
        onClick={() => !submitting && onClose()}
      />
      <dialog
        open
        aria-modal="true"
        aria-labelledby="gate-title"
        className="relative z-10 m-0 block w-full max-w-md overflow-hidden rounded-2xl border-0 bg-surface p-0 text-foreground shadow-xl ring-1 ring-black/5"
      >
        <div className="border-b border-border px-6 py-5">
          <h2 id="gate-title" className="text-lg font-semibold text-foreground">
            Almost there — where should we send it?
          </h2>
          <p className="mt-1 text-sm text-muted">
            Enter your details to unlock your full campaign breakdown and reallocation plan.
          </p>
        </div>

        <form
          className="space-y-4 px-6 py-5"
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit();
          }}
        >
          <div>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-foreground">Full name</span>
              <input
                ref={firstRef}
                type="text"
                value={value.name}
                disabled={submitting}
                onChange={(e) => onChange({ name: e.target.value })}
                className={fieldClass(!!errors.name)}
                placeholder="Jane Doe"
                autoComplete="name"
              />
            </label>
            {errors.name && <p className="mt-1 text-xs text-danger">{errors.name}</p>}
          </div>

          <div>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-foreground">Work email</span>
              <input
                type="email"
                value={value.email}
                disabled={submitting}
                onChange={(e) => onChange({ email: e.target.value })}
                className={fieldClass(!!errors.email)}
                placeholder="jane@brand.com"
                autoComplete="email"
              />
            </label>
            {errors.email && <p className="mt-1 text-xs text-danger">{errors.email}</p>}
          </div>

          <div>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-foreground">
                Company <span className="font-normal text-muted">(optional)</span>
              </span>
              <input
                type="text"
                value={value.company}
                disabled={submitting}
                onChange={(e) => onChange({ company: e.target.value })}
                className={fieldClass(false)}
                placeholder="Brand Co."
                autoComplete="organization"
              />
            </label>
          </div>

          <div>
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={value.consent}
                disabled={submitting}
                onChange={(e) => onChange({ consent: e.target.checked })}
                className="mt-0.5 h-4 w-4 shrink-0 rounded border-border text-accent focus:ring-accent/30"
              />
              <span className="text-xs leading-relaxed text-muted">
                I understand these figures are directional estimates based on the inputs I provided,
                not financial advice, and I agree to be contacted about my results. See the{" "}
                <a href="#privacy" className="text-accent underline">
                  privacy policy
                </a>
                {"."}
              </span>
            </label>
            {errors.consent && <p className="mt-1 text-xs text-danger">{errors.consent}</p>}
          </div>

          {error && (
            <div className="rounded-lg bg-danger-soft px-3 py-2 text-xs text-danger">{error}</div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="flex w-full items-center justify-center rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {submitting && (
              <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            )}
            {submitting ? "Calculating…" : "Show my results"}
          </button>

          <p className="text-center text-[11px] text-muted">
            No spam. Your numbers stay private and are never shared.
          </p>
        </form>
      </dialog>
    </div>
  );
}
