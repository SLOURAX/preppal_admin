"use client";

import { useState } from "react";
import { AdminShell } from "@/components/layout";

// ─── Types ────────────────────────────────────────────────────────────────────

type Period = "7" | "30" | "90" | "180" | "0";

// ─── Mock data ────────────────────────────────────────────────────────────────

const PLATFORM_STATS = {
  totalUsers: 14820,
  activeToday: 1342,
  newThisMonth: 874,
  churnRate: 3.2,
  totalQuizzes: 248930,
  quizzesToday: 4812,
  avgSessionDuration: 924,
  aiHintsUsed: 38210,
  totalXpIssued: 9284500,
  coinsCirculating: 2140300,
  pendingWithdrawals: 18,
  totalWithdrawn: 4820000,
  totalDeposited: 6100000,
  referralsThisMonth: 412,
  rewardsRedeemed: 3810,
};

const DAU_SERIES = [
  980, 1020, 1100, 1280, 1350, 1190, 1050, 1310, 1420, 1380, 1290, 1450, 1390,
  1342,
];
const REG_SERIES = [28, 34, 41, 55, 62, 47, 39, 58, 71, 66, 54, 80, 73, 61];
const QUIZ_SERIES = [
  3100, 3400, 3800, 4200, 4600, 4000, 3600, 4400, 5000, 4800, 4500, 5200, 4900,
  4812,
];

const SUBJECT_ACCURACY = [
  { subject: "Mathematics", accuracy: 62, attempts: 48200 },
  { subject: "English", accuracy: 74, attempts: 42100 },
  { subject: "Biology", accuracy: 68, attempts: 38800 },
  { subject: "Chemistry", accuracy: 55, attempts: 31400 },
  { subject: "Physics", accuracy: 51, attempts: 28900 },
  { subject: "Economics", accuracy: 71, attempts: 22300 },
  { subject: "Government", accuracy: 78, attempts: 18600 },
  { subject: "Commerce", accuracy: 76, attempts: 16800 },
];

const EXAM_POPULARITY = [
  { exam: "JAMB", quizzes: 112400, users: 8420, avgScore: 64 },
  { exam: "WAEC", quizzes: 89600, users: 6810, avgScore: 68 },
  { exam: "NECO", quizzes: 46930, users: 3940, avgScore: 66 },
];

const PLAN_DIST = [
  { plan: "Free", users: 10200, pct: 68.8 },
  { plan: "Level 1", users: 2840, pct: 19.2 },
  { plan: "Level 2", users: 1180, pct: 7.9 },
  { plan: "Pro", users: 600, pct: 4.1 },
];

const TOP_USERS = [
  { name: "Amara Okafor", xp: 48200, quizzes: 312, plan: "Pro" },
  { name: "David Adebayo", xp: 43800, quizzes: 289, plan: "Pro" },
  { name: "Maya Johnson", xp: 41100, quizzes: 271, plan: "Level 2" },
  { name: "Zainab Bello", xp: 38500, quizzes: 254, plan: "Level 2" },
  { name: "Chinedu Okoro", xp: 34200, quizzes: 228, plan: "Level 1" },
  { name: "Aisha Ibrahim", xp: 32800, quizzes: 218, plan: "Level 2" },
  { name: "Tunde Bakare", xp: 31100, quizzes: 207, plan: "Level 1" },
  { name: "Grace Mensah", xp: 29750, quizzes: 198, plan: "Level 1" },
];

const HOURLY_ACTIVITY = [
  12, 8, 4, 2, 1, 3, 18, 62, 148, 220, 310, 280, 240, 260, 290, 330, 380, 400,
  380, 310, 240, 180, 110, 62,
];

const FINANCE_SERIES = [
  { month: "Apr", deposits: 820000, withdrawals: 610000 },
  { month: "May", deposits: 940000, withdrawals: 680000 },
  { month: "Jun", deposits: 1080000, withdrawals: 790000 },
  { month: "Jul", deposits: 1240000, withdrawals: 910000 },
  { month: "Aug", deposits: 1020000, withdrawals: 820000 },
  { month: "Sep", deposits: 1000000, withdrawals: 770000 },
];

const REFERRAL_FUNNEL = [
  { label: "Links shared", value: 2840 },
  { label: "Clicks", value: 1920 },
  { label: "Signups", value: 412 },
  { label: "Activated", value: 298 },
];

const AI_USAGE = [
  { subject: "Mathematics", hints: 12400 },
  { subject: "Chemistry", hints: 8800 },
  { subject: "Physics", hints: 7200 },
  { subject: "Biology", hints: 5100 },
  { subject: "English", hints: 3800 },
  { subject: "Others", hints: 910 },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number) => n.toLocaleString("en-NG");
const fmtPct = (n: number) => `${n}%`;
const fmtNGN = (n: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(n);
const fmtDuration = (s: number) => {
  const m = Math.round(s / 60);
  return m < 60 ? `${m}m` : `${Math.floor(m / 60)}h ${m % 60}m`;
};

const PERIOD_OPTIONS: { value: Period; label: string }[] = [
  { value: "7", label: "Last 7 days" },
  { value: "30", label: "Last 30 days" },
  { value: "90", label: "Last 3 months" },
  { value: "180", label: "Last 6 months" },
  { value: "0", label: "All time" },
];

// ─── Reusable UI primitives ───────────────────────────────────────────────────

function SectionTitle({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="mb-5">
      <h2 className="text-foreground text-lg font-bold">{title}</h2>
      <p className="text-muted-foreground mt-0.5 text-xs">{sub}</p>
    </div>
  );
}

function KpiCard({
  label,
  value,
  sub,
  tone = "bg-primary/10 text-primary",
  icon,
}: {
  readonly label: string;
  readonly value: string;
  readonly sub: string;
  readonly tone?: string;
  readonly icon: string;
}) {
  return (
    <article className="surface-card relative overflow-hidden rounded-2xl p-4">
      <span
        className={`grid size-9 place-items-center rounded-xl text-base ${tone}`}
      >
        {icon}
      </span>
      <p className="text-foreground mt-3 text-xl font-bold">{value}</p>
      <p className="text-foreground text-[.75rem] font-medium">{label}</p>
      <p className="text-muted-foreground mt-0.5 text-[11px]">{sub}</p>
    </article>
  );
}

function BarChart({
  series,
  color = "bg-primary",
  height = 72,
}: {
  readonly series: readonly number[];
  readonly color?: string;
  readonly height?: number;
}) {
  const max = Math.max(...series, 1);
  return (
    <div className="flex items-end gap-1" style={{ height }}>
      {series.map((v, i) => (
        <div key={i} className="flex flex-1 flex-col items-end">
          <div
            className={`w-full rounded-t-sm ${color} opacity-80 transition-all`}
            style={{ height: `${Math.max(4, (v / max) * height)}px` }}
          />
        </div>
      ))}
    </div>
  );
}

function ProgressBar({
  value,
  max = 100,
  color = "bg-primary",
}: {
  readonly value: number;
  readonly max?: number;
  readonly color?: string;
}) {
  return (
    <div className="bg-surface-subtle h-2 overflow-hidden rounded-full">
      <div
        className={`h-full rounded-full transition-all ${color}`}
        style={{ width: `${Math.min(100, (value / max) * 100)}%` }}
      />
    </div>
  );
}

function PlanBadge({ plan }: { readonly plan: string }) {
  const styles: Record<string, string> = {
    Free: "bg-surface-subtle text-muted-foreground",
    "Level 1": "bg-blue-500/10 text-blue-600",
    "Level 2": "bg-violet-500/10 text-violet-600",
    Pro: "bg-amber-500/10 text-amber-600",
  };
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
        styles[plan] ?? "bg-surface-subtle text-muted-foreground"
      }`}
    >
      {plan}
    </span>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<Period>("30");

  const days = period === "0" ? 14 : Math.min(Number(period), 14);
  const dauSlice = DAU_SERIES.slice(-days);
  const regSlice = REG_SERIES.slice(-days);
  const quizSlice = QUIZ_SERIES.slice(-days);

  const maxHourly = Math.max(...HOURLY_ACTIVITY);
  const peakHour = HOURLY_ACTIVITY.indexOf(maxHourly);

  const netFlow = PLATFORM_STATS.totalDeposited - PLATFORM_STATS.totalWithdrawn;

  const maxFinance = Math.max(...FINANCE_SERIES.map((f) => f.deposits));

  return (
    <AdminShell>
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="text-primary text-[10px] font-bold tracking-widest uppercase">
            Platform intelligence
          </span>
          <h1 className="text-foreground mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
            Analytics
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Full visibility into users, learning, engagement, and finances.
          </p>
        </div>
        {/* Period filter */}
        <div className="bg-surface-subtle/80 flex w-fit items-center gap-1 rounded-full p-1">
          {PERIOD_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setPeriod(opt.value)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${
                period === opt.value
                  ? "bg-surface text-primary shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── 1. Platform KPIs ─────────────────────────────────────────────── */}
      <section className="mb-8">
        <SectionTitle
          title="Platform KPIs"
          sub="Top-level health indicators across the entire platform"
        />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
          <KpiCard
            label="Total users"
            value={fmt(PLATFORM_STATS.totalUsers)}
            sub="All registered accounts"
            icon="♙"
            tone="bg-primary/10 text-primary"
          />
          <KpiCard
            label="Active today"
            value={fmt(PLATFORM_STATS.activeToday)}
            sub="Unique sessions today"
            icon="⚡"
            tone="bg-emerald-500/10 text-emerald-600"
          />
          <KpiCard
            label="New this month"
            value={fmt(PLATFORM_STATS.newThisMonth)}
            sub="Registrations in period"
            icon="✦"
            tone="bg-blue-500/10 text-blue-600"
          />
          <KpiCard
            label="Churn rate"
            value={fmtPct(PLATFORM_STATS.churnRate)}
            sub="30-day inactivity rate"
            icon="↘"
            tone="bg-rose-500/10 text-rose-600"
          />
          <KpiCard
            label="Quizzes today"
            value={fmt(PLATFORM_STATS.quizzesToday)}
            sub="Completed sessions"
            icon="▤"
            tone="bg-violet-500/10 text-violet-600"
          />
          <KpiCard
            label="Total quizzes"
            value={fmt(PLATFORM_STATS.totalQuizzes)}
            sub="All time completions"
            icon="◈"
            tone="bg-primary/10 text-primary"
          />
          <KpiCard
            label="Avg session"
            value={fmtDuration(PLATFORM_STATS.avgSessionDuration)}
            sub="Per quiz session"
            icon="⏱"
            tone="bg-amber-500/10 text-amber-600"
          />
          <KpiCard
            label="AI hints served"
            value={fmt(PLATFORM_STATS.aiHintsUsed)}
            sub="Across all sessions"
            icon="✧"
            tone="bg-cyan-500/10 text-cyan-600"
          />
          <KpiCard
            label="XP issued"
            value={fmt(PLATFORM_STATS.totalXpIssued)}
            sub="Total lifetime XP"
            icon="⬆"
            tone="bg-indigo-500/10 text-indigo-600"
          />
          <KpiCard
            label="Coins in circulation"
            value={fmt(PLATFORM_STATS.coinsCirculating)}
            sub="Across all wallets"
            icon="ℙ"
            tone="bg-amber-500/10 text-amber-600"
          />
          <KpiCard
            label="Pending withdrawals"
            value={fmt(PLATFORM_STATS.pendingWithdrawals)}
            sub="Awaiting approval"
            icon="↗"
            tone="bg-rose-500/10 text-rose-600"
          />
          <KpiCard
            label="Referrals (month)"
            value={fmt(PLATFORM_STATS.referralsThisMonth)}
            sub="Successful this period"
            icon="⇒"
            tone="bg-emerald-500/10 text-emerald-600"
          />
        </div>
      </section>

      {/* ── 2. Growth trends ─────────────────────────────────────────────── */}
      <section className="mb-8">
        <SectionTitle
          title="Growth trends"
          sub="Daily active users, new registrations, and quiz completions over the selected period"
        />
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="surface-card rounded-2xl p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-foreground text-sm font-semibold">
                  Daily active users
                </p>
                <p className="text-muted-foreground text-xs">
                  Unique logins per day
                </p>
              </div>
              <span className="text-primary text-xl font-black">
                {fmt(dauSlice[dauSlice.length - 1])}
              </span>
            </div>
            <BarChart series={dauSlice} color="bg-primary" height={72} />
          </div>
          <div className="surface-card rounded-2xl p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-foreground text-sm font-semibold">
                  New registrations
                </p>
                <p className="text-muted-foreground text-xs">
                  Sign-ups per day
                </p>
              </div>
              <span className="text-xl font-black text-emerald-600">
                {fmt(regSlice[regSlice.length - 1])}
              </span>
            </div>
            <BarChart series={regSlice} color="bg-emerald-500" height={72} />
          </div>
          <div className="surface-card rounded-2xl p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-foreground text-sm font-semibold">
                  Quiz completions
                </p>
                <p className="text-muted-foreground text-xs">
                  Sessions completed per day
                </p>
              </div>
              <span className="text-xl font-black text-violet-600">
                {fmt(quizSlice[quizSlice.length - 1])}
              </span>
            </div>
            <BarChart series={quizSlice} color="bg-violet-500" height={72} />
          </div>
        </div>
      </section>

      {/* ── 3. User engagement ───────────────────────────────────────────── */}
      <section className="mb-8">
        <SectionTitle
          title="User engagement"
          sub="Retention breakdown, subscription plan distribution, and top performers"
        />
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Plan distribution */}
          <div className="surface-card rounded-2xl p-5">
            <p className="text-foreground mb-5 font-semibold">
              Plan distribution
            </p>
            <div className="space-y-4">
              {PLAN_DIST.map(({ plan, users, pct: p }) => (
                <div key={plan}>
                  <div className="mb-1.5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <PlanBadge plan={plan} />
                    </div>
                    <span className="text-muted-foreground text-xs font-semibold">
                      {fmt(users)} users · {p}%
                    </span>
                  </div>
                  <ProgressBar
                    value={p}
                    color={
                      plan === "Pro"
                        ? "bg-amber-500"
                        : plan === "Level 2"
                          ? "bg-violet-500"
                          : plan === "Level 1"
                            ? "bg-blue-500"
                            : "bg-border"
                    }
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Top users */}
          <div className="surface-card rounded-2xl p-5">
            <p className="text-foreground mb-4 font-semibold">
              Top users by XP
            </p>
            <div className="divide-border divide-y">
              {TOP_USERS.map((u, i) => (
                <div key={u.name} className="flex items-center gap-3 py-2.5">
                  <span className="text-muted-foreground w-4 shrink-0 text-center text-xs font-bold">
                    {i + 1}
                  </span>
                  <div className="bg-primary/10 text-primary grid size-8 shrink-0 place-items-center rounded-full text-xs font-bold">
                    {u.name.slice(0, 1)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-foreground truncate text-xs font-semibold">
                      {u.name}
                    </p>
                    <p className="text-muted-foreground text-[10px]">
                      {fmt(u.quizzes)} quizzes
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <PlanBadge plan={u.plan} />
                    <span className="text-primary text-xs font-bold">
                      {fmt(u.xp)} XP
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── 4. Learning analytics ────────────────────────────────────────── */}
      <section className="mb-8">
        <SectionTitle
          title="Learning analytics"
          sub="Platform-wide subject accuracy, exam track performance, and question difficulty"
        />
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Subject accuracy */}
          <div className="surface-card rounded-2xl p-5">
            <p className="text-foreground mb-5 font-semibold">
              Subject accuracy (platform avg.)
            </p>
            <div className="space-y-4">
              {SUBJECT_ACCURACY.map(({ subject, accuracy, attempts }) => (
                <div key={subject}>
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="text-foreground text-xs font-medium">
                      {subject}
                    </span>
                    <span className="text-muted-foreground text-xs">
                      {fmtPct(accuracy)} · {fmt(attempts)} attempts
                    </span>
                  </div>
                  <ProgressBar
                    value={accuracy}
                    color={
                      accuracy >= 70
                        ? "bg-emerald-500"
                        : accuracy >= 55
                          ? "bg-amber-500"
                          : "bg-rose-500"
                    }
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Exam breakdown */}
          <div className="surface-card rounded-2xl p-5">
            <p className="text-foreground mb-5 font-semibold">
              Exam track breakdown
            </p>
            <div className="space-y-4">
              {EXAM_POPULARITY.map(({ exam, quizzes, users, avgScore }) => {
                const maxQ = Math.max(...EXAM_POPULARITY.map((e) => e.quizzes));
                return (
                  <div key={exam} className="bg-surface-subtle rounded-2xl p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-foreground font-semibold">
                        {exam}
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                          avgScore >= 70
                            ? "bg-emerald-500/10 text-emerald-600"
                            : avgScore >= 60
                              ? "bg-amber-500/10 text-amber-600"
                              : "bg-rose-500/10 text-rose-600"
                        }`}
                      >
                        avg {fmtPct(avgScore)}
                      </span>
                    </div>
                    <div className="mb-3 grid grid-cols-2 gap-3 text-center">
                      <div>
                        <p className="text-foreground text-base font-bold">
                          {fmt(quizzes)}
                        </p>
                        <p className="text-muted-foreground text-[10px]">
                          quiz sessions
                        </p>
                      </div>
                      <div>
                        <p className="text-foreground text-base font-bold">
                          {fmt(users)}
                        </p>
                        <p className="text-muted-foreground text-[10px]">
                          active users
                        </p>
                      </div>
                    </div>
                    <ProgressBar
                      value={quizzes}
                      max={maxQ}
                      color="bg-primary"
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ── 5. Hourly activity heatmap ───────────────────────────────────── */}
      <section className="mb-8">
        <SectionTitle
          title="Activity by hour of day"
          sub="When users are most active across the 24-hour cycle (platform time)"
        />
        <div className="surface-card rounded-2xl p-5">
          <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-foreground text-sm font-semibold">
              Quiz completions by hour
            </p>
            <span className="text-muted-foreground text-xs">
              Peak: {peakHour}:00 – {peakHour + 1}:00 &nbsp;·&nbsp;{" "}
              {fmt(maxHourly)} completions
            </span>
          </div>
          <div className="flex items-end gap-px" style={{ height: 88 }}>
            {HOURLY_ACTIVITY.map((v, i) => (
              <div
                key={i}
                className="group relative flex flex-1 flex-col items-center gap-1"
              >
                <div className="flex w-full flex-1 items-end">
                  <div
                    className="bg-primary/70 w-full rounded-t-sm transition-all"
                    style={{ height: `${Math.max(3, (v / maxHourly) * 80)}px` }}
                  />
                </div>
                {i % 6 === 0 && (
                  <span className="text-muted-foreground absolute -bottom-4 text-[8px]">
                    {i}h
                  </span>
                )}
              </div>
            ))}
          </div>
          <div className="text-muted-foreground mt-5 flex gap-3 text-[10px]">
            <span>Low ◀</span>
            <div className="flex flex-1 items-center gap-0.5">
              {[0.15, 0.3, 0.5, 0.7, 0.85, 1].map((v) => (
                <div
                  key={v}
                  className="bg-primary h-2 flex-1 rounded-sm"
                  style={{ opacity: v }}
                />
              ))}
            </div>
            <span>▶ High</span>
          </div>
        </div>
      </section>

      {/* ── 6. AI usage analytics ────────────────────────────────────────── */}
      <section className="mb-8">
        <SectionTitle
          title="AI & hints usage"
          sub="Breakdown of Preppal AI hint requests across subjects and quiz modes"
        />
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="surface-card rounded-2xl p-5">
            <p className="text-foreground mb-5 font-semibold">
              AI hints by subject
            </p>
            <div className="space-y-4">
              {AI_USAGE.map(({ subject, hints }) => {
                const maxH = Math.max(...AI_USAGE.map((a) => a.hints));
                return (
                  <div key={subject}>
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-foreground text-xs font-medium">
                        {subject}
                      </span>
                      <span className="text-muted-foreground text-xs">
                        {fmt(hints)} hints
                      </span>
                    </div>
                    <ProgressBar value={hints} max={maxH} color="bg-cyan-500" />
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="surface-card rounded-2xl p-5">
              <p className="text-foreground mb-1 font-semibold">
                Total AI hints served
              </p>
              <p className="text-foreground mt-2 text-3xl font-black">
                {fmt(PLATFORM_STATS.aiHintsUsed)}
              </p>
              <p className="text-muted-foreground mt-1 text-xs">
                Across all subjects and quiz modes
              </p>
            </div>
            <div className="surface-card rounded-2xl p-5">
              <p className="text-foreground mb-3 font-semibold">
                AI hint rate by segment
              </p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  {
                    label: "Timed sessions",
                    rate: "4.2%",
                    color: "text-amber-600",
                  },
                  {
                    label: "Playground sessions",
                    rate: "31.8%",
                    color: "text-cyan-600",
                  },
                  {
                    label: "JAMB users",
                    rate: "18.6%",
                    color: "text-blue-600",
                  },
                  {
                    label: "WAEC users",
                    rate: "14.2%",
                    color: "text-violet-600",
                  },
                ].map(({ label, rate, color }) => (
                  <div key={label} className="bg-surface-subtle rounded-xl p-3">
                    <p className={`text-base font-bold ${color}`}>{rate}</p>
                    <p className="text-muted-foreground text-[10px]">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 7. Finance analytics ─────────────────────────────────────────── */}
      <section className="mb-8">
        <SectionTitle
          title="Finance & wallet analytics"
          sub="Deposits, withdrawals, net coin flow, and 6-month revenue trend"
        />
        <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            label="Total deposited"
            value={fmtNGN(PLATFORM_STATS.totalDeposited)}
            sub="All time"
            icon="↙"
            tone="bg-emerald-500/10 text-emerald-600"
          />
          <KpiCard
            label="Total withdrawn"
            value={fmtNGN(PLATFORM_STATS.totalWithdrawn)}
            sub="All time"
            icon="↗"
            tone="bg-rose-500/10 text-rose-600"
          />
          <KpiCard
            label="Net flow"
            value={fmtNGN(netFlow)}
            sub="Deposits minus withdrawals"
            icon="⇌"
            tone="bg-primary/10 text-primary"
          />
          <KpiCard
            label="Coins circulating"
            value={fmt(PLATFORM_STATS.coinsCirculating)}
            sub="Across all wallets"
            icon="ℙ"
            tone="bg-amber-500/10 text-amber-600"
          />
        </div>
        <div className="surface-card rounded-2xl p-5">
          <p className="text-foreground mb-4 font-semibold">
            Monthly deposit vs. withdrawal (last 6 months)
          </p>
          <div className="flex items-end gap-4" style={{ height: 100 }}>
            {FINANCE_SERIES.map(({ month, deposits, withdrawals }) => (
              <div
                key={month}
                className="flex flex-1 flex-col items-center gap-1"
              >
                <div
                  className="flex w-full items-end gap-0.5"
                  style={{ height: 88 }}
                >
                  <div
                    className="flex-1 rounded-t-sm bg-emerald-500/80 transition-all"
                    style={{ height: `${(deposits / maxFinance) * 88}px` }}
                    title={`Deposits: ${fmtNGN(deposits)}`}
                  />
                  <div
                    className="flex-1 rounded-t-sm bg-rose-500/70 transition-all"
                    style={{ height: `${(withdrawals / maxFinance) * 88}px` }}
                    title={`Withdrawals: ${fmtNGN(withdrawals)}`}
                  />
                </div>
                <span className="text-muted-foreground text-[9px]">
                  {month}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center gap-5">
            <div className="flex items-center gap-1.5">
              <span className="inline-block size-2.5 rounded-sm bg-emerald-500/80" />
              <span className="text-muted-foreground text-[10px]">
                Deposits
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="inline-block size-2.5 rounded-sm bg-rose-500/70" />
              <span className="text-muted-foreground text-[10px]">
                Withdrawals
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── 8. Referral analytics ────────────────────────────────────────── */}
      <section className="mb-8">
        <SectionTitle
          title="Referral & rewards analytics"
          sub="Funnel performance, reward redemptions, and referral efficiency metrics"
        />
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="surface-card rounded-2xl p-5">
            <p className="text-foreground mb-5 font-semibold">
              Referral funnel (this month)
            </p>
            <div className="space-y-4">
              {REFERRAL_FUNNEL.map(({ label, value }, i) => {
                const top = REFERRAL_FUNNEL[0].value;
                return (
                  <div key={label}>
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-foreground text-xs font-medium">
                        {label}
                      </span>
                      <span className="text-muted-foreground text-xs font-semibold">
                        {fmt(value)}
                        {i > 0 && (
                          <span className="ml-1">
                            ({Math.round((value / top) * 100)}%)
                          </span>
                        )}
                      </span>
                    </div>
                    <ProgressBar
                      value={value}
                      max={top}
                      color={
                        i === 0
                          ? "bg-primary"
                          : i === 1
                            ? "bg-blue-500"
                            : i === 2
                              ? "bg-emerald-500"
                              : "bg-violet-500"
                      }
                    />
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="surface-card rounded-2xl p-5">
              <p className="text-foreground mb-1 font-semibold">
                Rewards redeemed
              </p>
              <p className="text-foreground mt-2 text-3xl font-black">
                {fmt(PLATFORM_STATS.rewardsRedeemed)}
              </p>
              <p className="text-muted-foreground mt-1 text-xs">
                Total items redeemed from the marketplace
              </p>
            </div>
            <div className="surface-card rounded-2xl p-5">
              <p className="text-foreground mb-3 font-semibold">
                Referral efficiency
              </p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  {
                    label: "Click-through rate",
                    value: "67.6%",
                    color: "text-blue-600",
                  },
                  {
                    label: "Signup rate",
                    value: "21.5%",
                    color: "text-emerald-600",
                  },
                  {
                    label: "Activation rate",
                    value: "72.3%",
                    color: "text-violet-600",
                  },
                  {
                    label: "Avg reward / ref.",
                    value: "420 coins",
                    color: "text-amber-600",
                  },
                ].map(({ label, value, color }) => (
                  <div key={label} className="bg-surface-subtle rounded-xl p-3">
                    <p className={`text-base font-bold ${color}`}>{value}</p>
                    <p className="text-muted-foreground text-[10px]">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 9. Platform health signals ───────────────────────────────────── */}
      <section className="mb-8">
        <SectionTitle
          title="Platform health signals"
          sub="Moderation flags, content quality, and system readiness indicators"
        />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {[
            {
              label: "Questions flagged",
              value: "14",
              sub: "Awaiting review",
              tone: "bg-amber-500/10 text-amber-600",
              icon: "⚑",
            },
            {
              label: "Suspicious accounts",
              value: "3",
              sub: "Flagged for review",
              tone: "bg-rose-500/10 text-rose-600",
              icon: "⚠",
            },
            {
              label: "Avg. question accuracy",
              value: "63%",
              sub: "Across all questions",
              tone: "bg-primary/10 text-primary",
              icon: "✓",
            },
            {
              label: "Content approved",
              value: "218",
              sub: "This week (auto)",
              tone: "bg-emerald-500/10 text-emerald-600",
              icon: "✔",
            },
            {
              label: "Duplicate reports",
              value: "7",
              sub: "User-flagged duplicates",
              tone: "bg-amber-500/10 text-amber-600",
              icon: "⊞",
            },
            {
              label: "System uptime",
              value: "99.8%",
              sub: "Last 30 days",
              tone: "bg-emerald-500/10 text-emerald-600",
              icon: "●",
            },
          ].map(({ label, value, sub, tone, icon }) => (
            <KpiCard
              key={label}
              label={label}
              value={value}
              sub={sub}
              tone={tone}
              icon={icon}
            />
          ))}
        </div>
      </section>

      {/* ── 10. Automated insights panel ─────────────────────────────────── */}
      <section className="mb-2">
        <div className="surface-card from-primary/10 via-surface to-surface rounded-2xl bg-gradient-to-br p-5 sm:p-6">
          <div className="mb-4 flex items-center gap-3">
            <span className="bg-primary text-primary-foreground grid size-10 place-items-center rounded-xl text-lg">
              ✧
            </span>
            <div>
              <p className="text-foreground font-bold">Platform insights</p>
              <p className="text-muted-foreground text-xs">
                Automated signals from this period&apos;s data
              </p>
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {[
              "Chemistry and Physics have the lowest accuracy — consider curating easier introductory questions.",
              "Playground (untimed) mode has 7× more AI hint usage than timed mode. Consider promoting it to new users.",
              "The 6pm–8pm window drives the highest quiz completions — ideal time for push notifications and marketing.",
              "Level 1 plan has the largest paid user share (19.2%) and is the primary upsell conversion opportunity.",
              "Referral activation rate (72.3%) is strong — doubling referral coin rewards could meaningfully boost volume.",
              `Net wallet flow is positive at ${fmtNGN(netFlow)} — the platform has a healthy liquidity margin.`,
            ].map((insight) => (
              <div
                key={insight}
                className="bg-surface/60 flex items-start gap-3 rounded-xl p-3"
              >
                <span className="bg-primary/10 text-primary mt-0.5 grid size-5 shrink-0 place-items-center rounded-full text-[10px]">
                  •
                </span>
                <p className="text-foreground text-xs leading-5">{insight}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </AdminShell>
  );
}
