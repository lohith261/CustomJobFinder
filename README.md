# Job Tailor

An AI-powered job search platform built for Indian job seekers. Scrapes live listings from LinkedIn, Naukri, Indeed India, Internshala and more — scores them semantically against your resume, tailors your resume and cover letter, and tracks every application.

**Live:** https://jobtailor.in

---

## Features

- **Opportunity Inbox** — live jobs from LinkedIn, Naukri, Indeed India, Internshala, Adzuna and remote boards; blended AI + keyword match score with breakdown; sort, filter, pin, and bulk actions
- **Application Tracker** — Kanban board with collapsible columns, bulk move/archive, recruiter notes, event timeline, and outcome recording (hired / rejected / ghosted / withdrawn)
- **Resume Tailoring** — upload PDF or paste text; AI analysis shows match score, missing keywords and rewrite suggestions; side-by-side comparison mode
- **Cover Letters** — AI-generated per job with tone selector (Professional / Conversational / Enthusiastic); saved to application
- **Cold Outreach** — enter any company URL; AI writes a personalised email; reply tracking
- **Automation Pipeline** — one click runs scrape → embed → score → analyse → tailor resume → cover letter → auto-track; non-blocking (Trigger.dev background job); cancellable mid-run
- **Semantic Scoring** — every job and resume is embedded with `text-embedding-3-small` (1536 dims via OpenRouter); match score is a 40% keyword + 60% semantic blend
- **Feedback Loop** — outcome signals (hired/rejected/ghosted) feed `getUserOutcomePatterns()` which derives a suggested threshold recalibration after ≥5 outcomes
- **Analytics** — funnel, score distribution, weekly trend, source breakdown with drill-down; CSV export
- **Pro Plan** — ₹499/month or ₹3,999/year; UPI payment with admin activation
- **Dark Mode**, multiple search profiles, email verification, onboarding emails

---

## Tech Stack

| | |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Auth | NextAuth.js v4 (JWT strategy) |
| ORM | Prisma v5 + PostgreSQL (Supabase) |
| AI — LLM | OpenRouter (Gemini 2.0 Flash) |
| AI — Embeddings | OpenRouter → `openai/text-embedding-3-small` (1536 dims) |
| Background Jobs | Trigger.dev v4 |
| Cache / State | Upstash Redis (pipeline cancellation, 48h URL dedup) |
| Email | Resend |
| Scraping | Apify SDK (typed) + Firecrawl Scrape API + scrape.do |
| Concurrency | p-limit (max 3 simultaneous LLM calls in pipeline) |
| Monitoring | Sentry |
| Hosting | Vercel |

---

## Local Setup

```bash
git clone https://github.com/lohith261/job-tailor.git
cd job-tailor
npm install
cp .env.example .env        # fill in values below
npx prisma db push
npm run dev                 # http://localhost:3000
```

> **Note:** If you pulled env vars with `vercel env pull`, make sure `NEXTAUTH_URL` is set to `http://localhost:3000` in `.env.local` — the Vercel CLI sets it to the production domain which breaks local JWT verification.

Seed a demo account for testing:

```bash
npx tsx scripts/seed-demo-user.ts
# Email: demo@jobtailor.in  |  Password: Demo@1234
```

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | Postgres connection string (pooled) |
| `DIRECT_URL` | ✅ | Direct Postgres URL (for migrations) |
| `NEXTAUTH_SECRET` | ✅ | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | ✅ | Full app URL e.g. `https://jobtailor.in` (use `http://localhost:3000` locally) |
| `OPENROUTER_API_KEY` | ✅ | From [openrouter.ai/keys](https://openrouter.ai/keys) — LLM + embeddings |
| `UPSTASH_REDIS_REST_URL` | ✅ | From [upstash.com](https://upstash.com) — pipeline cancel + URL dedup |
| `UPSTASH_REDIS_REST_TOKEN` | ✅ | From [upstash.com](https://upstash.com) |
| `TRIGGER_SECRET_KEY` | ✅ | From [trigger.dev](https://trigger.dev) — background pipeline jobs |
| `TRIGGER_PROJECT_ID` | ✅ | From [trigger.dev](https://trigger.dev) |
| `CRON_SECRET` | ✅ | `openssl rand -base64 32` |
| `RESEND_API_KEY` | ✅ | From [resend.com](https://resend.com) |
| `APIFY_API_TOKEN` | optional | From [apify.com](https://console.apify.com/account/integrations) — LinkedIn, Indeed & Wellfound scraper |
| `SCRAPE_DO_TOKEN` | optional | From [scrape.do](https://scrape.do) — fallback for LinkedIn, Indeed, Naukri |
| `FIRECRAWL_API_KEY` | optional | From [firecrawl.dev](https://firecrawl.dev) — primary fetch layer for most scrapers |
| `ADZUNA_APP_ID` | optional | From [developer.adzuna.com](https://developer.adzuna.com) |
| `ADZUNA_API_KEY` | optional | From [developer.adzuna.com](https://developer.adzuna.com) |
| `TELEGRAM_BOT_TOKEN` | optional | Pipeline completion & error notifications |
| `TELEGRAM_CHAT_ID` | optional | Your Telegram chat ID |
| `NEXT_PUBLIC_UPI_ID` | optional | UPI ID shown on pricing page |
| `ADMIN_EMAIL` | optional | Email address with admin panel access |
| `NEXT_PUBLIC_SENTRY_DSN` | optional | From [sentry.io](https://sentry.io) |

---

## Scraper Sources

| Source | Region | Method |
|---|---|---|
| LinkedIn Jobs | 🇮🇳 India | Apify SDK → scrape.do → Firecrawl (3-tier) |
| Indeed India | 🇮🇳 India | Apify SDK → scrape.do → Firecrawl (3-tier) |
| Wellfound (AngelList) | 🌍 Global | Apify SDK |
| Naukri.com | 🇮🇳 India | Firecrawl (primary) |
| Internshala | 🇮🇳 India (freshers) | Firecrawl → scrape.do → direct |
| Adzuna | 🇮🇳 India only | Official API |
| RemoteOK / Remotive / Jobicy / The Muse / Arbeitnow | 🌐 Remote | Direct public APIs |

Each tier is tried in order; the next kicks in only when the previous returns 0 results or errors. A 48-hour Redis URL dedup cache prevents re-processing listings seen in recent runs.

---

## Pipeline Architecture

```
[Trigger.dev background task]
   │
   ├── A. Scrape  → filter seen URLs (Redis 48h cache) → upsert jobs
   │              → embed each new job (text-embedding-3-small)
   │              → blended score = 40% keyword + 60% semantic
   │
   ├── B. Select candidates above threshold
   │
   ├── C. Fetch primary resume
   │
   ├── D. Analyse + tailor resume  ─┐
   │                                ├── p-limit(3) concurrent LLM calls
   ├── E. Generate cover letters   ─┘
   │
   └── F. Auto-track as bookmarked applications
```

The pipeline run API (`POST /api/pipeline/run`) returns immediately with a `pipelineRunId` — actual work runs on Trigger.dev. Cancellation sets a Redis soft-flag **and** calls `runs.cancel()` on the Trigger.dev handle.

---

## Deploy to Vercel

1. Push to GitHub → import at [vercel.com/new](https://vercel.com/new)
2. Add all environment variables in the Vercel dashboard
3. Deploy — Vercel auto-detects Next.js

Daily pipeline runs automatically via cron at `0 8 * * *` (08:00 UTC).

---

## Next Steps

### High impact, low effort
- **Backfill embeddings** — run a one-off script to embed all existing jobs and resumes in the DB so blended scoring applies to historical data immediately
- **Surface recalibration suggestions in UI** — call `recalibrateUserThresholds()` in the Search Config page and show a "Based on your outcomes, try threshold X" nudge
- **Outcome UI in Applications Kanban** — add a dropdown on each card to record hired/rejected/ghosted; currently only settable via API

### Growth / monetisation
- **Email digest** — weekly summary of top new matches sent via Resend; drives re-engagement without requiring users to log in daily
- **Referral system** — give Pro month free for each referral that converts; low-cost acquisition for the Indian market
- **Team / recruiter plan** — allow a recruiter to manage multiple candidate profiles; opens B2B pricing

### Technical depth
- **Vector search in Postgres** — migrate job retrieval from score-filtered SQL to `pgvector` ANN search (`<->` cosine operator); faster and more accurate candidate selection for the pipeline
- **Streaming pipeline status** — replace polling `/api/pipeline/history` with Server-Sent Events so the UI updates in real time without page refreshes
- **Resume version history** — store each tailored resume iteration so users can compare and revert; currently only latest is kept
- **Multi-model fallback** — if OpenRouter returns an error, retry with a cheaper/faster model before failing the pipeline step

### Scraper reliability
- **Scraper health dashboard** — track per-source success rate over time; auto-disable sources falling below 20% yield for 3 consecutive days
- **Structured job data extraction** — use Firecrawl's extract mode (LLM-powered) to parse salary, experience, and skills directly from raw HTML; reduces dependency on inconsistent per-site field names

---

## FAQ

**Inbox empty after scraping?** Broaden your Search Config — fewer required keywords, more job titles.

**All scores low (< 40)?** Reduce required keywords to your top 4–5 skills. Also ensure a resume is uploaded so semantic scoring can run.

**LinkedIn / Indeed not showing results?** The pipeline tries three layers automatically: `APIFY_API_TOKEN` (primary) → `SCRAPE_DO_TOKEN` (secondary) → `FIRECRAWL_API_KEY` (tertiary). Add whichever keys you have.

**Naukri not showing results?** Add `FIRECRAWL_API_KEY` — it's the primary fetch layer for Naukri.

**AI features not working?** Check that `OPENROUTER_API_KEY` is set and redeployed.

**Pipeline times out on Vercel?** It shouldn't — the API returns immediately and Trigger.dev handles the work. If the Trigger.dev worker isn't processing, check `TRIGGER_SECRET_KEY` and `TRIGGER_PROJECT_ID`.
