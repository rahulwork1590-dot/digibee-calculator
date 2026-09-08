# Campaign Budget Optimizer

Small tool for D2C brands. You drop in each campaign's monthly spend and revenue plus your
gross margin, and it works out which campaigns are actually profitable once margin is taken
into account — then suggests where to move the budget.

Every campaign gets graded scale / keep / cut on contribution margin (revenue × margin −
spend), it shows how much the losing campaigns cost you each month, and estimates the profit
from pausing them and pushing that budget to the winners.

## Running it

```bash
npm install
npm run dev
```

Open http://localhost:3000 and hit "Load sample data" if you just want to see it working.

Leads are saved to Postgres when `DATABASE_URL` is set, otherwise they go to a local
`.data/leads.json` file so you don't need a database to run it. Copy `.env.example` to
`.env.local` and set `ADMIN_PASSWORD` if you want to open the `/admin` page.

## How the numbers work

For each campaign (`margin = grossMargin / 100`):

- `roas = revenue / spend`
- `contribution = revenue * margin - spend`
- break-even ROAS is `1 / margin`
- below break-even → cut, comfortably above → scale, otherwise → keep

The reallocation takes the budget from the cut campaigns and assumes it earns at the winners'
average return with a 40% haircut for diminishing returns, so the projection isn't
over-optimistic.

All of this runs in the API route under `src/app/api/optimize` — never in the browser. The
page only sends the inputs and gets the finished numbers back.

## Notes

- `ADMIN_PASSWORD` gates `/admin` and the leads API. No password set = admin is off.
- The rate limiter is in-memory; for real traffic across multiple instances use Redis.
- To deploy: push to GitHub, import into Vercel, set `DATABASE_URL` and `ADMIN_PASSWORD`. The
  leads table is created on first write.
