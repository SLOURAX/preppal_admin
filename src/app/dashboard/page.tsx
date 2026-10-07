"use client";

import Link from "next/link";
import { useState } from "react";

import { AdminShell } from "@/components/layout";
import { AdminIcon, type AdminIconName } from "@/components/ui";
import { cn } from "@/lib/utils";

type Period = "7" | "30" | "90";

const METRICS: ReadonlyArray<{
  readonly accent: string;
  readonly change: string;
  readonly description: string;
  readonly icon: AdminIconName;
  readonly label: string;
  readonly value: string;
}> = [
  {
    label: "Total learners",
    value: "14,820",
    change: "+12.4%",
    description: "1,204 joined this month",
    icon: "users",
    accent: "bg-[#ebe8ff] text-[#5b35f5] dark:bg-[#5b35f5]/20",
  },
  {
    label: "Active today",
    value: "1,342",
    change: "+8.7%",
    description: "9.1% of all learners",
    icon: "analytics",
    accent: "bg-[#e6f8f1] text-[#089568] dark:bg-[#089568]/20",
  },
  {
    label: "Quizzes this week",
    value: "8,492",
    change: "+6.2%",
    description: "71% completion rate",
    icon: "content",
    accent: "bg-[#fff2df] text-[#e97818] dark:bg-[#e97818]/20",
  },
  {
    label: "Revenue this month",
    value: "₦6.1m",
    change: "+15.2%",
    description: "₦820k ahead of last month",
    icon: "finance",
    accent: "bg-[#e7f2ff] text-[#2474d8] dark:bg-[#2474d8]/20",
  },
];

const ATTENTION_ITEMS = [
  {
    label: "Withdrawal requests",
    detail: "18 requests awaiting review",
    value: "₦428k",
    tone: "bg-amber-500",
    href: "/finance/withdrawals",
  },
  {
    label: "Flagged questions",
    detail: "7 questions need moderation",
    value: "7",
    tone: "bg-rose-500",
    href: "/content",
  },
  {
    label: "Account reviews",
    detail: "4 learner accounts need attention",
    value: "4",
    tone: "bg-blue-500",
    href: "/users",
  },
] as const;

const SUBJECTS = [
  {
    name: "Mathematics",
    attempts: "3,240 attempts",
    accuracy: 82,
    color: "bg-[#5b35f5]",
  },
  {
    name: "English language",
    attempts: "2,875 attempts",
    accuracy: 76,
    color: "bg-[#8b6cff]",
  },
  {
    name: "Biology",
    attempts: "1,940 attempts",
    accuracy: 69,
    color: "bg-[#20a779]",
  },
  {
    name: "Chemistry",
    attempts: "1,522 attempts",
    accuracy: 61,
    color: "bg-[#f59e0b]",
  },
] as const;

const RECENT_ACTIVITY = [
  {
    title: "Withdrawal submitted",
    meta: "Amara Okafor · ₦24,000",
    time: "4 min",
    icon: "withdrawals" as const,
    tone: "bg-amber-500/10 text-amber-600",
  },
  {
    title: "New premium subscription",
    meta: "David Eze · Premium monthly",
    time: "18 min",
    icon: "rewards" as const,
    tone: "bg-primary/10 text-primary",
  },
  {
    title: "Quiz content updated",
    meta: "WAEC Biology · 24 questions",
    time: "42 min",
    icon: "content" as const,
    tone: "bg-blue-500/10 text-blue-600",
  },
  {
    title: "Learner account verified",
    meta: "Zainab Musa · Level 1",
    time: "1 hr",
    icon: "users" as const,
    tone: "bg-emerald-500/10 text-emerald-600",
  },
] as const;

const QUICK_ACTIONS: ReadonlyArray<{
  readonly description: string;
  readonly href: string;
  readonly icon: AdminIconName;
  readonly label: string;
}> = [
  {
    label: "Manage learners",
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

const PERIODS: ReadonlyArray<{
  readonly label: string;
  readonly value: Period;
}> = [
  { label: "7 days", value: "7" },
  { label: "30 days", value: "30" },
  { label: "3 months", value: "90" },
];

const CHART_POINTS: Record<Period, readonly number[]> = {
  "7": [38, 49, 45, 62, 58, 73, 81],
  "30": [32, 40, 38, 48, 44, 59, 55, 64, 61, 72, 68, 79],
  "90": [24, 31, 29, 38, 36, 46, 43, 54, 52, 61, 66, 74],
};

function TrendChart({ period }: { readonly period: Period }) {
  const values = CHART_POINTS[period];
  const width = 720;
  const height = 220;
  const padX = 8;
  const padY = 18;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const points = values
    .map((value, index) => {
      const x = padX + (index / (values.length - 1)) * (width - padX * 2);
      const y =
        padY + ((max - value) / Math.max(max - min, 1)) * (height - padY * 2);
      return `${x},${y}`;
    })
    .join(" ");
  const areaPoints = `${padX},${height} ${points} ${width - padX},${height}`;

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
          {points.split(" ").map((point, index) => {
            const [cx, cy] = point.split(",");
            return index === values.length - 1 ? (
              <g key={point}>
                <circle cx={cx} cy={cy} fill="#6842f6" r="8" opacity=".16" />
                <circle cx={cx} cy={cy} fill="#6842f6" r="4" />
              </g>
            ) : null;
          })}
        </svg>
      </div>
      <div className="text-muted-foreground mt-1 flex justify-between text-[.68rem] font-medium">
        <span>{period === "7" ? "Mon" : "Start"}</span>
        <span>{period === "7" ? "Tue" : ""}</span>
        <span>{period === "7" ? "Wed" : ""}</span>
        <span>{period === "7" ? "Thu" : "Mid period"}</span>
        <span>{period === "7" ? "Fri" : ""}</span>
        <span>{period === "7" ? "Sat" : ""}</span>
        <span>{period === "7" ? "Sun" : "Today"}</span>
      </div>
    </div>
  );
}

function ArrowIcon() {
  return (
    <svg aria-hidden="true" className="size-4" fill="none" viewBox="0 0 24 24">
      <path
        d="M5 12h14m-5-5 5 5-5 5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

export default function DashboardPage() {
  const [period, setPeriod] = useState<Period>("7");

  return (
    <AdminShell>
      <div className="mx-auto w-full max-w-[1540px]">
        <header className="mb-7 flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <span className="text-primary text-[.68rem] font-bold tracking-[0.16em] uppercase">
              Admin overview
            </span>
            <h1 className="text-foreground mt-2 text-2xl font-bold tracking-[-0.04em] sm:text-3xl">
              Good afternoon, Solomon
            </h1>
            <p className="text-muted-foreground mt-2 max-w-2xl text-sm leading-6">
              Here&apos;s what is happening across Preppal today.
            </p>
          </div>
          <div className="border-border bg-surface flex w-fit items-center gap-2 rounded-full border px-3 py-2 text-xs shadow-sm">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-50" />
              <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
            </span>
            <span className="text-foreground font-semibold">
              All systems operational
            </span>
            <span className="text-muted-foreground hidden sm:inline">
              · checked 2 min ago
            </span>
          </div>
        </header>

        <section className="relative mb-5 overflow-hidden rounded-[1.75rem] bg-[#2b1768] px-6 py-7 text-white shadow-[0_20px_60px_rgba(49,28,111,.2)] sm:px-8 sm:py-8">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_76%_14%,rgba(164,128,255,.48),transparent_31%),linear-gradient(120deg,transparent_45%,rgba(255,255,255,.05)_45%,rgba(255,255,255,.05)_46%,transparent_46%)]" />
          <div className="relative grid gap-8 lg:grid-cols-[1.25fr_.75fr] lg:items-center">
            <div className="max-w-2xl">
              <span className="inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[.68rem] font-bold tracking-[0.12em] uppercase">
                Today&apos;s snapshot
              </span>
              <h2 className="mt-4 text-2xl font-bold tracking-[-0.04em] sm:text-[2rem]">
                Learning activity is up 8.7% today.
              </h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-violet-100/80">
                Learners have completed 2,186 quizzes, earned 48,420 XP, and
                maintained a 71% average completion rate.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  className="inline-flex h-10 items-center gap-2 rounded-xl bg-white px-4 text-xs font-bold text-[#2b1768] transition hover:bg-violet-50"
                  href="/analytics"
                >
                  View full report
                  <ArrowIcon />
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
                ["2,186", "Quizzes today"],
                ["48.4k", "XP awarded"],
                ["326", "Daily check-ins"],
                ["42", "New learners"],
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
          {METRICS.map((metric) => (
            <article
              className="surface-card group rounded-2xl p-5 transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_45px_rgb(28_39_76/.12)]"
              key={metric.label}
            >
              <div className="flex items-start justify-between gap-4">
                <span
                  className={cn(
                    "grid size-10 place-items-center rounded-xl",
                    metric.accent,
                  )}
                >
                  <AdminIcon className="size-[18px]" name={metric.icon} />
                </span>
                <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-[.65rem] font-bold text-emerald-600">
                  {metric.change}
                </span>
              </div>
              <p className="text-muted-foreground mt-5 text-[.72rem] font-semibold">
                {metric.label}
              </p>
              <p className="text-foreground mt-1 text-2xl font-bold tracking-[-0.04em]">
                {metric.value}
              </p>
              <p className="text-muted-foreground mt-2 text-[.68rem]">
                {metric.description}
              </p>
            </article>
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
                  Active learners across the selected period
                </p>
              </div>
              <div className="bg-surface-subtle flex w-fit rounded-full p-1">
                {PERIODS.map((option) => (
                  <button
                    className={cn(
                      "rounded-full px-3 py-1.5 text-[.68rem] font-semibold transition",
                      period === option.value
                        ? "bg-surface text-primary shadow-sm"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                    key={option.value}
                    onClick={() => setPeriod(option.value)}
                    type="button"
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-5 flex flex-wrap items-end gap-x-6 gap-y-2">
              <div>
                <p className="text-foreground text-3xl font-bold tracking-[-0.05em]">
                  9,842
                </p>
                <p className="text-muted-foreground mt-1 text-[.68rem]">
                  Unique active learners
                </p>
              </div>
              <span className="mb-4 text-xs font-bold text-emerald-600">
                ↗ 14.8% vs previous period
              </span>
            </div>
            <TrendChart period={period} />
          </article>

          <article className="surface-card rounded-[1.5rem] p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-foreground text-base font-bold tracking-[-0.02em]">
                  Needs attention
                </p>
                <p className="text-muted-foreground mt-1 text-xs">
                  Items waiting for an admin
                </p>
              </div>
              <span className="grid size-8 place-items-center rounded-full bg-rose-500/10 text-xs font-bold text-rose-600">
                29
              </span>
            </div>
            <div className="mt-5 divide-y">
              {ATTENTION_ITEMS.map((item) => (
                <Link
                  className="group flex items-center gap-3 py-4 first:pt-1 last:pb-0"
                  href={item.href}
                  key={item.label}
                >
                  <span
                    className={cn("size-2 shrink-0 rounded-full", item.tone)}
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
            <Link
              className="text-primary mt-6 inline-flex items-center gap-2 text-xs font-bold"
              href="/dashboard/notifications"
            >
              View all notifications
              <ArrowIcon />
            </Link>
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
                Details
                <ArrowIcon />
              </Link>
            </div>
            <div className="mt-6 space-y-5">
              {SUBJECTS.map((subject) => (
                <div key={subject.name}>
                  <div className="mb-2 flex items-end justify-between gap-4">
                    <div>
                      <p className="text-foreground text-xs font-bold">
                        {subject.name}
                      </p>
                      <p className="text-muted-foreground mt-0.5 text-[.65rem]">
                        {subject.attempts}
                      </p>
                    </div>
                    <p className="text-foreground text-xs font-bold">
                      {subject.accuracy}%
                    </p>
                  </div>
                  <div className="bg-surface-subtle h-2 overflow-hidden rounded-full">
                    <div
                      className={cn("h-full rounded-full", subject.color)}
                      style={{ width: `${subject.accuracy}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article className="surface-card rounded-[1.5rem] p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-foreground text-base font-bold tracking-[-0.02em]">
                  Recent activity
                </p>
                <p className="text-muted-foreground mt-1 text-xs">
                  Latest events across the platform
                </p>
              </div>
              <button
                aria-label="More activity options"
                className="text-muted-foreground hover:bg-surface-subtle grid size-8 place-items-center rounded-full text-lg"
                type="button"
              >
                ···
              </button>
            </div>
            <div className="mt-4 divide-y">
              {RECENT_ACTIVITY.map((activity) => (
                <div
                  className="flex items-center gap-3 py-3.5"
                  key={activity.title}
                >
                  <span
                    className={cn(
                      "grid size-9 shrink-0 place-items-center rounded-xl",
                      activity.tone,
                    )}
                  >
                    <AdminIcon className="size-4" name={activity.icon} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-foreground truncate text-xs font-bold">
                      {activity.title}
                    </p>
                    <p className="text-muted-foreground mt-1 truncate text-[.66rem]">
                      {activity.meta}
                    </p>
                  </div>
                  <span className="text-muted-foreground text-[.64rem]">
                    {activity.time}
                  </span>
                </div>
              ))}
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
      </div>
    </AdminShell>
  );
}
