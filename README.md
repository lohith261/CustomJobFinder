# Custom Job Finder

A local-first job search assistant built with Next.js, Prisma, and SQLite.

## What It Does

- Scrapes and stores job listings
- Scores jobs against your search preferences
- Tracks applications in a kanban pipeline
- Uploads and parses resumes
- Analyzes resume-to-job fit with AI-backed or fallback matching
- Shows analytics across your job search activity

## Main Areas

- `Opportunity Inbox` for collected jobs
- `Applications` for tracking progress
- `Resume Tailoring` for uploads and job-fit analysis
- `Analytics` for funnel and score insights
- `Search Config` for role, location, salary, and keyword preferences

## Tech Stack

- Next.js 14
- React
- TypeScript
- Tailwind CSS
- Prisma
- SQLite

## Local Setup

```bash
npm install
npm run db:generate
npm run db:push
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment

Create a `.env` file for any optional API keys you want to use for resume analysis.

Example:

```env
GROK_API_KEY=your_key_here
```

Without an API key, the app falls back to a built-in keyword-based analysis flow.
