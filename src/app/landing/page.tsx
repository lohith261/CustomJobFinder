"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";

// ─── Data ────────────────────────────────────────────────────────────────────

const JOB_BOARDS = ["LinkedIn", "Indeed", "Naukri", "Internshala", "RemoteOK", "Remotive", "Adzuna", "The Muse"];

const FEATURES = [
  {
    number: "01",
    title: "Smart Job Matching",
    description: "Scrapes LinkedIn, Indeed, Naukri, RemoteOK and more daily. Every listing gets an AI match score based on your target role, salary, location and skills.",
    icon: "🎯",
    gradient: "from-brand-950 to-brand-900",
    iconBg: "bg-brand-500/20 text-brand-400",
    wide: true,
  },
  {
    number: "02",
    title: "AI Resume Analysis",
    description: "Upload your resume once. Get keyword match scores, missing skills, and specific rewrite suggestions tailored to each job.",
    icon: "📄",
    gradient: "from-indigo-950 to-indigo-900",
    iconBg: "bg-indigo-500/20 text-indigo-400",
    wide: false,
  },
  {
    number: "03",
    title: "Cover Letters in Seconds",
    description: "One click generates a personalised cover letter in your tone — Professional, Conversational, or Enthusiastic. Editable and saved per job.",
    icon: "✍️",
    gradient: "from-purple-950 to-purple-900",
    iconBg: "bg-purple-500/20 text-purple-400",
    wide: false,
  },
  {
    number: "04",
    title: "Application Tracker",
    description: "Drag-and-drop Kanban board tracks every application from Bookmarked to Offer. Follow-up reminders so nothing falls through the cracks.",
    icon: "📋",
    gradient: "from-amber-950 to-amber-900",
    iconBg: "bg-amber-500/20 text-amber-400",
    wide: false,
  },
  {
    number: "05",
    title: "Analytics That Guide You",
    description: "See your funnel, which sources convert best, missing keywords, and how match scores trend week over week.",
    icon: "📊",
    gradient: "from-rose-950 to-rose-900",
    iconBg: "bg-rose-500/20 text-rose-400",
    wide: false,
  },
  {
    number: "06",
    title: "Full Automation Pipeline",
    description: "One click: scrape → score → analyse → generate cover letters → auto-track. Your entire job search workflow in under 60 seconds.",
    icon: "⚡",
    gradient: "from-gray-900 to-gray-800",
    iconBg: "bg-brand-500/20 text-brand-400",
    wide: true,
  },
];

const STATS = [
  { value: "8+", label: "Job boards scraped daily" },
  { value: "60s", label: "Full pipeline runtime" },
  { value: "₹499", label: "Pro plan / month" },
  { value: "100%", label: "Private — your data only" },
];

const TESTIMONIALS = [
  {
    quote: "I used to spend 3 hours a day scanning job boards. Job Tailor cut that to 15 minutes. The match scores are eerily accurate.",
    name: "Priya S.",
    role: "Senior Product Manager",
    location: "Bangalore",
    initials: "PS",
    color: "bg-brand-600",
  },
  {
    quote: "The cover letter generator nailed my tone on the first try. Got a callback from Flipkart within 48 hours of applying.",
    name: "Rahul M.",
    role: "Software Engineer",
    location: "Hyderabad",
    initials: "RM",
    color: "bg-indigo-600",
  },
  {
    quote: "Finally a job search tool built for Indian job seekers — it actually knows Naukri and LinkedIn India. Game changer.",
    name: "Ananya K.",
    role: "Data Analyst",
    location: "Pune",
    initials: "AK",
    color: "bg-purple-600",
  },
];

const FREE_FEATURES = [
  "Opportunity Inbox (unlimited scraping)",
  "Application Tracker (Kanban board)",
  "Analytics dashboard",
  "1 resume upload",
  "3 AI resume analyses / month",
  "3 AI cover letters / month",
  "2 cold outreach emails / month",
];

const PRO_FEATURES = [
  "Everything in Free",
  "Unlimited AI resume analyses",
  "Unlimited cover letter generation",
  "Unlimited cold outreach emails",
  "Tailored resume generation (LaTeX + PDF)",
  "Full automation pipeline",
  "Multiple search profiles",
  "Full analytics with trends",
  "Priority support",
];

// ─── Hooks ───────────────────────────────────────────────────────────────────

function useReveal() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add("jt-visible"); }),
      { threshold: 0.12 }
    );
    document.querySelectorAll(".jt-reveal").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);
}

function useTypewriter(text: string, speed: number, active: boolean) {
  const [out, setOut] = useState("");
  useEffect(() => {
    if (!active) { setOut(""); return; }
    let i = 0;
    const id = setInterval(() => {
      i++;
      setOut(text.slice(0, i));
      if (i >= text.length) clearInterval(id);
    }, speed);
    return () => clearInterval(id);
  }, [active, text, speed]);
  return out;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function CheckIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
    </svg>
  );
}

function Marquee() {
  const boards = [...JOB_BOARDS, ...JOB_BOARDS];
  return (
    <div className="mt-16 overflow-hidden border-t border-white/10 pt-10">
      <p className="mb-6 text-center text-xs font-semibold uppercase tracking-widest text-gray-600">Scraped daily from</p>
      <div className="relative">
        <div className="jt-marquee flex w-max gap-0">
          {boards.map((board, i) => (
            <span
              key={i}
              className="mx-8 whitespace-nowrap text-sm font-semibold text-gray-500 transition-colors hover:text-gray-200"
            >
              {board}
            </span>
          ))}
        </div>
        {/* Fade edges */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-gray-950 to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-gray-950 to-transparent" />
      </div>
    </div>
  );
}

// ─── Landing Page ─────────────────────────────────────────────────────────────

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  useReveal();

  return (
    <div className="min-h-screen bg-white text-gray-900 antialiased">

      {/* ── Navbar ── */}
      <header className="sticky top-0 z-50 border-b border-white/5 bg-gray-950/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5 sm:px-6">
          <Link href="/landing" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500 shadow-lg shadow-brand-900/50">
              <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
              </svg>
            </div>
            <span className="text-base font-bold tracking-tight text-white">Job Tailor</span>
          </Link>

          <nav className="hidden items-center gap-7 sm:flex">
            {[
              { href: "#demo",         label: "Demo" },
              { href: "#features",     label: "Features" },
              { href: "#how-it-works", label: "How it works" },
              { href: "#pricing",      label: "Pricing" },
            ].map((item) => (
              <a key={item.href} href={item.href} className="text-sm font-medium text-gray-400 transition-colors hover:text-white">
                {item.label}
              </a>
            ))}
          </nav>

          <div className="hidden items-center gap-3 sm:flex">
            <Link href="/login" className="text-sm font-medium text-gray-400 transition-colors hover:text-white">Sign in</Link>
            <Link
              href="/signup"
              className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-brand-900/40 transition-all hover:bg-brand-400"
            >
              Get started free
            </Link>
          </div>

          <button
            className="flex items-center justify-center rounded-md p-2 text-gray-400 sm:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              {mobileMenuOpen
                ? <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                : <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />}
            </svg>
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="border-t border-white/5 bg-gray-950 px-4 py-4 sm:hidden">
            <nav className="flex flex-col gap-4">
              {["#demo", "#features", "#how-it-works", "#pricing"].map((href) => (
                <a key={href} href={href} onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium text-gray-300">
                  {href.replace("#", "").replace("-", " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                </a>
              ))}
              <Link href="/login"  className="text-sm font-medium text-gray-300">Sign in</Link>
              <Link href="/signup" className="rounded-lg bg-brand-500 px-4 py-2 text-center text-sm font-semibold text-white">Get started free</Link>
            </nav>
          </div>
        )}
      </header>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-gray-950 pb-24 pt-20 sm:pb-32 sm:pt-28 jt-grid-bg">
        {/* Ambient glows */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-0 h-[700px] w-[1000px] -translate-x-1/2 -translate-y-1/3 rounded-full bg-brand-900/25 blur-3xl" />
          <div className="absolute -right-32 top-1/3 h-[350px] w-[350px] rounded-full bg-indigo-900/15 blur-3xl" />
          <div className="absolute -left-32 bottom-0 h-[300px] w-[300px] rounded-full bg-brand-800/10 blur-3xl" />
        </div>

        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          {/* Badge */}
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-brand-800/50 bg-brand-950/80 px-4 py-1.5 text-xs font-semibold text-brand-300 ring-1 ring-brand-700/20">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-400 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-brand-400" />
            </span>
            Built for Indian job seekers · Early access
          </div>

          <h1 className="text-4xl font-extrabold leading-[1.08] tracking-tight text-white sm:text-5xl md:text-6xl lg:text-[72px]">
            The job search{" "}
            <br className="hidden sm:block" />
            <span className="jt-shimmer-text">your career deserves.</span>
          </h1>

          <p className="mx-auto mt-7 max-w-2xl text-lg leading-relaxed text-gray-400 sm:text-xl">
            Job Tailor scrapes 8+ job boards daily, scores every listing against
            your profile with AI, and generates tailored cover letters — so you
            spend time applying, not searching.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/signup"
              className="group relative w-full max-w-xs overflow-hidden rounded-xl bg-brand-500 px-8 py-4 text-base font-bold text-white shadow-2xl shadow-brand-900/60 transition-all hover:bg-brand-400 hover:shadow-brand-800/70 sm:w-auto"
            >
              <span className="relative z-10">Start free — no card needed</span>
            </Link>
            <a
              href="#demo"
              className="w-full max-w-xs rounded-xl border border-white/10 bg-white/5 px-8 py-4 text-base font-semibold text-gray-200 backdrop-blur-sm transition-all hover:bg-white/10 hover:border-white/20 sm:w-auto"
            >
              Watch it work →
            </a>
          </div>

          <Marquee />
        </div>
      </section>

      {/* ── Stats strip ── */}
      <section className="border-y border-gray-100 bg-white">
        <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {STATS.map((stat, i) => (
              <div key={stat.label} className={`jt-reveal jt-reveal-d${i + 1} text-center`}>
                <p className="bg-gradient-to-br from-brand-600 to-brand-400 bg-clip-text text-4xl font-extrabold tracking-tight text-transparent sm:text-5xl">
                  {stat.value}
                </p>
                <p className="mt-2 text-sm text-gray-500">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 3D Product Demo ── */}
      <ProductDemoSection />

      {/* ── How it works ── */}
      <section id="how-it-works" className="bg-white py-24 sm:py-32">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="jt-reveal mx-auto max-w-2xl text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-brand-600">How it works</p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl md:text-5xl">
              From setup to offer in{" "}
              <span className="text-brand-600">four steps.</span>
            </h2>
            <p className="mt-5 text-lg text-gray-500">Built for people who want results, not busywork.</p>
          </div>

          <div className="mt-16 grid gap-0 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { step: "01", title: "Configure", desc: "Set your target titles, salary, location, and skills. Takes 5 minutes.", icon: "⚙️", color: "border-brand-200 bg-brand-50" },
              { step: "02", title: "Discover",  desc: "We pull fresh jobs from 8+ boards every day and AI-score them against your profile.", icon: "🔍", color: "border-indigo-200 bg-indigo-50" },
              { step: "03", title: "Apply",     desc: "Get tailored resumes and cover letters for your top matches. Apply in minutes.", icon: "✉️", color: "border-purple-200 bg-purple-50" },
              { step: "04", title: "Track",     desc: "Follow every application from first contact to offer on your Kanban board.", icon: "📌", color: "border-amber-200 bg-amber-50" },
            ].map((item, i) => (
              <div key={item.step} className={`jt-reveal jt-reveal-d${i + 1} relative flex flex-col items-start p-8`}>
                {/* Connector line */}
                {i < 3 && (
                  <div className="absolute right-0 top-14 hidden h-px w-8 bg-gradient-to-r from-gray-200 to-transparent lg:block" style={{ right: "-2rem" }} />
                )}
                <div className={`mb-5 flex h-12 w-12 items-center justify-center rounded-xl border text-2xl ${item.color}`}>
                  {item.icon}
                </div>
                <span className="mb-1 text-xs font-bold text-gray-400">{item.step}</span>
                <h3 className="mb-2 text-lg font-bold text-gray-900">{item.title}</h3>
                <p className="text-sm leading-relaxed text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features bento grid ── */}
      <section id="features" className="bg-gray-950 py-24 sm:py-32">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="jt-reveal mx-auto max-w-2xl text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-brand-400">Features</p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-white sm:text-4xl md:text-5xl">
              Everything to land your next role
            </h2>
            <p className="mt-5 text-lg text-gray-400">From discovering the right jobs to tracking every application.</p>
          </div>

          <div className="mt-14 grid gap-4 sm:grid-cols-3">
            {/* Row 1: wide + narrow */}
            <div className={`jt-reveal jt-reveal-d1 sm:col-span-2 rounded-2xl border border-white/5 bg-gradient-to-br ${FEATURES[0].gradient} p-8`}>
              <span className={`inline-flex h-10 w-10 items-center justify-center rounded-xl text-xl ${FEATURES[0].iconBg}`}>
                {FEATURES[0].icon}
              </span>
              <p className="mt-4 text-xs font-bold text-gray-500">{FEATURES[0].number}</p>
              <h3 className="mt-1 text-xl font-bold text-white">{FEATURES[0].title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-400">{FEATURES[0].description}</p>
              {/* Mini job card preview */}
              <div className="mt-6 space-y-2">
                {[
                  { title: "Senior ML Engineer", co: "Google", score: 94, color: "text-emerald-400" },
                  { title: "AI Engineer", co: "Flipkart", score: 87, color: "text-brand-400" },
                ].map((j) => (
                  <div key={j.title} className="flex items-center justify-between rounded-lg border border-white/5 bg-white/5 px-3 py-2">
                    <div>
                      <p className="text-xs font-semibold text-white">{j.title}</p>
                      <p className="text-[10px] text-gray-500">{j.co}</p>
                    </div>
                    <span className={`text-sm font-bold ${j.color}`}>{j.score}%</span>
                  </div>
                ))}
              </div>
            </div>

            <div className={`jt-reveal jt-reveal-d2 rounded-2xl border border-white/5 bg-gradient-to-br ${FEATURES[1].gradient} p-8`}>
              <span className={`inline-flex h-10 w-10 items-center justify-center rounded-xl text-xl ${FEATURES[1].iconBg}`}>
                {FEATURES[1].icon}
              </span>
              <p className="mt-4 text-xs font-bold text-gray-500">{FEATURES[1].number}</p>
              <h3 className="mt-1 text-lg font-bold text-white">{FEATURES[1].title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-400">{FEATURES[1].description}</p>
            </div>

            {/* Row 2: three equal */}
            {[2, 3, 4].map((idx, i) => (
              <div key={FEATURES[idx].number} className={`jt-reveal jt-reveal-d${i + 1} rounded-2xl border border-white/5 bg-gradient-to-br ${FEATURES[idx].gradient} p-7`}>
                <span className={`inline-flex h-10 w-10 items-center justify-center rounded-xl text-xl ${FEATURES[idx].iconBg}`}>
                  {FEATURES[idx].icon}
                </span>
                <p className="mt-4 text-xs font-bold text-gray-500">{FEATURES[idx].number}</p>
                <h3 className="mt-1 text-base font-bold text-white">{FEATURES[idx].title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-400">{FEATURES[idx].description}</p>
              </div>
            ))}

            {/* Row 3: full-width automation */}
            <div className={`jt-reveal sm:col-span-3 rounded-2xl border border-brand-800/40 bg-gradient-to-br ${FEATURES[5].gradient} p-8 ring-1 ring-brand-700/20`}>
              <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
                <div className="flex-1">
                  <span className={`inline-flex h-10 w-10 items-center justify-center rounded-xl text-xl ${FEATURES[5].iconBg}`}>
                    {FEATURES[5].icon}
                  </span>
                  <p className="mt-4 text-xs font-bold text-gray-500">{FEATURES[5].number}</p>
                  <h3 className="mt-1 text-xl font-bold text-white">{FEATURES[5].title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-gray-400">{FEATURES[5].description}</p>
                </div>
                {/* Pipeline steps visual */}
                <div className="flex items-center gap-1.5">
                  {["Scrape", "Score", "Analyse", "Cover Letter", "Track"].map((label, i, arr) => (
                    <div key={label} className="flex items-center gap-1.5">
                      <div className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-[11px] font-semibold text-gray-300 whitespace-nowrap">
                        {label}
                      </div>
                      {i < arr.length - 1 && (
                        <svg className="h-3 w-3 flex-shrink-0 text-brand-600" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                        </svg>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="bg-white py-24 sm:py-32">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="jt-reveal mx-auto max-w-2xl text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-brand-600">Testimonials</p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">Real people. Real results.</h2>
          </div>

          <div className="mt-14 grid gap-6 sm:grid-cols-3">
            {TESTIMONIALS.map((t, i) => (
              <div
                key={t.name}
                className={`jt-reveal jt-reveal-d${i + 1} group relative rounded-2xl border border-gray-100 bg-white p-7 shadow-sm transition-all duration-300 hover:border-brand-200 hover:shadow-lg hover:shadow-brand-50`}
              >
                {/* Quote mark */}
                <div className="mb-4 text-5xl font-serif leading-none text-brand-100 select-none">&ldquo;</div>
                <div className="mb-4 flex gap-0.5">
                  {[...Array(5)].map((_, idx) => (
                    <svg key={idx} className="h-4 w-4 text-brand-400" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-sm leading-relaxed text-gray-600">{t.quote}</p>
                <div className="mt-6 flex items-center gap-3">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-white ${t.color}`}>
                    {t.initials}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{t.name}</p>
                    <p className="text-xs text-gray-400">{t.role} · {t.location}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="bg-gray-50 py-24 sm:py-32">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="jt-reveal mx-auto max-w-2xl text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-brand-600">Pricing</p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">Simple, honest pricing</h2>
            <p className="mt-4 text-lg text-gray-500">Start free. Upgrade when you&apos;re ready.</p>
            <p className="mt-1.5 text-sm text-gray-400">UPI payments accepted · Razorpay coming soon.</p>
          </div>

          <div className="mt-14 grid gap-6 md:grid-cols-2">
            {/* Free */}
            <div className="jt-reveal jt-reveal-d1 flex flex-col rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
              <div className="mb-6">
                <h3 className="text-xl font-bold text-gray-900">Free</h3>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-5xl font-extrabold text-gray-900">₹0</span>
                  <span className="text-sm text-gray-500">/month</span>
                </div>
                <p className="mt-2 text-sm text-gray-500">No credit card required.</p>
              </div>
              <ul className="flex-1 space-y-3">
                {FREE_FEATURES.map((f) => (
                  <li key={f} className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-500">
                      <CheckIcon />
                    </span>
                    <span className="text-sm text-gray-700">{f}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-8">
                <Link href="/signup" className="block w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-center text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-100">
                  Get started free
                </Link>
              </div>
            </div>

            {/* Pro */}
            <div className="jt-reveal jt-reveal-d2 relative flex flex-col rounded-2xl bg-gray-950 p-8 shadow-2xl ring-1 ring-white/10">
              {/* Glow */}
              <div className="pointer-events-none absolute inset-0 rounded-2xl" style={{ background: "radial-gradient(ellipse at top, rgba(31,158,151,0.12) 0%, transparent 60%)" }} />
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                <span className="rounded-full bg-brand-500 px-4 py-1 text-xs font-bold text-white shadow-lg shadow-brand-900/50">Most Popular</span>
              </div>
              <div className="mb-6">
                <h3 className="text-xl font-bold text-white">Pro</h3>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-5xl font-extrabold text-white">₹499</span>
                  <span className="text-sm text-gray-400">/month</span>
                </div>
                <p className="mt-2 text-sm text-gray-400">Everything you need to land your next role.</p>
              </div>
              <ul className="flex-1 space-y-3">
                {PRO_FEATURES.map((f) => (
                  <li key={f} className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-brand-900/60 text-brand-400">
                      <CheckIcon />
                    </span>
                    <span className="text-sm text-gray-300">{f}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-8">
                <Link href="/signup" className="block w-full rounded-xl bg-brand-500 px-4 py-3.5 text-center text-sm font-bold text-white shadow-lg shadow-brand-900/50 transition-colors hover:bg-brand-400">
                  Start free → upgrade anytime
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="relative overflow-hidden bg-gray-950 py-24 sm:py-32 jt-grid-bg">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-1/2 h-[500px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-900/20 blur-3xl" />
        </div>
        <div className="jt-reveal relative mx-auto max-w-3xl px-4 text-center sm:px-6">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-brand-800/50 bg-brand-950/80 px-4 py-1.5 text-xs font-semibold text-brand-300">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-400 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-brand-400" />
            </span>
            Early access · &lt;100 spots
          </div>

          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-white sm:text-4xl md:text-5xl">
            Your next job is already out there.
            <br />
            <span className="jt-shimmer-text">Let AI find it for you.</span>
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-lg text-gray-400">
            Be one of the first 100 users to get full access — free forever, with no strings attached.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/signup" className="w-full max-w-xs rounded-xl bg-brand-500 px-8 py-4 text-base font-bold text-white shadow-2xl shadow-brand-900/60 transition-all hover:bg-brand-400 hover:shadow-brand-800/70 sm:w-auto">
              Claim your spot →
            </Link>
            <a href="#demo" className="w-full max-w-xs rounded-xl border border-white/10 bg-white/5 px-8 py-4 text-base font-semibold text-gray-300 transition-all hover:bg-white/10 sm:w-auto">
              See it in action
            </a>
          </div>
          <p className="mt-4 text-sm text-gray-600">No credit card. Cancel anytime.</p>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/5 bg-gray-950">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-brand-500 shadow shadow-brand-900/50">
                  <svg className="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
                  </svg>
                </div>
                <span className="text-sm font-bold text-white">Job Tailor</span>
              </div>
              <p className="mt-1.5 text-xs text-gray-600">Find jobs that fit. Apply with confidence.</p>
            </div>

            <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2 sm:justify-end">
              {[
                { href: "#features",     label: "Features" },
                { href: "#how-it-works", label: "How it works" },
                { href: "#pricing",      label: "Pricing" },
              ].map((link) => (
                <a key={link.href} href={link.href} className="text-sm text-gray-500 transition-colors hover:text-gray-300">{link.label}</a>
              ))}
              <Link href="/login"  className="text-sm text-gray-500 transition-colors hover:text-gray-300">Sign in</Link>
              <Link href="/signup" className="text-sm text-gray-500 transition-colors hover:text-gray-300">Sign up</Link>
            </nav>
          </div>

          <div className="mt-8 flex flex-col items-center gap-1 border-t border-white/5 pt-6 text-center sm:flex-row sm:justify-between sm:text-left">
            <p className="text-xs text-gray-700">&copy; 2026 Job Tailor. All rights reserved.</p>
            <p className="text-xs text-gray-700">Made with ❤️ in India</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ─── 3D Product Demo ──────────────────────────────────────────────────────────

const DEMO_STEPS = [
  { label: "Scraping jobs" },
  { label: "AI scoring" },
  { label: "Tailoring resume" },
  { label: "Cover letter" },
  { label: "Kanban tracking" },
];

const COVER_TEXT =
`Dear Hiring Manager,

I'm applying for the Senior PM role at Flipkart. With 5+ years scaling B2C products at Swiggy — including 0→1 launches for Instamart — I bring cross-functional leadership and a data-driven approach.

My background aligns directly with your requirements.

Looking forward to connecting.

— Priya S.`;

function ProductDemoSection() {
  const [step, setStep]               = useState(0);
  const [cycleKey, setCycleKey]       = useState(0);
  const [kanbanMoved, setKanbanMoved] = useState(false);
  const [resumeRevised, setResumeRevised] = useState(false);
  const coverText = useTypewriter(COVER_TEXT, 11, step === 3);

  useEffect(() => {
    const id = setInterval(() => setStep((s) => (s + 1) % 5), 4000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    setCycleKey((k) => k + 1);
    setKanbanMoved(false);
    setResumeRevised(false);
    if (step === 4) {
      const id = setTimeout(() => setKanbanMoved(true), 1300);
      return () => clearTimeout(id);
    }
    if (step === 2) {
      const id = setTimeout(() => setResumeRevised(true), 1000);
      return () => clearTimeout(id);
    }
  }, [step]);

  return (
    <section id="demo" className="relative overflow-hidden bg-gray-950 py-24 sm:py-32 jt-grid-bg">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/2 h-[500px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-900/20 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-5xl px-4 sm:px-6">
        <div className="jt-reveal mb-10 text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-400">Live demo</p>
          <h2 className="mt-3 text-3xl font-extrabold text-white sm:text-4xl md:text-5xl">
            60 seconds.{" "}
            <span className="text-brand-400">Your entire job search, automated.</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-gray-400">
            Watch the pipeline run end-to-end — from scraping 8+ boards to writing your cover letter to tracking the application.
          </p>
        </div>

        <div className="mb-10 flex flex-wrap justify-center gap-2">
          {DEMO_STEPS.map((s, i) => (
            <button
              key={i}
              onClick={() => setStep(i)}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
                step === i
                  ? "bg-brand-500 text-white shadow-lg shadow-brand-900/50"
                  : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-gray-200"
              }`}
            >
              {i + 1}. {s.label}
            </button>
          ))}
        </div>

        <div className="mx-auto max-w-2xl" style={{ perspective: "1400px" }}>
          <div
            className="overflow-hidden rounded-2xl ring-1 ring-white/10 transition-transform duration-700 ease-out"
            style={{
              transform: "rotateX(7deg) rotateY(-3deg)",
              boxShadow: "0 60px 120px -20px rgba(31,158,151,0.3), 0 0 0 1px rgba(255,255,255,0.04)",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = "rotateX(1deg) rotateY(-0.5deg)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = "rotateX(7deg) rotateY(-3deg)"; }}
          >
            <div className="flex items-center gap-3 border-b border-white/5 bg-[#1c1c1e] px-4 py-2.5">
              <div className="flex gap-1.5">
                <div className="h-3 w-3 rounded-full bg-[#ff5f57]" />
                <div className="h-3 w-3 rounded-full bg-[#febc2e]" />
                <div className="h-3 w-3 rounded-full bg-[#28c840]" />
              </div>
              <div className="mx-2 flex h-6 flex-1 items-center gap-2 rounded-md bg-white/5 px-3">
                <svg className="h-3 w-3 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                </svg>
                <span className="font-mono text-xs text-gray-400">jobtailor.in/pipeline</span>
              </div>
            </div>

            <div className="relative h-80 overflow-hidden bg-[#0f1117]">
              {step === 0 && <ScrapingScreen     key={`s0-${cycleKey}`} />}
              {step === 1 && <ScoringScreen      key={`s1-${cycleKey}`} />}
              {step === 2 && <ResumeScreen       key={`s2-${cycleKey}`} revised={resumeRevised} />}
              {step === 3 && <CoverLetterScreen  key={`s3-${cycleKey}`} text={coverText} />}
              {step === 4 && <KanbanScreen       key={`s4-${cycleKey}`} moved={kanbanMoved} />}
            </div>

            <div className="flex items-center justify-between border-t border-white/5 bg-[#1c1c1e] px-4 py-2">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-500" />
                </span>
                <span className="font-mono text-xs text-gray-500">Pipeline running</span>
              </div>
              <div className="flex gap-1">
                {[0, 1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className={`h-1 rounded-full transition-all duration-300 ${
                      i === step ? "w-5 bg-brand-400" : i < step ? "w-1 bg-brand-700" : "w-1 bg-white/15"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="mx-6 h-6 rounded-b-2xl opacity-30 blur-xl"
            style={{ background: "radial-gradient(ellipse, rgba(31,158,151,0.6) 0%, transparent 70%)" }} />
        </div>
      </div>
    </section>
  );
}

// ─── Step screens ─────────────────────────────────────────────────────────────

function ScrapingScreen() {
  return (
    <div className="absolute inset-0 flex flex-col p-5" style={{ animation: "jt-fade-in 0.35s ease forwards" }}>
      <div className="mb-3 flex items-center gap-2">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-500" />
        </span>
        <span className="font-mono text-xs text-brand-400">Scanning job boards…</span>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {JOB_BOARDS.slice(0, 6).map((b, i) => (
          <span
            key={b}
            className="inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-medium text-gray-300"
            style={{ animation: `jt-fade-up 0.3s ease both ${i * 70}ms`, opacity: 0 }}
          >
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand-400" />
            {b}
          </span>
        ))}
      </div>

      <div className="flex-1 space-y-2">
        {[
          { title: "Senior Product Manager", company: "Flipkart",  loc: "Bangalore · Remote",  delay: "180ms" },
          { title: "Product Lead — Growth",  company: "Swiggy",    loc: "Hyderabad · Hybrid",  delay: "480ms" },
          { title: "PM — Platform",          company: "Meesho",    loc: "Bangalore · Onsite",  delay: "780ms" },
        ].map((j) => (
          <div
            key={j.title}
            className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2"
            style={{ animation: `jt-slide-in 0.35s ease both ${j.delay}`, opacity: 0 }}
          >
            <div>
              <p className="text-sm font-semibold leading-tight text-white">{j.title}</p>
              <p className="text-xs text-gray-500">{j.company} · {j.loc}</p>
            </div>
            <span className="rounded-full bg-brand-950/60 px-2 py-0.5 text-[10px] font-bold text-brand-400">NEW</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ScoringScreen() {
  const JOBS = [
    { title: "Senior Product Manager", company: "Flipkart", score: 92, label: "Strong Match",  scoreColor: "text-emerald-400", barColor: "bg-emerald-500", labelColor: "text-emerald-500" },
    { title: "Product Lead — Growth",  company: "Swiggy",   score: 78, label: "Good Match",    scoreColor: "text-brand-400",   barColor: "bg-brand-500",   labelColor: "text-brand-500"   },
    { title: "PM — Platform",          company: "Meesho",   score: 61, label: "Fair Match",    scoreColor: "text-amber-400",   barColor: "bg-amber-500",   labelColor: "text-amber-500"   },
  ];

  return (
    <div className="absolute inset-0 flex flex-col p-5" style={{ animation: "jt-fade-in 0.35s ease forwards" }}>
      <p className="mb-4 font-mono text-xs text-brand-400">AI scoring your matches…</p>
      <div className="flex-1 space-y-3">
        {JOBS.map((j, i) => (
          <div
            key={j.title}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-2.5"
            style={{ animation: `jt-fade-up 0.3s ease both ${i * 130}ms`, opacity: 0 }}
          >
            <div className="mb-1.5 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold leading-tight text-white">{j.title}</p>
                <p className="text-xs text-gray-500">{j.company}</p>
              </div>
              <div className="text-right">
                <span className={`text-base font-extrabold ${j.scoreColor}`}>{j.score}%</span>
                <p className={`text-[10px] font-semibold ${j.labelColor}`}>{j.label}</p>
              </div>
            </div>
            <div className="h-1 overflow-hidden rounded-full bg-white/10">
              <div className={`h-full rounded-full ${j.barColor}`}
                style={{ width: `${j.score}%`, transformOrigin: "left", animation: `jt-score-bar 0.9s cubic-bezier(0.22,1,0.36,1) both ${i * 130 + 250}ms` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ResumeScreen({ revised }: { revised: boolean }) {
  return (
    <div className="absolute inset-0 flex flex-col p-5" style={{ animation: "jt-fade-in 0.35s ease forwards" }}>
      <div className="mb-3 flex items-center justify-between">
        <span className="font-mono text-xs text-brand-400">Tailoring resume for Flipkart…</span>
        {revised && (
          <span className="rounded-full bg-emerald-950/60 px-2 py-0.5 text-[10px] font-bold text-emerald-400"
            style={{ animation: "jt-fade-up 0.3s ease forwards" }}>
            ✓ 3 keywords added
          </span>
        )}
      </div>
      <div className="flex-1 overflow-hidden rounded-lg border border-white/10 bg-white/5 p-4 font-mono">
        <div className="mb-3 border-b border-white/5 pb-2">
          <p className="text-sm font-bold text-white">Priya Sharma</p>
          <p className="text-xs text-gray-400">Product Manager · priya@email.com · Bangalore</p>
        </div>
        <div className="space-y-2 text-[11px]">
          <p className="text-[9px] font-bold uppercase tracking-widest text-gray-600">Experience</p>
          <div>
            <p className="font-semibold text-gray-300">Senior PM · Swiggy · 2021–Present</p>
            <div className="mt-1 space-y-1 pl-2">
              <p className={`transition-colors duration-500 ${revised ? "text-emerald-400" : "text-amber-300/80"}`}>
                · {revised ? "Led 0→1 product development for Instamart (5+ yrs)" : "Led product development (2 yrs)"}
              </p>
              <p className={`transition-colors duration-500 ${revised ? "text-emerald-400" : "text-gray-400"}`}>
                · {revised ? "Drove 3× DAU growth via A/B testing & stakeholder alignment" : "Improved user engagement metrics"}
              </p>
            </div>
          </div>
          <div className="pt-1">
            <p className="text-[9px] font-bold uppercase tracking-widest text-gray-600">Skills</p>
            <div className="mt-1 flex flex-wrap gap-1">
              {(["Agile", "SQL", "Roadmapping", ...(revised ? ["Stakeholder Mgmt", "Product Analytics"] : [])] as string[]).map((s) => (
                <span key={s} className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
                  s === "Stakeholder Mgmt" || s === "Product Analytics"
                    ? "border border-emerald-800/50 bg-emerald-950/60 text-emerald-400"
                    : "bg-white/5 text-gray-400"
                }`}>{s}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CoverLetterScreen({ text }: { text: string }) {
  return (
    <div className="absolute inset-0 flex flex-col p-5" style={{ animation: "jt-fade-in 0.35s ease forwards" }}>
      <div className="mb-3 flex items-center justify-between">
        <span className="font-mono text-xs text-brand-400">Generating cover letter…</span>
        <span className="text-xs text-gray-600">Flipkart · Senior PM · Professional tone</span>
      </div>
      <div className="flex-1 overflow-hidden rounded-lg border border-white/10 bg-white/5 p-4">
        <p className="whitespace-pre-wrap font-mono text-[11px] leading-relaxed text-gray-300">
          {text}
          <span className="ml-0.5 inline-block h-3.5 w-0.5 translate-y-0.5 bg-brand-400"
            style={{ animation: "jt-cursor 0.9s step-end infinite" }} />
        </p>
      </div>
    </div>
  );
}

function KanbanScreen({ moved }: { moved: boolean }) {
  return (
    <div className="absolute inset-0 flex flex-col p-5" style={{ animation: "jt-fade-in 0.35s ease forwards" }}>
      <div className="mb-3 flex items-center gap-2">
        <span className="font-mono text-xs text-brand-400">Application board</span>
      </div>
      <div className="flex flex-1 gap-3">
        <div className="flex flex-1 flex-col gap-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600">Saved</p>
          <div className="rounded-lg border border-white/10 bg-white/5 p-2.5">
            <p className="text-xs font-semibold text-gray-300">PM · Meesho</p>
            <p className="mt-0.5 text-[10px] text-gray-500">61% match</p>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/5 p-2.5">
            <p className="text-xs font-semibold text-gray-300">Product Lead · Zomato</p>
            <p className="mt-0.5 text-[10px] text-gray-500">74% match</p>
          </div>
        </div>
        <div className="flex flex-1 flex-col gap-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600">Applied</p>
          {!moved ? (
            <div className="rounded-lg border border-brand-800/50 bg-brand-950/60 p-2.5" style={{ animation: "jt-fade-up 0.3s ease forwards" }}>
              <p className="text-xs font-semibold text-brand-200">Sr PM · Flipkart</p>
              <p className="mt-0.5 text-[10px] text-brand-400">92% match</p>
            </div>
          ) : (
            <div className="h-[52px] rounded-lg border border-dashed border-white/10" />
          )}
        </div>
        <div className="flex flex-1 flex-col gap-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600">Interview</p>
          {moved && (
            <div className="rounded-lg border border-emerald-800/50 bg-emerald-950/60 p-2.5"
              style={{ animation: "jt-fade-up 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards" }}>
              <p className="text-xs font-semibold text-emerald-200">Sr PM · Flipkart</p>
              <p className="mt-0.5 text-[10px] text-emerald-400">Interview booked ✓</p>
            </div>
          )}
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/10">
          <div className={`h-full rounded-full bg-gradient-to-r from-brand-500 to-emerald-500 transition-all duration-1000 ease-out ${moved ? "w-3/4" : "w-1/4"}`} />
        </div>
        <span className="font-mono text-[10px] text-gray-500">{moved ? "Stage 3/4" : "Stage 1/4"}</span>
      </div>
    </div>
  );
}
