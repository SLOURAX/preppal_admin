"use client";

import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowDownToLine,
  ArrowLeftRight,
  ArrowRight,
  ArrowUpFromLine,
  BadgeCheck,
  CircleCheck,
  ClipboardCheck,
  Coins,
  CopyCheck,
  Flag,
  GraduationCap,
  LayoutDashboard,
  Lightbulb,
  LoaderCircle,
  ListChecks,
  ShieldAlert,
  ShieldCheck,
  Bot,
  Timer,
  Trophy,
  UserMinus,
  UserPlus,
  UserRoundPlus,
  Users,
  UsersRound,
  WalletCards,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";

import { AdminPageHeader, SegmentedControl } from "@/components/admin-ui";
import { AdminShell } from "@/components/layout";
import { useAdminAnalytics, type AnalyticsPeriod } from "@/features/analytics";

// ─── Types ────────────────────────────────────────────────────────────────────

type Period = AnalyticsPeriod;
type AnalyticsSection =
  "overview" | "learning" | "engagement" | "finance" | "health";

const ANALYTICS_SECTIONS: Array<{
  id: AnalyticsSection;
  label: string;
  description: string;
  icon: LucideIcon;
}> = [
  {
    id: "overview",
    label: "Overview",
    description: "KPIs and growth",
    icon: LayoutDashboard,
  },
  {
    id: "learning",
    label: "Learning",
    description: "Subjects, exams and AI",
    icon: GraduationCap,
  },
  {
    id: "engagement",
    label: "Engagement",
    description: "Users and referrals",
    icon: UsersRound,
  },
  {
    id: "finance",
    label: "Finance",
    description: "Wallet and cash flow",
    icon: WalletCards,
  },
  {
    id: "health",
    label: "Platform health",
    description: "Quality and insights",
    icon: ShieldCheck,
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number) => n.toLocaleString("en-NG");
const fmtPct = (n: number) => `${n}%`;
const fmtNGN = (n: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(n / 100);
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
  readonly icon: LucideIcon;
}) {
  const Icon = icon;
  return (
    <article className="surface-card relative overflow-hidden rounded-2xl p-4">
      <span
        className={`grid size-9 place-items-center rounded-xl text-base ${tone}`}
      >
        <Icon className="size-[17px]" strokeWidth={1.9} />
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
  const width = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className="bg-surface-subtle h-2 overflow-hidden rounded-full">
      <div
        className={`h-full rounded-full transition-all ${color}`}
        style={{ width: `${width}%` }}
      />
    </div>
  );
}

function PlanBadge({ plan }: { readonly plan: string }) {
  const styles: Record<string, string> = {
    Free: "bg-slate-500/10 text-slate-600",
    "Monthly Premium": "bg-violet-500/10 text-violet-600",
    "Annual Premium": "bg-amber-500/10 text-amber-600",
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
  const [section, setSection] = useState<AnalyticsSection>("overview");
  const analytics = useAdminAnalytics(period);

  if (analytics.isPending) {
    return (
      <AdminShell>
        <AdminPageHeader
          className="mb-6"
          description="Loading live learner, learning, engagement, subscription, and wallet performance."
          eyebrow="Platform intelligence"
          title="Analytics"
        />
        <div className="surface-card grid min-h-64 place-items-center rounded-2xl p-6 text-center">
          <div>
            <LoaderCircle className="text-primary mx-auto size-7 animate-spin" />
            <p className="mt-3 text-sm font-bold">Loading platform analytics</p>
            <p className="text-muted-foreground mt-1 text-xs">
              Aggregating current database activity…
            </p>
          </div>
        </div>
      </AdminShell>
    );
  }

  if (analytics.isError || !analytics.data) {
    return (
      <AdminShell>
        <AdminPageHeader
          className="mb-6"
          description="Live learner, learning, engagement, subscription, and wallet performance."
          eyebrow="Platform intelligence"
          title="Analytics"
        />
        <div className="surface-card grid min-h-64 place-items-center rounded-2xl p-6 text-center">
          <div>
            <AlertTriangle className="text-danger mx-auto size-7" />
            <p className="mt-3 text-sm font-bold">Analytics could not load</p>
            <p className="text-muted-foreground mt-1 text-xs">
              {analytics.error instanceof Error
                ? analytics.error.message
                : "The analytics API is temporarily unavailable."}
            </p>
            <button
              className="bg-primary text-primary-foreground mt-4 rounded-xl px-4 py-2 text-xs font-bold"
              onClick={() => void analytics.refetch()}
              type="button"
            >
              Try again
            </button>
          </div>
        </div>
      </AdminShell>
    );
  }

  const data = analytics.data;
  const PLATFORM_STATS = {
    ...data.overview.kpis,
    newThisMonth: data.overview.kpis.newUsers,
    referralsThisMonth: data.overview.kpis.referrals,
  };
  const DAU_SERIES = data.overview.growth.activeUsers.map(
    (entry) => entry.value,
  );
  const REG_SERIES = data.overview.growth.registrations.map(
    (entry) => entry.value,
  );
  const QUIZ_SERIES = data.overview.growth.quizzes.map((entry) => entry.value);
  const SUBJECT_ACCURACY = data.learning.subjectAccuracy;
  const EXAM_POPULARITY = data.learning.examPopularity;
  const PLAN_DIST = data.engagement.planDistribution;
  const TOP_USERS = data.engagement.topUsers;
  const HOURLY_ACTIVITY = data.learning.hourlyActivity;
  const FINANCE_SERIES = data.finance.monthly;
  const AI_USAGE = data.learning.aiUsage.bySubject;
  const REFERRAL_FUNNEL = [
    { label: "Registered referrals", value: data.engagement.referrals.total },
    { label: "Email verified", value: data.engagement.referrals.activated },
  ];

  const days = period === "0" ? 14 : Math.min(Number(period), 14);
  const dauSlice = DAU_SERIES.slice(-days);
  const regSlice = REG_SERIES.slice(-days);
  const quizSlice = QUIZ_SERIES.slice(-days);

  const hourlyPeak = Math.max(...HOURLY_ACTIVITY, 0);
  const maxHourly = Math.max(hourlyPeak, 1);
  const peakHour = hourlyPeak ? HOURLY_ACTIVITY.indexOf(hourlyPeak) : 0;

  const netFlow = data.finance.netFlow;

  const maxFinance = Math.max(...FINANCE_SERIES.map((f) => f.deposits), 1);
  const lowestAccuracy = [...SUBJECT_ACCURACY].sort(
    (a, b) => a.accuracy - b.accuracy,
  )[0];
  const largestPaidPlan = [...PLAN_DIST]
    .filter((item) => item.plan !== "Free")
    .sort((a, b) => b.users - a.users)[0];
  const insights = [
    lowestAccuracy
      ? `${lowestAccuracy.subject} currently has the lowest recorded accuracy at ${lowestAccuracy.accuracy}%. Review its question mix and explanations.`
      : "Learning insights will appear after learners complete their first recorded quiz.",
    data.learning.aiUsage.total
      ? `Untimed sessions account for ${fmtPct(data.learning.aiUsage.segments.untimed)} of recorded AI hints; timed sessions account for ${fmtPct(data.learning.aiUsage.segments.timed)}.`
      : "AI usage insights will appear after the first recorded hint request.",
    hourlyPeak
      ? `${peakHour}:00–${peakHour + 1}:00 is the current peak quiz-completion window with ${fmt(hourlyPeak)} completions.`
      : "Peak-hour insights will appear after quiz completions are recorded.",
    largestPaidPlan
      ? `${largestPaidPlan.plan} is the largest paid segment with ${fmt(largestPaidPlan.users)} active subscribers.`
      : "Subscription insights will appear when a paid plan becomes active.",
    data.engagement.referrals.total
      ? `Referral activation is ${fmtPct(data.engagement.referrals.activationRate)} (${fmt(data.engagement.referrals.activated)} of ${fmt(data.engagement.referrals.total)}).`
      : "Referral insights will appear after the first invite registration.",
    `Net wallet flow for this period is ${fmtNGN(netFlow)}.`,
  ];

  return (
    <AdminShell>
      <AdminPageHeader
        actions={
          <SegmentedControl
            ariaLabel="Analytics reporting period"
            onChange={setPeriod}
            options={PERIOD_OPTIONS}
            value={period}
          />
        }
        className="mb-6"
        description="A compact view of learner, learning, engagement, content, subscription, and wallet performance."
        eyebrow="Platform intelligence"
        title="Analytics"
      />

      <nav
        aria-label="Analytics sections"
        className="surface-card mb-7 overflow-x-auto rounded-2xl p-1.5"
      >
        <div className="flex min-w-max gap-1" role="tablist">
          {ANALYTICS_SECTIONS.map(({ id, label, description, icon: Icon }) => {
            const isActive = section === id;

            return (
              <button
                key={id}
                aria-selected={isActive}
                className={`flex min-w-[9.75rem] items-center gap-2.5 rounded-xl px-3 py-2.5 text-left transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-surface-subtle hover:text-foreground"
                }`}
                onClick={() => setSection(id)}
                role="tab"
                type="button"
              >
                <span
                  className={`grid size-8 shrink-0 place-items-center rounded-lg ${
                    isActive ? "bg-white/15" : "bg-primary/8 text-primary"
                  }`}
                >
                  <Icon className="size-4" strokeWidth={1.9} />
                </span>
                <span>
                  <span className="block text-xs font-bold">{label}</span>
                  <span
                    className={`mt-0.5 block text-[10px] ${
                      isActive
                        ? "text-primary-foreground/70"
                        : "text-muted-foreground"
                    }`}
                  >
                    {description}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* ── 1. Platform KPIs ─────────────────────────────────────────────── */}
      {section === "overview" ? (
        <>
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
                icon={Users}
                tone="bg-primary/10 text-primary"
              />
              <KpiCard
                label="Active today"
                value={fmt(PLATFORM_STATS.activeToday)}
                sub="Unique sessions today"
                icon={Zap}
                tone="bg-emerald-500/10 text-emerald-600"
              />
              <KpiCard
                label="New this month"
                value={fmt(PLATFORM_STATS.newThisMonth)}
                sub="Registrations in period"
                icon={UserPlus}
                tone="bg-blue-500/10 text-blue-600"
              />
              <KpiCard
                label="Churn rate"
                value={fmtPct(PLATFORM_STATS.churnRate)}
                sub="30-day inactivity rate"
                icon={UserMinus}
                tone="bg-rose-500/10 text-rose-600"
              />
              <KpiCard
                label="Quizzes today"
                value={fmt(PLATFORM_STATS.quizzesToday)}
                sub="Completed sessions"
                icon={ClipboardCheck}
                tone="bg-violet-500/10 text-violet-600"
              />
              <KpiCard
                label="Total quizzes"
                value={fmt(PLATFORM_STATS.totalQuizzes)}
                sub="Completed in selected period"
                icon={ListChecks}
                tone="bg-primary/10 text-primary"
              />
              <KpiCard
                label="Avg session"
                value={fmtDuration(PLATFORM_STATS.avgSessionDuration)}
                sub="Per quiz session"
                icon={Timer}
                tone="bg-amber-500/10 text-amber-600"
              />
              <KpiCard
                label="AI hints served"
                value={fmt(PLATFORM_STATS.aiHintsUsed)}
                sub="Across all sessions"
                icon={Bot}
                tone="bg-cyan-500/10 text-cyan-600"
              />
              <KpiCard
                label="XP issued"
                value={fmt(PLATFORM_STATS.totalXpIssued)}
                sub="Total lifetime XP"
                icon={Trophy}
                tone="bg-indigo-500/10 text-indigo-600"
              />
              <KpiCard
                label="Coins in circulation"
                value={fmt(PLATFORM_STATS.coinsCirculating)}
                sub="Across all wallets"
                icon={Coins}
                tone="bg-amber-500/10 text-amber-600"
              />
              <KpiCard
                label="Pending withdrawals"
                value={fmt(PLATFORM_STATS.pendingWithdrawals)}
                sub="Awaiting approval"
                icon={ArrowUpFromLine}
                tone="bg-rose-500/10 text-rose-600"
              />
              <KpiCard
                label="Referrals (month)"
                value={fmt(PLATFORM_STATS.referralsThisMonth)}
                sub="Successful this period"
                icon={UserRoundPlus}
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
                <BarChart
                  series={regSlice}
                  color="bg-emerald-500"
                  height={72}
                />
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
                <BarChart
                  series={quizSlice}
                  color="bg-violet-500"
                  height={72}
                />
              </div>
            </div>
          </section>
        </>
      ) : null}

      {/* ── 3. User engagement ───────────────────────────────────────────── */}
      {section === "engagement" ? (
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
                        plan === "Annual Premium"
                          ? "bg-amber-500"
                          : plan === "Monthly Premium"
                            ? "bg-violet-500"
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
              <Link
                className="text-primary border-border mt-3 inline-flex items-center gap-1.5 border-t pt-3 text-[.64rem] font-bold"
                href="/users"
              >
                View learner directory <ArrowRight className="size-3.5" />
              </Link>
            </div>
          </div>
        </section>
      ) : null}

      {/* ── 4. Learning analytics ────────────────────────────────────────── */}
      {section === "learning" ? (
        <>
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
                    const maxQ = Math.max(
                      ...EXAM_POPULARITY.map((e) => e.quizzes),
                    );
                    return (
                      <div
                        key={exam}
                        className="bg-surface-subtle rounded-2xl p-4"
                      >
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
                  {fmt(hourlyPeak)} completions
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
                        style={{
                          height: `${Math.max(3, (v / maxHourly) * 80)}px`,
                        }}
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
                <span className="inline-flex items-center gap-1">
                  <ArrowLeft className="size-3" /> Low
                </span>
                <div className="flex flex-1 items-center gap-0.5">
                  {[0.15, 0.3, 0.5, 0.7, 0.85, 1].map((v) => (
                    <div
                      key={v}
                      className="bg-primary h-2 flex-1 rounded-sm"
                      style={{ opacity: v }}
                    />
                  ))}
                </div>
                <span className="inline-flex items-center gap-1">
                  High <ArrowRight className="size-3" />
                </span>
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
                        <ProgressBar
                          value={hints}
                          max={maxH}
                          color="bg-cyan-500"
                        />
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
                    {fmt(data.learning.aiUsage.total)}
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
                        rate: fmtPct(data.learning.aiUsage.segments.timed),
                        color: "text-amber-600",
                      },
                      {
                        label: "Playground sessions",
                        rate: fmtPct(data.learning.aiUsage.segments.untimed),
                        color: "text-cyan-600",
                      },
                    ].map(({ label, rate, color }) => (
                      <div
                        key={label}
                        className="bg-surface-subtle rounded-xl p-3"
                      >
                        <p className={`text-base font-bold ${color}`}>{rate}</p>
                        <p className="text-muted-foreground text-[10px]">
                          {label}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>
        </>
      ) : null}

      {/* ── 7. Finance analytics ─────────────────────────────────────────── */}
      {section === "finance" ? (
        <section className="mb-8">
          <SectionTitle
            title="Finance & wallet analytics"
            sub="Deposits, withdrawals, net coin flow, and 6-month revenue trend"
          />
          <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard
              label="Total deposited"
              value={fmtNGN(data.finance.totalDeposited)}
              sub="Selected period"
              icon={ArrowDownToLine}
              tone="bg-emerald-500/10 text-emerald-600"
            />
            <KpiCard
              label="Total withdrawn"
              value={fmtNGN(data.finance.totalWithdrawn)}
              sub="Selected period"
              icon={ArrowUpFromLine}
              tone="bg-rose-500/10 text-rose-600"
            />
            <KpiCard
              label="Net flow"
              value={fmtNGN(netFlow)}
              sub="Deposits minus withdrawals"
              icon={ArrowLeftRight}
              tone="bg-primary/10 text-primary"
            />
            <KpiCard
              label="Coins circulating"
              value={fmt(PLATFORM_STATS.coinsCirculating)}
              sub="Across all wallets"
              icon={Coins}
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
      ) : null}

      {/* ── 8. Referral analytics ────────────────────────────────────────── */}
      {section === "engagement" ? (
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
                  {fmt(data.engagement.referrals.rewardsRedeemed)}
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
                      label: "Activation rate",
                      value: fmtPct(data.engagement.referrals.activationRate),
                      color: "text-blue-600",
                    },
                    {
                      label: "Verified referrals",
                      value: fmt(data.engagement.referrals.activated),
                      color: "text-emerald-600",
                    },
                    {
                      label: "Pending verification",
                      value: fmt(
                        Math.max(
                          0,
                          data.engagement.referrals.total -
                            data.engagement.referrals.activated,
                        ),
                      ),
                      color: "text-violet-600",
                    },
                    {
                      label: "Reward redemptions",
                      value: fmt(data.engagement.referrals.rewardsRedeemed),
                      color: "text-amber-600",
                    },
                  ].map(({ label, value, color }) => (
                    <div
                      key={label}
                      className="bg-surface-subtle rounded-xl p-3"
                    >
                      <p className={`text-base font-bold ${color}`}>{value}</p>
                      <p className="text-muted-foreground text-[10px]">
                        {label}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {/* ── 9. Platform health signals ───────────────────────────────────── */}
      {section === "health" ? (
        <>
          <section className="mb-8">
            <SectionTitle
              title="Platform health signals"
              sub="Moderation flags, content quality, and system readiness indicators"
            />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {[
                {
                  label: "Questions flagged",
                  value: fmt(data.health.questionsFlagged),
                  sub: "Awaiting review",
                  tone: "bg-amber-500/10 text-amber-600",
                  icon: Flag,
                },
                {
                  label: "Suspicious accounts",
                  value: fmt(data.health.suspiciousAccounts),
                  sub: "Currently suspended",
                  tone: "bg-rose-500/10 text-rose-600",
                  icon: ShieldAlert,
                },
                {
                  label: "Avg. question accuracy",
                  value: fmtPct(data.health.averageQuestionAccuracy),
                  sub: "Across all questions",
                  tone: "bg-primary/10 text-primary",
                  icon: CircleCheck,
                },
                {
                  label: "Incorrect answer reports",
                  value: fmt(data.health.incorrectAnswerReports),
                  sub: "Open content flags",
                  tone: "bg-emerald-500/10 text-emerald-600",
                  icon: BadgeCheck,
                },
                {
                  label: "Duplicate reports",
                  value: fmt(data.health.duplicateReports),
                  sub: "User-flagged duplicates",
                  tone: "bg-amber-500/10 text-amber-600",
                  icon: CopyCheck,
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
                <span className="bg-primary text-primary-foreground grid size-10 place-items-center rounded-xl">
                  <Bot className="size-[18px]" strokeWidth={1.9} />
                </span>
                <div>
                  <p className="text-foreground font-bold">Platform insights</p>
                  <p className="text-muted-foreground text-xs">
                    Automated signals from this period&apos;s data
                  </p>
                </div>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {insights.map((insight) => (
                  <div
                    key={insight}
                    className="bg-surface/60 flex items-start gap-3 rounded-xl p-3"
                  >
                    <span className="bg-primary/10 text-primary mt-0.5 grid size-5 shrink-0 place-items-center rounded-full">
                      <Lightbulb className="size-3" strokeWidth={2} />
                    </span>
                    <p className="text-foreground text-xs leading-5">
                      {insight}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </>
      ) : null}
    </AdminShell>
  );
}
