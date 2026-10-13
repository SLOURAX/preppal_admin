"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";

import {
  AdminPageHeader,
  MetricCard,
  Pagination,
  SectionCard,
  StatusBadge,
} from "@/components/admin-ui";
import { AdminShell } from "@/components/layout";
import { AdminIcon, Select, type AdminIconName } from "@/components/ui";
import { apiClient } from "@/lib/api/client";

type Period = "1" | "7" | "30" | "0";
type LedgerKind = "Check-in" | "Quiz" | "Referral" | "Weekly goal" | "Other";

interface RewardsResponse {
  generatedAt: string;
  period: Period;
  rules: {
    dailyCheckInXp: number;
    referralXp: number;
    xpPerCoin: number;
    coinValueNgn: number;
    premiumQuizMultiplier: number;
  };
  checkIns: {
    checkedInToday: number;
    xpIssuedToday: number;
    participationRate: number;
    longestActiveStreak: number;
    longestStreakHolders: number;
    daily: Array<{ date: string; label: string; count: number }>;
  };
  goals: {
    distribution: Array<{
      days: number | null;
      label: string;
      count: number;
      percentage: number;
    }>;
    configuredLearners: number;
    completedThisWeek: number;
    completionRate: number;
  };
  ledger: Array<{
    id: string;
    userId: string;
    learner: string;
    email: string;
    amount: number;
    source: string;
    createdAt: string;
    kind: LedgerKind;
    reason: string;
  }>;
}

const PAGE_SIZE = 6;
const number = (value: number) => value.toLocaleString("en-NG");
const timestamp = (value: string) =>
  new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
    hour12: true,
  }).format(new Date(value));
const sourceLabel = (value: string) =>
  value
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

export default function RewardsPage() {
  const [queryText, setQueryText] = useState("");
  const [kind, setKind] = useState("All sources");
  const [period, setPeriod] = useState<Period>("1");
  const [page, setPage] = useState(1);
  const query = useQuery({
    queryKey: ["admin", "rewards", period],
    queryFn: () =>
      apiClient<RewardsResponse>(`/api/v1/admin/rewards?period=${period}`),
  });
  const data = query.data;
  const ledger = useMemo(() => data?.ledger ?? [], [data?.ledger]);
  const filteredLedger = useMemo(() => {
    const normalized = queryText.trim().toLowerCase();
    return ledger.filter((item) => {
      const matchesQuery =
        !normalized ||
        `${item.learner} ${item.email} ${item.reason} ${item.source} ${item.id}`
          .toLowerCase()
          .includes(normalized);
      return matchesQuery && (kind === "All sources" || item.kind === kind);
    });
  }, [kind, ledger, queryText]);
  const totalPages = Math.max(1, Math.ceil(filteredLedger.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const visibleLedger = filteredLedger.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );
  const maxCheckIns = Math.max(
    1,
    ...(data?.checkIns.daily.map((item) => item.count) ?? [1]),
  );
  const rules: ReadonlyArray<{
    label: string;
    value: string;
    detail: string;
    icon: AdminIconName;
    tone: string;
  }> = [
    {
      label: "Daily check-in",
      value: `+${data?.rules.dailyCheckInXp ?? 2} XP`,
      detail: "Awarded once per eligible day",
      icon: "rewards",
      tone: "bg-violet-500/10 text-violet-600",
    },
    {
      label: "Verified referral",
      value: `+${data?.rules.referralXp ?? 50} XP`,
      detail: "Awarded after email verification",
      icon: "users",
      tone: "bg-blue-500/10 text-blue-600",
    },
    {
      label: "XP conversion",
      value: `${data?.rules.xpPerCoin ?? 50} XP = 1 coin`,
      detail: `One coin is worth ₦${number(data?.rules.coinValueNgn ?? 1000)}`,
      icon: "finance",
      tone: "bg-amber-500/10 text-amber-600",
    },
    {
      label: "Premium learning",
      value: `${data?.rules.premiumQuizMultiplier ?? 2}× quiz XP`,
      detail: "Applied to eligible quiz activity",
      icon: "analytics",
      tone: "bg-emerald-500/10 text-emerald-600",
    },
  ];

  return (
    <AdminShell>
      <div className="mx-auto w-full max-w-[1420px] space-y-5">
        <AdminPageHeader
          actions={
            <Select
              className="border-border bg-surface text-foreground h-9 rounded-xl border px-3 text-[.65rem] font-semibold outline-none"
              onChange={(event) => {
                setPeriod(event.target.value as Period);
                setPage(1);
              }}
              value={period}
            >
              <option value="1">Today</option>
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="0">All time</option>
            </Select>
          }
          description="Live XP, streak, weekly-goal, referral, and conversion data from the learner platform."
          eyebrow="Engagement"
          title="Rewards and goals"
        />

        {query.isLoading ? (
          <div className="text-muted-foreground flex min-h-64 items-center justify-center gap-2 text-xs">
            <span className="border-primary size-5 animate-spin rounded-full border-2 border-t-transparent" />
            Loading reward activity…
          </div>
        ) : query.isError || !data ? (
          <SectionCard title="Reward data is unavailable">
            <div className="py-8 text-center">
              <p className="text-muted-foreground text-xs">
                The live reward records could not be loaded.
              </p>
              <button
                className="text-primary mt-3 text-xs font-bold"
                onClick={() => query.refetch()}
                type="button"
              >
                Try again
              </button>
            </div>
          </SectionCard>
        ) : (
          <>
            <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {rules.map((rule) => (
                <MetricCard
                  accent={rule.tone}
                  detail={rule.detail}
                  icon={rule.icon}
                  key={rule.label}
                  label={rule.label}
                  value={rule.value}
                />
              ))}
            </section>

            <section className="grid gap-5 xl:grid-cols-[1.1fr_.9fr]">
              <SectionCard
                actions={<StatusBadge tone="success">Live</StatusBadge>}
                description="Daily participation and current streak health from recorded check-ins."
                title="Check-in activity"
              >
                <div className="grid gap-3 sm:grid-cols-3">
                  {[
                    [
                      "Checked in today",
                      number(data.checkIns.checkedInToday),
                      `${data.checkIns.participationRate}% of active learners`,
                    ],
                    [
                      "XP issued today",
                      `${number(data.checkIns.xpIssuedToday)} XP`,
                      `+${data.rules.dailyCheckInXp} XP per check-in`,
                    ],
                    [
                      "Longest active streak",
                      `${number(data.checkIns.longestActiveStreak)} days`,
                      `Maintained by ${number(data.checkIns.longestStreakHolders)} learner${data.checkIns.longestStreakHolders === 1 ? "" : "s"}`,
                    ],
                  ].map(([label, value, detail]) => (
                    <div
                      className="border-border bg-surface-subtle/55 rounded-xl border p-3"
                      key={label}
                    >
                      <p className="text-muted-foreground text-[.6rem] font-semibold">
                        {label}
                      </p>
                      <p className="text-foreground mt-1.5 text-base font-bold">
                        {value}
                      </p>
                      <p className="text-muted-foreground mt-1 text-[.58rem]">
                        {detail}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 grid grid-cols-7 gap-2">
                  {data.checkIns.daily.map((item) => (
                    <div className="text-center" key={item.date}>
                      <div className="bg-surface-subtle flex h-24 items-end overflow-hidden rounded-lg">
                        <div
                          className="from-primary to-primary/60 w-full rounded-t-md bg-gradient-to-t"
                          style={{
                            height: `${item.count ? Math.max(8, (item.count / maxCheckIns) * 100) : 0}%`,
                          }}
                          title={`${number(item.count)} check-ins`}
                        />
                      </div>
                      <p className="text-muted-foreground mt-1.5 text-[.55rem]">
                        {item.label}
                      </p>
                    </div>
                  ))}
                </div>
              </SectionCard>

              <SectionCard
                description="How learner profiles are configured for the current week."
                title="Weekly goal distribution"
              >
                <div className="space-y-4">
                  {data.goals.distribution.map((goal) => (
                    <div key={goal.label}>
                      <div className="mb-1.5 flex items-center justify-between gap-3">
                        <p className="text-foreground text-[.66rem] font-bold">
                          {goal.label}
                        </p>
                        <p className="text-muted-foreground text-[.58rem]">
                          {number(goal.count)} learners · {goal.percentage}%
                        </p>
                      </div>
                      <div className="bg-surface-subtle h-2 overflow-hidden rounded-full">
                        <div
                          className="bg-primary h-full rounded-full"
                          style={{ width: `${goal.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="border-border mt-5 grid grid-cols-2 gap-3 border-t pt-4">
                  <div>
                    <p className="text-muted-foreground text-[.58rem]">
                      Goals completed this week
                    </p>
                    <p className="text-foreground mt-1 text-lg font-bold">
                      {number(data.goals.completedThisWeek)}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-[.58rem]">
                      Current completion rate
                    </p>
                    <p className="text-foreground mt-1 text-lg font-bold">
                      {data.goals.completionRate}%
                    </p>
                  </div>
                </div>
              </SectionCard>
            </section>

            <SectionCard
              description={`Latest ${period === "0" ? "all-time" : period === "1" ? "today's" : `${period}-day`} XP awards. Showing up to 250 recent records.`}
              title="XP issuance ledger"
            >
              <div className="border-border mb-2 grid gap-2 border-y py-3 md:grid-cols-[1fr_190px_auto]">
                <input
                  className="border-border bg-background text-foreground placeholder:text-muted-foreground focus:border-primary h-9 rounded-xl border px-3 text-[.67rem] outline-none"
                  onChange={(event) => {
                    setQueryText(event.target.value);
                    setPage(1);
                  }}
                  placeholder="Search learner, email, source, or ledger ID"
                  value={queryText}
                />
                <Select
                  className="border-border bg-background text-foreground h-9 rounded-xl border px-3 text-[.65rem] outline-none"
                  onChange={(event) => {
                    setKind(event.target.value);
                    setPage(1);
                  }}
                  value={kind}
                >
                  {[
                    "All sources",
                    "Check-in",
                    "Quiz",
                    "Referral",
                    "Weekly goal",
                    "Other",
                  ].map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </Select>
                <button
                  className="text-primary hover:bg-primary/10 h-9 rounded-xl px-3 text-[.63rem] font-bold"
                  onClick={() => {
                    setQueryText("");
                    setKind("All sources");
                    setPage(1);
                  }}
                  type="button"
                >
                  Reset filters
                </button>
              </div>

              <div className="divide-border divide-y">
                {visibleLedger.map((item) => (
                  <article
                    className="flex items-center gap-3 py-3"
                    key={item.id}
                  >
                    <span className="bg-primary/10 text-primary grid size-9 shrink-0 place-items-center rounded-xl">
                      <AdminIcon className="size-4" name="rewards" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-foreground text-[.68rem] font-bold">
                          {item.learner}
                        </p>
                        <StatusBadge tone="neutral">{item.kind}</StatusBadge>
                      </div>
                      <p className="text-muted-foreground mt-1 truncate text-[.59rem]">
                        {item.reason} · {sourceLabel(item.source)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-success text-[.68rem] font-bold">
                        +{number(item.amount)} XP
                      </p>
                      <p className="text-muted-foreground mt-1 text-[.55rem]">
                        {timestamp(item.createdAt)} · {item.id.slice(0, 8)}
                      </p>
                    </div>
                  </article>
                ))}
              </div>

              {!visibleLedger.length ? (
                <div className="py-10 text-center">
                  <p className="text-foreground text-xs font-bold">
                    No matching XP records
                  </p>
                  <p className="text-muted-foreground mt-1 text-[.62rem]">
                    No awards match this period and filter combination.
                  </p>
                </div>
              ) : null}

              <Pagination
                currentPage={currentPage}
                itemLabel="XP records"
                onPageChange={setPage}
                pageSize={PAGE_SIZE}
                totalItems={filteredLedger.length}
                totalPages={totalPages}
              />
            </SectionCard>
          </>
        )}
      </div>
    </AdminShell>
  );
}
