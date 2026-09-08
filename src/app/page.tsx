import OptimizerApp from "@/components/OptimizerApp";

function Chip({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-muted">
      <span className="h-1.5 w-1.5 rounded-full bg-accent" />
      {children}
    </span>
  );
}

function Step({ n, title, body }: Readonly<{ n: number; title: string; body: string }>) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-soft text-sm font-semibold text-accent">
        {n}
      </div>
      <h3 className="mt-3 font-semibold text-foreground">{title}</h3>
      <p className="mt-1 text-sm text-muted">{body}</p>
    </div>
  );
}

export default function Home() {
  return (
    <div className="flex min-h-full flex-col">
      <header className="sticky top-0 z-40 border-b border-border bg-surface/80 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent text-xs font-bold text-accent-foreground">
              D
            </span>
            <span className="text-sm font-semibold text-foreground">Digibee Studio</span>
          </div>
          <span className="rounded-full bg-accent-soft px-3 py-1 text-xs font-medium text-accent">
            Proof of concept
          </span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-10 md:py-14">
        <section className="mb-8 text-center md:mb-12">
          <p className="text-sm font-medium text-accent">For D2C &amp; e-commerce brands</p>
          <h1 className="mx-auto mt-2 max-w-2xl text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            Which of your ad campaigns are quietly losing money?
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-base text-muted">
            Most brands optimise to the ROAS their ad platforms report — before COGS, shipping, fees
            and returns. This tool re-scores every campaign on true contribution margin, flags what to
            cut, and shows how much profit you could unlock by moving budget to your winners.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <Chip>No login required</Chip>
            <Chip>Results in seconds</Chip>
            <Chip>Your numbers stay private</Chip>
          </div>
        </section>

        <OptimizerApp />

        <section className="mt-12">
          <h2 className="mb-4 text-center text-lg font-semibold text-foreground">How it works</h2>
          <div className="grid gap-3 md:grid-cols-3">
            <Step
              n={1}
              title="Enter your campaigns"
              body="Add each campaign's monthly spend and revenue, plus your gross margin after COGS, shipping and fees."
            />
            <Step
              n={2}
              title="We re-score on profit"
              body="Every campaign is graded scale, keep or cut on contribution margin — not the vanity ROAS your platform shows."
            />
            <Step
              n={3}
              title="Get your action plan"
              body="See what you're bleeding each month and exactly where to reallocate budget for more profit."
            />
          </div>
        </section>
      </main>

      <footer className="border-t border-border bg-surface">
        <div className="mx-auto flex max-w-4xl flex-col items-center justify-between gap-2 px-4 py-6 text-xs text-muted md:flex-row">
          <p>Directional estimates for guidance only — not financial advice.</p>
          <a href="/admin" className="text-muted underline hover:text-accent">
            Admin
          </a>
        </div>
      </footer>
    </div>
  );
}
