"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import {
  ArrowRight,
  CalendarRange,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { useState } from "react";

import {
  AdminPageHeader,
  MetricCard,
  SegmentedControl,
  StatusBadge,
} from "@/components/admin-ui";
import { AdminShell } from "@/components/layout";
import { AdminIcon, type AdminIconName } from "@/components/ui";
import { apiClient } from "@/lib/api/client";
import { cn } from "@/lib/utils";

type Period = "7" | "30" | "90";
type ActivityKind = "withdrawal" | "subscription" | "quiz" | "user";

interface OverviewResponse {
  generatedAt: string;
  period: Period;
  dateRange: { from: string; to: string; custom: boolean };
  snapshot: {
    quizzesToday: number;
    xpToday: number;
    checkInsToday: number;
    newLearnersToday: number;
    averageScoreToday: number;
  };
  metrics: {
    totalLearners: number;
    newLearnersInRange: number;
    learnerGrowth: number;
    activeToday: number;
    activeTodayRate: number;
    activeTodayChange: number;
    quizzesThisWeek: number;
    quizWeekChange: number;
    revenueThisMonthMinor: number;
    revenueChange: number;
    revenueDifferenceMinor: number;
  };
  activity: {
    uniqueUsers: number;
    change: number;
    series: Array<{ date: string; value: number }>;
  };
  attention: {
    total: number;
    withdrawals: { count: number; amountMinor: number };
    flaggedQuestions: number;
    suspendedAccounts: number;
  };
  subjects: Array<{ name: string; attempts: number; accuracy: number }>;
  recentActivity: Array<{
    id: string;
    kind: ActivityKind;
    title: string;
    meta: string;
    amountMinor?: number;
    createdAt: string;
  }>;
}

interface AdminSession {
  fullName: string;
}

const PERIODS: ReadonlyArray<{ label: string; value: Period }> = [
  { label: "7 days", value: "7" },
  { label: "30 days", value: "30" },
  { label: "3 months", value: "90" },
];

const QUICK_ACTIONS: ReadonlyArray<{
  description: string;
  href: string;
  icon: AdminIconName;
  label: string;
}> = [
  {
    label: "Manage users",
    description: "Review accounts and access",
    href: "/users",
    icon: "users",
  },
  {
    label: "Manage blog",
    description: "Publish stories and discussions",
    href: "/content",
    icon: "blog",
  },
  {
    label: "Review withdrawals",
    description: "Process pending requests",
    href: "/finance/withdrawals",
    icon: "withdrawals",
  },
  {
    label: "View analytics",
    description: "Explore platform insights",
    href: "/analytics",
    icon: "analytics",
  },
];

const number = (value: number) => value.toLocaleString("en-NG");
const money = (minor: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(minor / 100);
const compactMoney = (minor: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(minor / 100);
const signedPercent = (value: number) =>
  `${value > 0 ? "+" : ""}${value.toFixed(1)}%`;
const lagosDateKey = (value: string) => {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Lagos",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(value));
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
};
const activityTime = (value: string) =>
  new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "Africa/Lagos",
  }).format(new Date(value));
const greeting = (value: string) => {
  const hour = Number(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Africa/Lagos",
      hour: "2-digit",
      hourCycle: "h23",
    }).format(new Date(value)),
  );
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
};

function TrendChart({
  values,
}: {
  readonly values: OverviewResponse["activity"]["series"];
}) {
  const width = 720;
  const height = 220;
  const padX = 8;
  const padY = 18;
  const numericValues = values.map((item) => item.value);
  const max = Math.max(1, ...numericValues);
  const min = Math.min(0, ...numericValues);
  const denominator = Math.max(values.length - 1, 1);
  const points = values
    .map((item, index) => {
      const x = padX + (index / denominator) * (width - padX * 2);
      const y =
        padY +
        ((max - item.value) / Math.max(max - min, 1)) * (height - padY * 2);
      return `${x},${y}`;
    })
    .join(" ");
  const areaPoints = `${padX},${height} ${points} ${width - padX},${height}`;
  const middle = values[Math.floor(values.length / 2)];
  const dateLabel = (value?: string) =>
    value
      ? new Intl.DateTimeFormat("en-NG", {
          day: "numeric",
          month: "short",
        }).format(new Date(`${value}T12:00:00Z`))
      : "";

  return (
    <div className="mt-5">
      <div className="h-56 w-full">
        <svg
          aria-label="Active learner trend"
          className="h-full w-full overflow-visible"
          preserveAspectRatio="none"
          role="img"
          viewBox={`0 0 ${width} ${height}`}
        >
          <defs>
            <linearGradient
              id="overview-chart-fill"
              x1="0"
              x2="0"
              y1="0"
              y2="1"
            >
              <stop offset="0%" stopColor="#6842f6" stopOpacity=".24" />
              <stop offset="100%" stopColor="#6842f6" stopOpacity="0" />
            </linearGradient>
          </defs>
          {[48, 91, 134, 177].map((y) => (
            <line
              key={y}
              stroke="currentColor"
              strokeDasharray="5 7"
              strokeOpacity=".1"
              x1="0"
              x2={width}
              y1={y}
              y2={y}
            />
          ))}
          <polygon fill="url(#overview-chart-fill)" points={areaPoints} />
          <polyline
            fill="none"
            points={points}
            stroke="#6842f6"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="4"
            vectorEffect="non-scaling-stroke"
          />
          {points ? (
            <g>
              <circle
                cx={points.split(" ").at(-1)?.split(",")[0]}
                cy={points.split(" ").at(-1)?.split(",")[1]}
                fill="#6842f6"
                opacity=".16"
                r="8"
              />
              <circle
                cx={points.split(" ").at(-1)?.split(",")[0]}
                cy={points.split(" ").at(-1)?.split(",")[1]}
                fill="#6842f6"
                r="4"
              />
            </g>
          ) : null}
        </svg>
      </div>
      <div className="text-muted-foreground mt-1 flex justify-between text-[.68rem] font-medium">
        <span>{dateLabel(values[0]?.date)}</span>
        <span>{dateLabel(middle?.date)}</span>
        <span>{dateLabel(values.at(-1)?.date)}</span>
      </div>
    </div>
  );
}

function ArrowIcon() {
  return <ArrowRight aria-hidden="true" className="size-4" strokeWidth={1.8} />;
}

export default function DashboardPage() {
  const [period, setPeriod] = useState<Period>("7");
  const [customOpen, setCustomOpen] = useState(false);
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [customRange, setCustomRange] = useState<{
    from: string;
    to: string;
  } | null>(null);
  const [rangeError, setRangeError] = useState("");
  const overviewQuery = customRange
    ? `period=${period}&from=${customRange.from}&to=${customRange.to}`
    : `period=${period}`;
  const query = useQuery({
    queryKey: ["admin", "overview", period, customRange],
    queryFn: () =>
      apiClient<OverviewResponse>(`/api/v1/admin/overview?${overviewQuery}`),
  });
  const session = useQuery({
    queryKey: ["auth", "admin", "session"],
    queryFn: () => apiClient<AdminSession>("/api/v1/auth/admin/me"),
    staleTime: 60_000,
  });
  const data = query.data;
  const firstName = session.data?.fullName.split(" ")[0] ?? "Admin";
  const metrics = data
    ? [
        {
          label: "Total learners",
          value: number(data.metrics.totalLearners),
          change: signedPercent(data.metrics.learnerGrowth),
          description: `${number(data.metrics.newLearnersInRange)} joined from ${data.dateRange.from} to ${data.dateRange.to}`,
          icon: "users" as AdminIconName,
          accent: "bg-[#ebe8ff] text-[#5b35f5] dark:bg-[#5b35f5]/20",
        },
        {
          label: "Active today",
          value: number(data.metrics.activeToday),
          change: signedPercent(data.metrics.activeTodayChange),
          description: `${data.metrics.activeTodayRate}% of all learners`,
          icon: "analytics" as AdminIconName,
          accent: "bg-[#e6f8f1] text-[#089568] dark:bg-[#089568]/20",
        },
        {
          label: "Quizzes this week",
          value: number(data.metrics.quizzesThisWeek),
          change: signedPercent(data.metrics.quizWeekChange),
          description: `${number(data.snapshot.quizzesToday)} completed today`,
          icon: "content" as AdminIconName,
          accent: "bg-[#fff2df] text-[#e97818] dark:bg-[#e97818]/20",
        },
        {
          label: "Revenue this month",
          value: compactMoney(data.metrics.revenueThisMonthMinor),
          change: signedPercent(data.metrics.revenueChange),
          description: `${money(Math.abs(data.metrics.revenueDifferenceMinor))} ${data.metrics.revenueDifferenceMinor >= 0 ? "ahead of" : "behind"} last month`,
          icon: "finance" as AdminIconName,
          accent: "bg-[#e7f2ff] text-[#2474d8] dark:bg-[#2474d8]/20",
        },
      ]
    : [];
  const attentionItems = data
    ? [
        {
          label: "Withdrawal requests",
          detail: `${number(data.attention.withdrawals.count)} requests awaiting review`,
          value: compactMoney(data.attention.withdrawals.amountMinor),
          tone: "bg-amber-500",
          href: "/finance/withdrawals",
        },
        {
          label: "Flagged questions",
          detail: `${number(data.attention.flaggedQuestions)} questions need moderation`,
          value: number(data.attention.flaggedQuestions),
          tone: "bg-rose-500",
          href: "/quizzes",
        },
        {
          label: "Account reviews",
          detail: `${number(data.attention.suspendedAccounts)} suspended accounts`,
          value: number(data.attention.suspendedAccounts),
          tone: "bg-blue-500",
          href: "/users",
        },
      ]
    : [];
  const activityPresentation: Record<
    ActivityKind,
    { icon: AdminIconName; tone: string }
  > = {
    withdrawal: {
      icon: "withdrawals",
      tone: "bg-amber-500/10 text-amber-600",
    },
    subscription: {
      icon: "rewards",
      tone: "bg-primary/10 text-primary",
    },
    quiz: { icon: "content", tone: "bg-blue-500/10 text-blue-600" },
    user: { icon: "users", tone: "bg-emerald-500/10 text-emerald-600" },
  };

  return (
    <AdminShell>
      <div className="mx-auto w-full max-w-[1540px]">
        <AdminPageHeader
          actions={
            <StatusBadge dot tone="success">
              Live database
            </StatusBadge>
          }
          className="mb-6"
          description="A live view of learning, subscriptions, payments, and queues requiring attention."
          eyebrow="Admin overview"
          title={`${data ? greeting(data.generatedAt) : "Welcome back"}, ${firstName}`}
        />

        <section className="surface-card mb-5 rounded-2xl p-3 sm:p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-foreground text-xs font-bold">
                Reporting period
              </p>
              <p className="text-muted-foreground mt-1 text-[.66rem]">
                Filters learner growth, activity, and subject performance.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <SegmentedControl<Period>
                active={!customRange}
                ariaLabel="Overview reporting period"
                onChange={(value) => {
                  setPeriod(value);
                  setCustomRange(null);
                  setCustomOpen(false);
                  setRangeError("");
                }}
                options={PERIODS}
                value={period}
              />
              <button
                aria-pressed={Boolean(customRange)}
                className={cn(
                  "inline-flex h-9 items-center gap-2 rounded-xl border px-3 text-[.68rem] font-bold transition",
                  customRange
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border text-muted-foreground hover:bg-surface-subtle hover:text-foreground",
                )}
                onClick={() => setCustomOpen((open) => !open)}
                type="button"
              >
                <CalendarRange className="size-3.5" /> Custom
              </button>
            </div>
          </div>
          {customOpen ? (
            <div className="border-border mt-3 flex flex-col gap-3 border-t pt-3 sm:flex-row sm:items-end">
              <label className="block flex-1">
                <span className="text-muted-foreground mb-1.5 block text-[.62rem] font-bold">
                  Start date
                </span>
                <input
                  className="border-border bg-background focus:border-primary h-10 w-full rounded-xl border px-3 text-xs outline-none"
                  max={
                    customTo ||
                    (data ? lagosDateKey(data.generatedAt) : undefined)
                  }
                  onChange={(event) => setCustomFrom(event.target.value)}
                  type="date"
                  value={customFrom}
                />
              </label>
              <label className="block flex-1">
                <span className="text-muted-foreground mb-1.5 block text-[.62rem] font-bold">
                  End date
                </span>
                <input
                  className="border-border bg-background focus:border-primary h-10 w-full rounded-xl border px-3 text-xs outline-none"
                  max={data ? lagosDateKey(data.generatedAt) : undefined}
                  min={customFrom || undefined}
                  onChange={(event) => setCustomTo(event.target.value)}
                  type="date"
                  value={customTo}
                />
              </label>
              <button
                className="bg-primary text-primary-foreground h-10 rounded-xl px-5 text-xs font-bold disabled:cursor-not-allowed disabled:opacity-50"
                disabled={!customFrom || !customTo}
                onClick={() => {
                  if (customFrom > customTo) {
                    setRangeError("Start date must be before the end date.");
                    return;
                  }
                  const days =
                    Math.floor(
                      (new Date(`${customTo}T00:00:00`).getTime() -
                        new Date(`${customFrom}T00:00:00`).getTime()) /
                        86_400_000,
                    ) + 1;
                  if (days > 366) {
                    setRangeError("Choose a range of 366 days or less.");
                    return;
                  }
                  setRangeError("");
                  setCustomRange({ from: customFrom, to: customTo });
                  setCustomOpen(false);
                }}
                type="button"
              >
                Apply range
              </button>
            </div>
          ) : null}
          {rangeError ? (
            <p className="mt-2 text-[.66rem] font-semibold text-rose-600">
              {rangeError}
            </p>
          ) : null}
          {data?.dateRange.custom ? (
            <p className="text-muted-foreground mt-2 text-[.64rem]">
              Showing {data.dateRange.from} through {data.dateRange.to}
            </p>
          ) : null}
        </section>

        {query.isLoading ? (
          <div className="text-muted-foreground flex min-h-[26rem] items-center justify-center gap-2 text-xs">
            <span className="border-primary size-5 animate-spin rounded-full border-2 border-t-transparent" />
            Loading platform overview…
          </div>
        ) : query.isError || !data ? (
          <div className="surface-card rounded-3xl p-10 text-center">
            <p className="text-foreground text-sm font-bold">
              Overview data is unavailable
            </p>
            <p className="text-muted-foreground mt-1 text-xs">
              The live platform summary could not be loaded.
            </p>
            <button
              className="text-primary mt-3 text-xs font-bold"
              onClick={() => query.refetch()}
              type="button"
            >
              Try again
            </button>
          </div>
        ) : (
          <>
            <section className="relative mb-5 overflow-hidden rounded-[1.75rem] bg-[#2b1768] px-6 py-7 text-white shadow-[0_20px_60px_rgba(49,28,111,.2)] sm:px-8 sm:py-8">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_76%_14%,rgba(164,128,255,.48),transparent_31%),linear-gradient(120deg,transparent_45%,rgba(255,255,255,.05)_45%,rgba(255,255,255,.05)_46%,transparent_46%)]" />
              <div className="relative grid gap-8 lg:grid-cols-[1.25fr_.75fr] lg:items-center">
                <div className="max-w-2xl">
                  <span className="inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[.68rem] font-bold tracking-[0.12em] uppercase">
                    Today&apos;s snapshot
                  </span>
                  <h2 className="mt-4 text-2xl font-bold tracking-[-0.04em] sm:text-[2rem]">
                    {number(data.snapshot.quizzesToday)} quizzes completed
                    today.
                  </h2>
                  <p className="mt-2 max-w-xl text-sm leading-6 text-violet-100/80">
                    Learners earned {number(data.snapshot.xpToday)} XP and
                    achieved an average quiz score of{" "}
                    {data.snapshot.averageScoreToday}%.
                  </p>
                  <div className="mt-6 flex flex-wrap gap-3">
                    <Link
                      className="inline-flex h-10 items-center gap-2 rounded-xl bg-white px-4 text-xs font-bold text-[#2b1768] transition hover:bg-violet-50"
                      href="/analytics"
                    >
                      View full report <ArrowIcon />
                    </Link>
                    <Link
                      className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 text-xs font-bold text-white transition hover:bg-white/15"
                      href="/finance/withdrawals"
                    >
                      Review pending items
                    </Link>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {[
                    [number(data.snapshot.quizzesToday), "Quizzes today"],
                    [number(data.snapshot.xpToday), "XP awarded"],
                    [number(data.snapshot.checkInsToday), "Daily check-ins"],
                    [number(data.snapshot.newLearnersToday), "New learners"],
                  ].map(([value, label]) => (
                    <div
                      className="rounded-2xl border border-white/10 bg-white/[.08] p-4 backdrop-blur-sm"
                      key={label}
                    >
                      <p className="text-xl font-bold tracking-[-0.035em]">
                        {value}
                      </p>
                      <p className="mt-1 text-[.7rem] font-medium text-violet-100/65">
                        {label}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {metrics.map((metric) => (
                <MetricCard
                  accent={metric.accent}
                  change={metric.change}
                  detail={metric.description}
                  icon={metric.icon}
                  key={metric.label}
                  label={metric.label}
                  value={metric.value}
                />
              ))}
            </section>

            <section className="mb-5 grid gap-5 xl:grid-cols-[1.55fr_.85fr]">
              <article className="surface-card rounded-[1.5rem] p-5 sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-foreground text-base font-bold tracking-[-0.02em]">
                      Learner activity
                    </p>
                    <p className="text-muted-foreground mt-1 text-xs">
                      Unique signed-in learners across the selected period
                    </p>
                  </div>
                  <SegmentedControl<Period>
                    active={!customRange}
                    ariaLabel="Activity period"
                    onChange={(value) => {
                      setPeriod(value);
                      setCustomRange(null);
                    }}
                    options={PERIODS}
                    value={period}
                  />
                </div>
                <div className="mt-5 flex flex-wrap items-end gap-x-6 gap-y-2">
                  <div>
                    <p className="text-foreground text-3xl font-bold tracking-[-0.05em]">
                      {number(data.activity.uniqueUsers)}
                    </p>
                    <p className="text-muted-foreground mt-1 text-[.68rem]">
                      Unique active learners
                    </p>
                  </div>
                  <span
                    className={cn(
                      "mb-4 inline-flex items-center gap-1 text-xs font-bold",
                      data.activity.change >= 0
                        ? "text-emerald-600"
                        : "text-rose-600",
                    )}
                  >
                    {data.activity.change >= 0 ? (
                      <TrendingUp className="size-3" />
                    ) : (
                      <TrendingDown className="size-3" />
                    )}
                    {signedPercent(data.activity.change)} vs previous period
                  </span>
                </div>
                <TrendChart values={data.activity.series} />
              </article>

              <article className="surface-card rounded-[1.5rem] p-5 sm:p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-foreground text-base font-bold tracking-[-0.02em]">
                      Needs attention
                    </p>
                    <p className="text-muted-foreground mt-1 text-xs">
                      Items waiting for an administrator
                    </p>
                  </div>
                  <span className="grid size-8 place-items-center rounded-full bg-rose-500/10 text-xs font-bold text-rose-600">
                    {number(data.attention.total)}
                  </span>
                </div>
                <div className="mt-5 divide-y">
                  {attentionItems.map((item) => (
                    <Link
                      className="group flex items-center gap-3 py-4 first:pt-1 last:pb-0"
                      href={item.href}
                      key={item.label}
                    >
                      <span
                        className={cn(
                          "size-2 shrink-0 rounded-full",
                          item.tone,
                        )}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="text-foreground block text-xs font-bold">
                          {item.label}
                        </span>
                        <span className="text-muted-foreground mt-1 block truncate text-[.68rem]">
                          {item.detail}
                        </span>
                      </span>
                      <span className="text-foreground text-xs font-bold">
                        {item.value}
                      </span>
                      <span className="text-muted-foreground group-hover:text-primary transition group-hover:translate-x-0.5">
                        <ArrowIcon />
                      </span>
                    </Link>
                  ))}
                </div>
              </article>
            </section>

            <section className="mb-5 grid gap-5 xl:grid-cols-[1.12fr_.88fr]">
              <article className="surface-card rounded-[1.5rem] p-5 sm:p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-foreground text-base font-bold tracking-[-0.02em]">
                      Learning pulse
                    </p>
                    <p className="text-muted-foreground mt-1 text-xs">
                      Accuracy across the most active subjects
                    </p>
                  </div>
                  <Link
                    className="text-primary inline-flex items-center gap-1.5 text-[.7rem] font-bold"
                    href="/analytics"
                  >
                    Details <ArrowIcon />
                  </Link>
                </div>
                <div className="mt-6 space-y-5">
                  {data.subjects.map((subject, index) => (
                    <div key={subject.name}>
                      <div className="mb-2 flex items-end justify-between gap-4">
                        <div>
                          <p className="text-foreground text-xs font-bold">
                            {subject.name}
                          </p>
                          <p className="text-muted-foreground mt-0.5 text-[.65rem]">
                            {number(subject.attempts)} attempts
                          </p>
                        </div>
                        <p className="text-foreground text-xs font-bold">
                          {subject.accuracy}%
                        </p>
                      </div>
                      <div className="bg-surface-subtle h-2 overflow-hidden rounded-full">
                        <div
                          className={cn(
                            "h-full rounded-full",
                            [
                              "bg-[#5b35f5]",
                              "bg-[#8b6cff]",
                              "bg-[#20a779]",
                              "bg-[#f59e0b]",
                            ][index] ?? "bg-primary",
                          )}
                          style={{ width: `${subject.accuracy}%` }}
                        />
                      </div>
                    </div>
                  ))}
                  {!data.subjects.length ? (
                    <p className="text-muted-foreground py-10 text-center text-xs">
                      No completed quizzes in this period yet.
                    </p>
                  ) : null}
                </div>
              </article>

              <article className="surface-card rounded-[1.5rem] p-5 sm:p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-foreground text-base font-bold tracking-[-0.02em]">
                      Recent activity
                    </p>
                    <p className="text-muted-foreground mt-1 text-xs">
                      Latest persisted events across the platform
                    </p>
                  </div>
                  <Link
                    className="text-primary hover:bg-primary/5 inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[.68rem] font-bold"
                    href="/activity"
                  >
                    View all <ArrowIcon />
                  </Link>
                </div>
                <div className="mt-4 divide-y">
                  {data.recentActivity.map((activity) => {
                    const presentation = activityPresentation[activity.kind];
                    return (
                      <div
                        className="flex items-center gap-3 py-3.5"
                        key={`${activity.kind}-${activity.id}`}
                      >
                        <span
                          className={cn(
                            "grid size-9 shrink-0 place-items-center rounded-xl",
                            presentation.tone,
                          )}
                        >
                          <AdminIcon
                            className="size-4"
                            name={presentation.icon}
                          />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-foreground truncate text-xs font-bold">
                            {activity.title}
                          </p>
                          <p className="text-muted-foreground mt-1 truncate text-[.66rem]">
                            {activity.meta}
                            {activity.amountMinor !== undefined
                              ? ` · ${money(activity.amountMinor)}`
                              : ""}
                          </p>
                        </div>
                        <span className="text-muted-foreground text-[.64rem]">
                          {activityTime(activity.createdAt)}
                        </span>
                      </div>
                    );
                  })}
                  {!data.recentActivity.length ? (
                    <p className="text-muted-foreground py-10 text-center text-xs">
                      No platform activity has been recorded yet.
                    </p>
                  ) : null}
                </div>
              </article>
            </section>

            <section className="surface-card rounded-[1.5rem] p-5 sm:p-6">
              <div className="mb-5">
                <p className="text-foreground text-base font-bold tracking-[-0.02em]">
                  Quick actions
                </p>
                <p className="text-muted-foreground mt-1 text-xs">
                  Jump into common administration tasks
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {QUICK_ACTIONS.map((action) => (
                  <Link
                    className="border-border hover:border-primary/35 hover:bg-primary/[.03] group flex items-center gap-3 rounded-2xl border p-4 transition"
                    href={action.href}
                    key={action.label}
                  >
                    <span className="bg-primary/10 text-primary grid size-10 shrink-0 place-items-center rounded-xl">
                      <AdminIcon className="size-[18px]" name={action.icon} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="text-foreground block text-xs font-bold">
                        {action.label}
                      </span>
                      <span className="text-muted-foreground mt-1 block truncate text-[.65rem]">
                        {action.description}
                      </span>
                    </span>
                    <span className="text-muted-foreground group-hover:text-primary transition group-hover:translate-x-0.5">
                      <ArrowIcon />
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </AdminShell>
  );
}
