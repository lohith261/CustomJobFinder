# Custom Job Finder

A self-hosted, AI-powered job search assistant that scrapes live job listings, scores them against your personal preferences, and tracks every application through a Kanban pipeline — all backed by a persistent PostgreSQL database on Supabase.

**Live demo:** https://custom-job-finder.vercel.app

---

## Table of Contents

1. [What It Does](#what-it-does)
2. [Tech Stack](#tech-stack)
3. [End-to-End User Guide](#end-to-end-user-guide)
4. [Architecture Overview](#architecture-overview)
5. [Database Schema](#database-schema)
6. [Scoring Engine](#scoring-engine)
7. [AI Resume Analysis](#ai-resume-analysis)
8. [API Reference](#api-reference)
9. [Project Structure](#project-structure)
10. [Local Development Setup](#local-development-setup)
11. [Deploying to Vercel](#deploying-to-vercel)
12. [Environment Variables](#environment-variables)
13. [How Each Feature Works](#how-each-feature-works)

---

## What It Does

| Module | Description |
|--------|-------------|
| **Opportunity Inbox** | Scrapes RemoteOK, Remotive, Arbeitnow, Jobicy, The Muse, and Adzuna for live jobs, scores each one instantly against your search config, and surfaces Quick Wins and Best Bets |
| **Application Tracker** | Kanban board (Bookmarked → Applied → Interview → Offer → Rejected) with recruiter notes, follow-up reminders, and a full event timeline |
| **Resume Tailoring** | Upload PDF/DOCX/TXT resumes; run AI analysis against any job to get a match score, present/missing keywords, and rewrite suggestions |
| **Analytics Dashboard** | Application funnel, match score distribution, weekly trend charts, top titles/companies, source conversions, and resume performance — all computed server-side from live data |
| **Search Config** | Persist your target titles, locations, salary range, required keywords, excluded keywords, and blacklisted companies — feeds directly into the scoring engine |
| **Source Status** | Real-time health dashboard showing which scraper APIs are online, their response latency, and whether optional sources like Adzuna are configured |

---

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Framework | Next.js 14 (App Router) | Server components, API routes, and client components in one repo |
| Language | TypeScript | End-to-end type safety across API and UI |
| Styling | Tailwind CSS v3 | Utility-first, zero runtime CSS |
| ORM | Prisma v5 | Type-safe DB queries, migration tooling, dual-URL support for poolers |
| Database | PostgreSQL via Supabase | Persistent, serverless-friendly via PgBouncer connection pooler |
| AI | Grok API (xAI) | OpenAI-compatible REST API; powers resume analysis; falls back to keyword matching when key is absent |
| Hosting | Vercel | Serverless edge deployment, automatic preview builds on every push |
| Charts | Pure SVG + Tailwind | Zero additional dependencies for analytics visualisations |

---

## End-to-End User Guide

This guide walks through the full lifecycle of using Custom Job Finder — from the moment you open the app for the first time to tracking your first offer. Follow these steps in order for the best experience.

---

### Step 1 — Configure Your Job Search Preferences

**Go to:** Sidebar → **Search Config** (`/settings`)

Before scraping any jobs, tell the app what you are looking for. Everything in the app — scoring, filtering, and recommendations — is driven by this config.

**Fill in each field:**

| Field | What to enter | Example |
|-------|--------------|---------|
| **Job Titles** | Comma-separated list of roles you are targeting. The scorer does word-level matching, so "React Developer" also matches "Senior React Engineer". | `Frontend Developer, React Engineer, UI Engineer` |
| **Location Type** | Choose `remote`, `hybrid`, or `onsite`. For remote-first searches, pick `remote`. | `remote` |
| **Preferred Locations** | City or country names. Ignored when Location Type is `remote`. | `Bangalore, Mumbai, London` |
| **Experience Level** | Your seniority. Exact-level matches score the highest; adjacent levels (e.g. mid for a senior role) get partial credit. | `mid` |
| **Salary Min / Max** | Annual salary in USD (or your currency). Leave blank if you have no preference. Jobs whose salary range overlaps yours get bonus points. | `80000` / `140000` |
| **Required Keywords** | Skills and technologies that a good job should mention. These directly boost match scores. | `React, TypeScript, GraphQL, Node.js` |
| **Excluded Keywords** | Terms that indicate a bad fit. Every excluded keyword found in a job description subtracts 10 points. | `PHP, Perl, on-site only` |
| **Blacklisted Companies** | Companies you never want to apply to. Jobs from these companies are forced to a match score of 0 regardless of fit. | `Bad Corp, Startup XYZ` |

Click **Save Config**. You will see a confirmation. The config is now active and all subsequent scrapes and score calculations will use it.

> **Tip:** You can update the config at any time. The next time you scrape or reload the inbox, scores are recalculated against the new config.

---

### Step 2 — Upload Your Resume

**Go to:** Sidebar → **Resume Tailoring** (`/resumes`)

Upload your resume so the app can run AI-powered match analysis later.

1. Click the upload zone (or drag and drop a file onto it).
2. Accepted formats: **PDF**, **DOCX**, **TXT**.
3. The server extracts the plain text from your file immediately — this extracted text is what gets sent to the AI.
4. Give the resume a label (e.g. "Full Stack Resume v2") to tell multiple versions apart.
5. Mark one resume as **Primary** using the star icon. The primary resume is pre-selected when you run analysis.

You can upload as many resumes as you like — one for each role type you are targeting (e.g. a frontend-focused version and a full-stack version).

---

### Step 3 — Scrape Live Job Listings

**Go to:** Sidebar → **Opportunity Inbox** (`/`)

1. Click the **Scrape Now** button in the top-right corner of the inbox.
2. A loading indicator appears while the server fetches jobs from all configured sources in parallel (RemoteOK, Remotive, Arbeitnow, Jobicy, The Muse, and Adzuna if credentials are set).
3. When scraping completes, a banner shows how many jobs were added and updated (e.g. "Added 47 new jobs, updated 12").
4. The inbox refreshes automatically.

**What happens during a scrape:**
- Each scraper fetches its public API and normalises the results
- Every job is run through the 6-factor scoring engine against your active config
- Jobs are upserted — re-scraping the same job updates its score but never creates a duplicate

> **Tip:** Scrape once a day to stay current. Job listings expire and new ones appear daily.

**Seed data (optional):** If you want to explore the app without scraping live data, click **Seed Data** to load 25 realistic mock jobs instantly. These only appear in development — they are not added in production.

---

### Step 4 — Review the Opportunity Inbox

**Go to:** Sidebar → **Opportunity Inbox** (`/`)

The inbox organises jobs into three sections at the top:

| Section | Meaning |
|---------|---------|
| **⚡ Quick Wins** | Match score ≥ 78 AND low effort to tailor. Apply to these first. |
| **🎯 Best Bets** | Match score ≥ 65 with manageable effort. Your primary pipeline. |
| **All Jobs** | Every other scraped job, sorted by score descending by default. |

**Each job card shows:**
- Colour-coded score badge — **green** (70+), **amber** (40–69), **red** (< 40)
- Title, company, location, salary range, and posted date
- Tags (technologies mentioned in the listing)
- A **"WHY THIS MATCHED"** section that breaks down all six scoring factors and explains each one in plain English (e.g. "Exact title match with 'Frontend Developer' — 30 pts")

**Filter and search the inbox:**
- Use the **search bar** to filter by title or company name
- Use the **Source** dropdown to see jobs only from one scraper
- Use the **Score** slider to hide jobs below a threshold
- Use **Status** tabs (New / Saved / All) to focus your view

**Actions on each card:**

| Button | What it does |
|--------|-------------|
| **Save** | Marks the job as saved (status → "saved"). It stays in the inbox but is visually distinguished. |
| **Track** | Creates an Application record for this job in the Kanban tracker (status → "bookmarked"). |
| **Dismiss** | Hides the job from the default inbox view (status → "dismissed"). Reversible via the "All" filter. |

---

### Step 5 — Analyse Your Resume Against a Job

**Go to:** Sidebar → **Resume Tailoring** (`/resumes`)

Once you have resumes uploaded and jobs scraped, run an AI analysis to see how well your resume matches a specific role.

1. Click on any resume card to open the resume detail page.
2. Click **Analyse Against Job**.
3. A job picker modal opens — search for the job by title or company.
4. Select a job and click **Run Analysis**.
5. The server sends your resume text and the job description to the Grok AI model.
6. Results appear within a few seconds:

| Result | Description |
|--------|-------------|
| **Match Score** | 0–100. How well your resume matches this specific role. |
| **Present Keywords** | Skills and technologies found in both your resume and the job description. |
| **Missing Keywords** | Skills the job asks for that are not in your resume — your tailoring checklist. |
| **Suggestions** | Specific, actionable rewrites the AI recommends (e.g. "Add a bullet about React performance optimisation to your most recent role"). |
| **Summary** | One-paragraph overall assessment. |

> **Tip:** Use the Missing Keywords list to decide whether to tailor your resume for this role or skip it. If 8+ critical skills are missing, it might be a stretch. If only 2–3 are missing and they are learnable, tailor and apply.

Re-running analysis on the same resume + job overwrites the previous result — useful after you update your resume.

---

### Step 6 — Move Jobs into Your Application Pipeline

**Go to:** Sidebar → **Application Tracker** (`/applications`)

The tracker is a Kanban board with five columns representing the hiring pipeline:

```
Bookmarked → Applied → Interview → Offer → Rejected
```

**To add a job to the tracker:**
- Click **Track** on any job card in the Opportunity Inbox → the job appears in the **Bookmarked** column automatically

**To move a job through the pipeline:**
1. Click on any application card to open the detail modal
2. Use the **Status** dropdown inside the modal to move it to the next stage
3. Or drag the card directly to the target column

**When you move a job to "Applied":**
- A **follow-up date** is automatically set to +5 business days from today (skipping weekends)
- The follow-up date appears on the card with a colour-coded urgency badge:
  - 🔴 **Overdue** — follow-up date has passed
  - 🟡 **Due soon** — due within 2 days
  - 🔵 **Upcoming** — more than 2 days away

**Inside the application modal you can:**
- Write free-text **notes** (interview prep notes, impressions, anything)
- Log **recruiter contact info** — name, email, LinkedIn URL
- Set or change the **follow-up date** manually
- View the full **event timeline** — every status change, recruiter update, and note you have added, with timestamps

---

### Step 7 — Monitor Your Pipeline in Analytics

**Go to:** Sidebar → **Analytics Dashboard** (`/analytics`)

The dashboard gives you a bird's-eye view of your entire job search. All data is computed in real time from your actual applications and scraped jobs — nothing is mocked.

**What you can see:**

| Chart / Section | What it tells you |
|----------------|-------------------|
| **Application Funnel** | How many applications are at each stage. Spot bottlenecks (e.g. "I have 40 applications but 0 interviews"). |
| **Match Score Distribution** | How well your scraped jobs match your config. A curve skewed left means your config is too strict — loosen keywords or add more titles. |
| **Weekly Trend** | Jobs scraped per week and average score over the last 8 weeks. Useful for tracking search activity. |
| **Top Job Titles** | Which job titles appear most often in your scraped results. Helps you validate that your target titles are real positions being hired for. |
| **Top Companies Hiring** | Which companies appear most in your results. Useful for company research and targeted outreach. |
| **Source Conversions** | How many jobs each scraper contributed vs. how many converted to applications vs. interviews. Tells you which sources are highest quality for you. |
| **Resume Performance** | If you have run analyses, this ranks your resumes by average match score across all the jobs you have analysed them against. |
| **Keyword Gaps** | Skills you are most frequently missing across all your resume analyses. This is your learning roadmap — the top 3–5 skills here are worth adding to your resume or studying. |

---

### Step 8 — Check That All Data Sources Are Working

**Go to:** Sidebar → **Source Status** (`/status`)

Before scraping, you can verify that all job APIs are reachable and responding.

The page pings each scraper's API in real time and shows:

| Status | Meaning |
|--------|---------|
| 🟢 **Online** | API responded successfully. The latency bar shows response time in ms. |
| 🔴 **Error** | API returned an error or timed out. Jobs from this source will not appear in the next scrape. |
| ⚫ **Disabled** | Source requires API credentials (e.g. Adzuna) that are not configured in your environment. |

The summary bar at the top shows how many sources are currently online (e.g. "5 / 6 sources online").

Click **Refresh** to re-run the health checks at any time.

> **Tip:** If a source shows an error before scraping, you can still scrape — the orchestrator uses `Promise.allSettled` so one failing source never blocks the others.

---

### Recommended Daily Workflow

Once the app is set up, a typical daily session looks like this:

```
1. Open Source Status → confirm all sources are online
2. Open Opportunity Inbox → click Scrape Now
3. Review Quick Wins and Best Bets — save or track anything interesting
4. For each tracked job → open Resume Tailoring → run analysis → review Missing Keywords
5. If applying → move the card to Applied in the Tracker → note recruiter info
6. Check the Timeline on any Applied jobs whose follow-up date is today or overdue
7. Glance at Analytics once a week to check funnel health and keyword gaps
```

---

### Frequently Asked Questions

**Q: The inbox is empty after scraping. What's wrong?**
Your Search Config might be too strict. Try broadening your Required Keywords list, adding more job titles, or temporarily removing Excluded Keywords. You can also click **Seed Data** to verify the UI is working.

**Q: All my jobs have low scores (< 40). Why?**
The most common cause is Required Keywords — if you have listed 15 keywords and most jobs only mention 2–3, the keyword factor will score very low. Try reducing your list to the 4–5 most important skills.

**Q: AI analysis just shows keyword matching results, not a proper AI analysis.**
This means `GROK_API_KEY` is not set in your environment. The app falls back to keyword matching automatically. Add your key from [console.x.ai](https://console.x.ai) to `.env` (locally) or Vercel environment variables (production) and restart.

**Q: I see "Disabled" for Adzuna on the Source Status page.**
Adzuna requires a free API key. Register at [developer.adzuna.com](https://developer.adzuna.com), copy your Application ID and API Key, and add them as `ADZUNA_APP_ID` and `ADZUNA_API_KEY` in your environment variables. The scraper activates automatically when both are present.

**Q: Can I use the app without Supabase?**
No — a PostgreSQL database is required. Supabase's free tier is sufficient (500 MB, no card needed). The app also works with any other PostgreSQL provider (Railway, Neon, Render, self-hosted) — just update the connection strings in `.env`.

**Q: I applied for a job outside the app. Can I still track it?**
Yes. Go to the Opportunity Inbox, find the job (or scrape for it), click **Track** to create an application, then immediately open the modal and move it to **Applied**. Set the applied date manually if needed.

---

```
Browser
  │
  ├── /                    → Opportunity Inbox (client component, fetches /api/jobs)
  ├── /applications        → Kanban Tracker (client component, fetches /api/applications)
  ├── /analytics           → Analytics Dashboard (client component, fetches /api/analytics)
  ├── /resumes             → Resume Tailoring (client component, fetches /api/resumes)
  ├── /settings            → Search Config (client component, fetches /api/config)
  └── /status              → Source Status (client component, fetches /api/scrapers/status)
        │
        ▼
  Next.js API Routes (src/app/api/**)
        │
        ├── src/lib/db.ts                  ← singleton Prisma client
        ├── src/lib/scoring.ts             ← 6-factor weighted scoring engine
        ├── src/lib/scrapers/              ← RemoteOK, Remotive, Arbeitnow, Jobicy, The Muse, Adzuna, mock adapters
        ├── src/lib/ai/tailor.ts           ← Grok API call / keyword-match fallback
        ├── src/lib/follow-up.ts           ← follow-up date + urgency logic
        └── src/lib/serialize-application.ts  ← shared serialisation helpers
              │
              ▼
        Supabase PostgreSQL
        (pooled at port 6543 via PgBouncer at runtime;
         direct at port 5432 for schema migrations)
```

**Request flow for a scrape:**
1. User clicks "Scrape Now" → `POST /api/jobs/scrape`
2. Server calls `getActiveSearchConfig()` to load preferences from the database
3. Each scraper (RemoteOK, Remotive) fetches its public JSON API and normalises results into a `RawJob` object
4. `calculateMatchScore(job, config)` runs the 6-factor scorer synchronously for every job
5. Prisma upserts each job — the `@@unique([title, company, source])` constraint prevents duplicates
6. Response returns counts of new and updated jobs

---

## Database Schema

All models live in `prisma/schema.prisma`. Prisma reads this file to generate a fully-typed TypeScript client and to create/update tables on the database.

### Job

Stores every scraped listing.

| Field | Type | Notes |
|-------|------|-------|
| `id` | String (cuid) | Primary key, auto-generated |
| `title` | String | Job title as scraped |
| `company` | String | Company name |
| `location` | String? | City/country string, or "Remote" |
| `locationType` | String? | "remote", "hybrid", or "onsite" |
| `url` | String | Original listing URL |
| `source` | String | "remoteok", "remotive", or "mock" |
| `description` | String? | Full job description HTML/text |
| `salaryMin` | Int? | Lower bound of salary range (annual) |
| `salaryMax` | Int? | Upper bound of salary range (annual) |
| `salaryCurrency` | String | Defaults to "USD" |
| `experienceLevel` | String? | "intern", "junior", "mid", "senior", "lead", "executive" |
| `matchScore` | Int | 0–100, computed by scoring engine at scrape time |
| `status` | String | "new" (default), "saved", "applied", "dismissed" |
| `tags` | String | JSON array of skill tags, stored as text |
| `companyInfoId` | String? | Optional FK to `CompanyInfo` |

**Unique constraint:** `[title, company, source]` — prevents duplicate listings. Re-scraping an existing job updates it instead of inserting a new row.

**Indexes:** `status`, `matchScore`, `createdAt` — keeps inbox filtering and sorting fast.

### Resume

Stores uploaded resume files and their extracted plain text.

| Field | Type | Notes |
|-------|------|-------|
| `id` | String (cuid) | Primary key |
| `name` | String | User-given label (e.g. "Senior Dev Resume") |
| `fileName` | String | Original upload filename |
| `textContent` | String | Full extracted text — this is what gets sent to the AI |
| `format` | String | "pdf", "docx", or "txt" |
| `isPrimary` | Boolean | Only one resume can be primary at a time |
| `wordCount` | Int | Computed on upload |

### ResumeAnalysis

One row per (resume, job) pair — stores the AI's analysis output.

| Field | Type | Notes |
|-------|------|-------|
| `matchScore` | Int | 0–100 match score returned by the AI |
| `presentKeywords` | String | JSON array of skills found in both resume and job description |
| `missingKeywords` | String | JSON array of skills in the job but not in the resume |
| `suggestions` | String | JSON array of specific rewrite suggestions |
| `summary` | String | One-paragraph AI-generated summary |

**Unique constraint:** `[resumeId, jobId]` — re-running analysis overwrites the previous result rather than accumulating duplicates.

### Application

Tracks a job through the hiring pipeline.

| Field | Type | Notes |
|-------|------|-------|
| `jobId` | String (unique) | One application per job — enforced at DB level |
| `status` | String | "bookmarked", "applied", "interview", "offer", "rejected" |
| `notes` | String | Free-text notes about this application |
| `recruiterName` | String | Recruiter contact name |
| `recruiterEmail` | String | Recruiter email |
| `recruiterLinkedIn` | String | Recruiter LinkedIn URL |
| `followUpDate` | DateTime? | Auto-set to +5 business days when status becomes "applied" |
| `appliedAt` | DateTime? | Timestamp of when you applied |
| `timeline` | String | JSON array of `{ event, timestamp, note }` — full audit trail |

### SearchConfig

Stores your job search preferences. Only the row with `isActive: true` is used.

| Field | Type | Notes |
|-------|------|-------|
| `titles` | String | JSON array of target job titles, e.g. `["Frontend Developer", "React Engineer"]` |
| `locations` | String | JSON array of preferred locations, e.g. `["New York", "Remote"]` |
| `locationType` | String? | "remote", "hybrid", or "onsite" |
| `experienceLevel` | String? | Your target seniority level |
| `salaryMin` | Int? | Minimum acceptable annual salary |
| `salaryMax` | Int? | Maximum expected annual salary |
| `includeKeywords` | String | JSON array — jobs are rewarded for containing these terms |
| `excludeKeywords` | String | JSON array — jobs are penalised for containing these terms |
| `blacklistedCompanies` | String | JSON array — jobs from these companies score 0 regardless of fit |

---

## Scoring Engine

**File:** `src/lib/scoring.ts`

Every job is scored 0–100 the moment it is scraped. The score is computed by summing six weighted factors:

| Factor | Max Points | How it scores |
|--------|-----------|---------------|
| **Title Match** | 30 | Exact title match = 30 pts. Substring match (e.g. "Developer" in "Senior Developer") = 20 pts. At least one word overlap = 10 pts. No match = 0 pts. |
| **Location Match** | 20 | Remote job + user wants remote = 20 pts. Exact city match = 20 pts. Same country (last segment of location string) = 10 pts. No match = 0 pts. |
| **Salary Fit** | 15 | Job salary fully within your range = 15 pts. Ranges overlap = 10 pts. Salary not listed = 8 pts (partial credit). Outside range = 0 pts. |
| **Keyword Fit** | 20 | Score is proportional to the fraction of your `includeKeywords` found in the job title + description + tags. Each `excludeKeyword` found subtracts 10 pts. |
| **Experience Fit** | 10 | Exact level match = 10 pts. One level away (e.g. mid vs senior) = 5 pts. Two or more levels away = 0 pts. |
| **Company Preference** | 5 | Not blacklisted = 5 pts. Blacklisted = −100 pts (effectively forces score to 0). |

**Score clamping:** The raw sum can go below 0 (e.g. blacklisted + many excluded keywords). The final score is always `Math.max(0, Math.min(100, rawTotal))`.

**No config penalty:** If you haven't set a preference for a given factor (e.g. no salary range, no target titles), that factor automatically grants its full points. The score only penalises when you've expressed a preference and the job doesn't match it.

### Priority Insights

On top of the match score, each job receives a `priorityScore` and a recommendation label, calculated in `calculatePriorityInsights()`:

**Effort Score (0–100):** Estimates how much resume tailoring the role needs before applying.
- Starts at 25
- +35 if no keywords matched (high tailoring needed)
- +20 if keywords partially matched
- +20 if title was a weak match
- +10 if experience level doesn't match
- +10 if salary is outside range
- +10 if location doesn't match
- +5 if the job has no description
- Forced to 100 if company is blacklisted

**Priority Score:** `matchScore − (effortScore × 0.35) + freshnessBonus`
- `freshnessBonus` is up to 15 points for jobs posted within the last 15 days, dropping linearly to 0 after 15 days

**Recommendation labels:**
- `quick-win` — matchScore ≥ 78 AND effortScore ≤ 40: strong fit, minimal tailoring needed
- `best-bet` — matchScore ≥ 65 AND priorityScore ≥ 60: solid fit with manageable effort
- `stretch` — matchScore ≥ 50: promising but needs tailoring
- `low-priority` — everything else, or any blacklisted company

---

## AI Resume Analysis

**File:** `src/lib/ai/tailor.ts`

When you run an analysis on a resume against a job, the server:

1. Builds a structured prompt containing the full resume text and the job description
2. Sends it to the **Grok API** (`grok-3` model via `https://api.x.ai/v1/chat/completions`) using a standard `fetch` call — no SDK required because xAI uses the OpenAI-compatible REST format
3. Parses the response to extract a JSON payload with `matchScore`, `presentKeywords`, `missingKeywords`, and `suggestions`
4. Saves the result to the `ResumeAnalysis` table (upserted on `[resumeId, jobId]`)

**Graceful fallback:** If `GROK_API_KEY` is not set, or if the API call fails for any reason, the function automatically falls back to a local keyword-matching algorithm. The fallback compares the resume text against the job description using term frequency, so the app is fully usable without an API key — just less nuanced.

```
GROK_API_KEY set?
  YES → POST https://api.x.ai/v1/chat/completions
          ↓ error or timeout?
          → fall back to keyword matching
  NO  → keyword matching directly
```

---

## API Reference

All routes are under `/api`. Every route returns JSON.

### Jobs

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/jobs` | List jobs. Supports query params: `status`, `source`, `minScore`, `q` (full-text search), `sort` |
| `GET` | `/api/jobs/[id]` | Single job with full match score breakdown and priority insights |
| `PATCH` | `/api/jobs/[id]` | Update job `status` (e.g. dismiss, archive) |
| `POST` | `/api/jobs/scrape` | Trigger a live scrape from RemoteOK + Remotive. Returns `{ added, updated, total }` |
| `POST` | `/api/jobs/seed` | Load 25 mock demo jobs. Useful for testing without scraping |

### Applications

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/applications` | List all applications with job details |
| `POST` | `/api/applications` | Create application. Body: `{ jobId, status }`. Auto-sets follow-up date if status is "applied" |
| `GET` | `/api/applications/[id]` | Single application with job, score breakdown, timeline |
| `PATCH` | `/api/applications/[id]` | Update status, notes, recruiter info, follow-up date. Auto-appends timeline events |
| `DELETE` | `/api/applications/[id]` | Remove the application (the job record is kept) |
| `POST` | `/api/applications/[id]/timeline` | Append a custom timeline event. Body: `{ event, note }` |

### Resumes

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/resumes` | List all resumes |
| `POST` | `/api/resumes` | Upload a resume file (multipart/form-data, field name: `file`). Accepts PDF, DOCX, TXT |
| `GET` | `/api/resumes/[id]` | Single resume with all its analyses |
| `DELETE` | `/api/resumes/[id]` | Delete resume and all associated analyses (cascade) |
| `POST` | `/api/resumes/[id]/analyze` | Run AI analysis. Body: `{ jobId }`. Returns the `ResumeAnalysis` record |

### Config and Analytics

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/config` | Get the active search config |
| `PUT` | `/api/config` | Save or update search config. Body: all `SearchConfig` fields |
| `GET` | `/api/analytics` | Compute and return the full analytics payload |

---

## Project Structure

```
CustomJobFinder/
├── prisma/
│   └── schema.prisma              # All database models, relations, and indexes
│
├── src/
│   ├── app/
│   │   ├── layout.tsx             # Root layout — wraps every page with the sidebar
│   │   ├── page.tsx               # / — redirects to Opportunity Inbox
│   │   ├── analytics/
│   │   │   └── page.tsx           # Analytics dashboard
│   │   ├── applications/
│   │   │   └── page.tsx           # Kanban application tracker
│   │   ├── resumes/
│   │   │   ├── page.tsx           # Resume list and uploader
│   │   │   └── [id]/page.tsx      # Single resume with analysis results
│   │   ├── settings/
│   │   │   └── page.tsx           # Search config form
│   │   └── api/                   # All Next.js API route handlers
│   │       ├── analytics/route.ts
│   │       ├── applications/route.ts
│   │       ├── applications/[id]/route.ts
│   │       ├── applications/[id]/timeline/route.ts
│   │       ├── config/route.ts
│   │       ├── jobs/route.ts
│   │       ├── jobs/[id]/route.ts
│   │       ├── jobs/scrape/route.ts
│   │       ├── jobs/seed/route.ts
│   │       ├── resumes/route.ts
│   │       ├── resumes/[id]/route.ts
│   │       └── resumes/[id]/analyze/route.ts
│   │
│   ├── components/
│   │   ├── Sidebar.tsx             # Navigation sidebar with active-link highlighting
│   │   ├── JobCard.tsx             # Job card — score badge, breakdown, action buttons
│   │   ├── JobDetail.tsx           # Expanded job detail side-panel
│   │   ├── FilterBar.tsx           # Search and filter controls for the inbox
│   │   ├── ScoreBadge.tsx          # Colour-coded 0–100 score pill component
│   │   ├── KanbanBoard.tsx         # Full Kanban board layout
│   │   ├── KanbanColumn.tsx        # Single Kanban column (one per pipeline stage)
│   │   ├── ApplicationCard.tsx     # Compact card within a Kanban column
│   │   ├── ApplicationModal.tsx    # Full application editor modal
│   │   ├── TimelineEntry.tsx       # Single timeline event row in the modal
│   │   ├── AnalyticsDashboard.tsx  # All analytics chart components (SVG-based)
│   │   ├── AnalysisPanel.tsx       # Resume analysis result display
│   │   ├── ResumeCard.tsx          # Resume list item card
│   │   ├── ResumeUploader.tsx      # Drag-and-drop file upload zone
│   │   ├── JobPickerModal.tsx      # Job selector modal for resume analysis
│   │   ├── ApprovalGateModal.tsx   # Generic confirmation dialog
│   │   └── TagInput.tsx            # Tag input for comma-separated config arrays
│   │
│   ├── lib/
│   │   ├── db.ts                   # Prisma client singleton — prevents connection pool exhaustion
│   │   ├── scoring.ts              # 6-factor weighted scoring + priority insights engine
│   │   ├── follow-up.ts            # Business-day arithmetic + urgency classification
│   │   ├── dedup.ts                # Deduplication helpers used during scraping
│   │   ├── json-arrays.ts          # serializeJob() — parses JSON fields, computes live scores
│   │   ├── search-config.ts        # getActiveSearchConfig() — single place to fetch config
│   │   ├── serialize-application.ts # Shared JOB_SELECT + serializeApplication helpers
│   │   ├── ai/
│   │   │   └── tailor.ts           # Grok API call and keyword-matching fallback
│   │   ├── parsers/
│   │   │   ├── pdf.ts              # PDF → plain text via pdf-parse
│   │   │   ├── docx.ts             # DOCX → plain text via mammoth
│   │   │   └── txt.ts              # TXT passthrough
│   │   └── scrapers/
│   │       ├── index.ts            # Orchestrates all scrapers in parallel
│   │       ├── remoteok.ts         # RemoteOK public JSON API adapter
│   │       ├── remotive.ts         # Remotive public JSON API adapter
│   │       ├── mock.ts             # 25 realistic seed jobs for local testing
│   │       └── types.ts            # RawJob interface shared across scrapers
│   │
│   └── types/
│       └── index.ts                # All shared TypeScript types and interfaces
│
├── .env                            # Local environment variables (gitignored — never committed)
├── package.json
└── README.md
```

---

## Local Development Setup

### Prerequisites

- Node.js 18 or later. Use [nvm](https://github.com/nvm-sh/nvm) to manage versions: `nvm use 22`
- A PostgreSQL database. The easiest free option is [Supabase](https://supabase.com) (free tier, instant setup)

### Step 1 — Clone and install dependencies

```bash
git clone https://github.com/lohith261/CustomJobFinder.git
cd CustomJobFinder
npm install
```

`npm install` automatically runs `prisma generate` via the `postinstall` hook. This generates the TypeScript Prisma client from `schema.prisma` into `node_modules/@prisma/client`. No network call is made at this step.

### Step 2 — Create your `.env` file

Create a `.env` file at the project root (it is gitignored and will never be committed):

```env
# Supabase Postgres — pooled connection for runtime use
# This goes through PgBouncer (port 6543), which is safe for serverless functions.
# pgbouncer=true disables prepared statements, which PgBouncer's Transaction mode doesn't support.
DATABASE_URL="postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true"

# Supabase Postgres — direct connection for Prisma migrations
# This bypasses PgBouncer and connects directly to Postgres (port 5432).
# Prisma needs this for CREATE TABLE / ALTER TABLE commands used by db push.
DIRECT_URL="postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres"

# Grok (xAI) API key — powers AI resume analysis
# Get yours free at https://console.x.ai
# If this is missing, the app silently falls back to keyword-matching analysis.
GROK_API_KEY="your-grok-api-key"
```

**Where to find your Supabase connection strings:**
1. Open your Supabase project dashboard
2. Click the **Connect** button in the top navbar
3. Under "Connection string" → "URI" tab:
   - Copy the **Transaction pooler** string (port 6543) → paste as `DATABASE_URL`
   - Copy the **Direct connection** string (port 5432) → paste as `DIRECT_URL`
4. Replace `[YOUR-PASSWORD]` with your actual database password

**Important — URL-encode special characters in passwords:**
Postgres connection strings are URLs. If your password contains any of these characters, encode them before pasting:

| Character | Encoded |
|-----------|---------|
| `&` | `%26` |
| `@` | `%40` |
| `[` | `%5B` |
| `]` | `%5D` |
| `#` | `%23` |
| `?` | `%3F` |
| ` ` (space) | `%20` |

Example: password `my&pass@word` becomes `my%26pass%40word` in the URL.

### Step 3 — Push the schema to your database

```bash
npm run db:push
```

This runs `prisma db push`, which reads `schema.prisma` and creates all tables, indexes, and constraints on your Postgres database. It uses `DIRECT_URL` (port 5432) because DDL statements require a direct connection.

You only need to run this:
- Once when setting up for the first time
- Again if you modify `schema.prisma` (add a field, new model, etc.)

### Step 4 — Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The app is now running against your real Supabase database.

### Step 5 — Seed demo data (optional)

Click **"Seed Data"** in the Opportunity Inbox to load 25 realistic mock jobs. This lets you explore the scoring, filtering, and analytics without needing to scrape live data first.

---

## Deploying to Vercel

### Step 1 — Connect the repository

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import the GitHub repository `lohith261/CustomJobFinder`
3. Vercel detects Next.js automatically — no build settings need to change

### Step 2 — Add environment variables

Go to your Vercel project → **Settings → Environment Variables** and add:

| Name | Value | Notes |
|------|-------|-------|
| `DATABASE_URL` | Supabase Transaction pooler URL (port 6543, with `?pgbouncer=true`) | Used by the app at runtime |
| `DIRECT_URL` | Supabase direct connection URL (port 5432) | Used by Prisma CLI for migrations |
| `GROK_API_KEY` | Your xAI Grok API key | Optional — app falls back to keyword matching without it |

Set all three for Production, Preview, and Development environments.

### Step 3 — Deploy

Push a commit or go to **Deployments → Redeploy** (uncheck "Use existing build cache" for a clean build).

**What happens during the Vercel build:**
1. `npm install` runs → installs packages → `postinstall` runs `prisma generate` (generates TypeScript client, no DB connection)
2. `npm run build` runs → `prisma generate` again (fast, idempotent) → `next build` compiles the app
3. No database connection is made during the build. The schema was already applied by `db push` from your local machine.

### Why `prisma db push` was removed from the build script

An earlier version of this project included `prisma db push` in `npm run build`. This caused Vercel builds to fail because:

1. Vercel's build servers cannot reach Supabase's direct Postgres port (5432) — only the PgBouncer pooler port (6543) is reachable from serverless/cloud environments
2. PgBouncer's Transaction mode does not support the prepared statements and DDL commands that `prisma db push` uses
3. Running schema migrations on every deploy is unsafe — if two deploys run simultaneously, both try to alter the schema at the same time

**The correct workflow is:**
- Schema changes: run `npm run db:push` locally (where port 5432 is reachable)
- Vercel builds: only run `prisma generate` (code generation, no DB connection)

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL pooled connection string (PgBouncer, port 6543). Used by the app at runtime for all queries. Must include `?pgbouncer=true`. |
| `DIRECT_URL` | Yes | PostgreSQL direct connection string (port 5432). Used by Prisma CLI (`db push`, `migrate`) to run schema changes. Not used by the running app. |
| `GROK_API_KEY` | No | xAI Grok API key. Enables AI-powered resume analysis. Without it, the app uses keyword matching as a fallback — all other features work normally. |
| `ADZUNA_APP_ID` | No | Adzuna Application ID. Register free at [developer.adzuna.com](https://developer.adzuna.com). Without it, the Adzuna scraper is silently disabled. |
| `ADZUNA_API_KEY` | No | Adzuna API Key. Required alongside `ADZUNA_APP_ID`. Both must be present for the scraper to activate. |

---

## How Each Feature Works

### Opportunity Inbox (`/`)

The page loads `GET /api/jobs` and groups results into three sections: Quick Wins, Best Bets, and a full flat list. Each `JobCard` shows:

- **Score badge** — colour-coded: green (≥ 70), amber (40–69), red (< 40)
- **Job metadata** — salary, location, location type, tags, posted date
- **"WHY THIS MATCHED" breakdown** — the six scoring factors, each with its contribution and a human-readable reason (e.g. "Exact match with your preferred title 'Frontend Developer'.")
- **Priority label** — Quick Win, Best Bet, Stretch, or Low Priority
- **Action buttons** — Save, Track (creates an Application record), Dismiss, Archive

Clicking **Scrape Now** sends `POST /api/jobs/scrape`. The server loads the active search config, calls all enabled scrapers (RemoteOK, Remotive, Arbeitnow, Jobicy, The Muse, Adzuna) in parallel via `Promise.allSettled` — so one failing API never blocks the rest. Each result is normalised into a `RawJob`, scored, and upserted. The `@@unique([title, company, source])` constraint means re-scraping never duplicates a listing.

### Application Tracker (`/applications`)

A Kanban board with five columns. Moving a card (via drag or the status dropdown in the detail modal) sends `PATCH /api/applications/[id]` with the new status.

**Automatic follow-up dates:** When an application moves to "applied", the server computes a follow-up date of +5 business days (skipping weekends) from the current date. The modal shows urgency badges:
- Red "Overdue" — follow-up date is in the past
- Amber "Due soon" — within 2 days
- Blue "Upcoming" — further out

**Timeline:** Every status change, recruiter info update, and follow-up date change is automatically appended to the `timeline` JSON array. Each entry has an event type, human-readable description, and ISO timestamp. This creates a full audit trail you can scroll through in the modal.

**Recruiter info:** You can log recruiter name, email, and LinkedIn URL on any application. Updating these fields also adds a timeline entry noting what changed and when.

### Resume Tailoring (`/resumes`)

Upload a resume in PDF, DOCX, or TXT format using the drag-and-drop uploader. On upload:
1. The server reads the file from the multipart form data
2. Routes it to the correct parser (`pdf-parse` for PDFs, `mammoth` for DOCX, plain passthrough for TXT)
3. Extracts the plain text and stores it in `Resume.textContent`
4. Counts the words and stores them in `Resume.wordCount`

To analyse a resume against a job:
1. Click "Analyse Against Job" on a resume
2. Pick a job from the job picker modal
3. The server sends both the resume text and job description to the Grok API
4. The AI returns a structured response with `matchScore`, `presentKeywords`, `missingKeywords`, and `suggestions`
5. Results are saved to `ResumeAnalysis` and displayed immediately

Re-running analysis on the same (resume, job) pair overwrites the previous result.

### Analytics Dashboard (`/analytics`)

All analytics are computed in a single `GET /api/analytics` call using `Promise.all` to run 15 database queries in parallel. Nothing is pre-aggregated — data is always fresh.

Key computations:

- **Application funnel** — `groupBy(status)` on the Application table, mapped onto the fixed `KANBAN_COLUMNS` order so empty stages still appear with a count of 0
- **Score distribution** — all non-dismissed job scores fetched and bucketed in JavaScript into five ranges: 0–29, 30–49, 50–69, 70–89, 90–100
- **Weekly trend** — a raw PostgreSQL query using `DATE_TRUNC('week', createdAt)` and `TO_CHAR(...)` to group jobs by ISO week number, returning average score and job count per week for the last 8 weeks
- **Top titles and companies** — `groupBy` with `_count` and `_avg(matchScore)`, ordered by count descending
- **Source conversions** — job counts per source joined in memory with application counts per source to compute interview conversion rates
- **Resume performance** — resumes ranked by average match score across all their analyses, showing top 6
- **Keyword gaps** — all `missingKeywords` arrays from every analysis are flattened, normalised to lowercase, and counted — surfaces the skills you're most often missing

Charts are rendered as pure SVG with inline Tailwind classes — no charting library is used.

### Search Config (`/settings`)

A form that reads from and writes to the `SearchConfig` table. Changes take effect immediately on the next scrape or job list load — the scoring engine always reads the current active config at query time. All array fields (titles, locations, keywords, companies) are stored as JSON strings in the database and parsed/serialised by helper functions in `src/lib/json-arrays.ts`.

### Source Status (`/status`)

A live health dashboard for all scraper APIs. On page load, `GET /api/scrapers/status` is called — the server pings each API concurrently with a 6-second timeout and returns a status object per source. Each response includes:

- **status** — `"online"`, `"error"`, or `"disabled"`
- **latency** — response time in milliseconds (for online sources)
- **error** — error message (for failed sources)

The UI renders each source as a card with a coloured badge and a proportional latency bar. The summary bar at the top counts how many sources are currently reachable. A **Refresh** button re-triggers the health check without reloading the page.

Adzuna shows **Disabled** instead of attempting a network call when `ADZUNA_APP_ID` or `ADZUNA_API_KEY` are absent from the environment, so the page is always honest about what is configured.
