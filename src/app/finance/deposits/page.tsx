"use client";

import { useMemo, useState } from "react";
import { AdminShell } from "@/components/layout";

type DepositStatus = "Completed" | "Pending" | "Failed";

interface Deposit {
  readonly id: string;
  readonly user: string;
  readonly email: string;
  readonly coins: number;
  readonly amount: number;
  readonly source: string;
  readonly reference: string;
  readonly depositedAt: string;
  status: DepositStatus;
}

const INITIAL_DEPOSITS: Deposit[] = [
  {
    id: "DP-3088",
    user: "Chinedu Eze",
    email: "chinedu.eze@example.com",
    coins: 2680,
    amount: 2680,
    source: "Coin conversion",
    reference: "CNV-8F21",
    depositedAt: "2026-09-09",
    status: "Completed",
  },
  {
    id: "DP-3087",
    user: "Amaka Okafor",
    email: "amaka.okafor@example.com",
    coins: 1240,
    amount: 1240,
    source: "Admin credit",
    reference: "ADM-4821",
    depositedAt: "2026-09-09",
    status: "Completed",
  },
  {
    id: "DP-3086",
    user: "Samuel Adeyemi",
    email: "samuel.adeyemi@example.com",
    coins: 300,
    amount: 300,
    source: "Reward adjustment",
    reference: "RWD-9130",
    depositedAt: "2026-09-08",
    status: "Pending",
  },
  {
    id: "DP-3085",
    user: "Ifeoma Nwosu",
    email: "ifeoma.nwosu@example.com",
    coins: 1760,
    amount: 1760,
    source: "Coin conversion",
    reference: "CNV-7740",
    depositedAt: "2026-09-07",
    status: "Completed",
  },
  {
    id: "DP-3084",
    user: "Daniel Kalu",
    email: "daniel.kalu@example.com",
    coins: 530,
    amount: 530,
    source: "Admin credit",
    reference: "ADM-3388",
    depositedAt: "2026-09-06",
    status: "Failed",
  },
  {
    id: "DP-3083",
    user: "Yusuf Ibrahim",
    email: "yusuf.ibrahim@example.com",
    coins: 840,
    amount: 840,
    source: "Coin conversion",
    reference: "CNV-2516",
    depositedAt: "2026-09-05",
    status: "Completed",
  },
  {
    id: "DP-3082",
    user: "Fatima Abdullahi",
    email: "fatima.abdullahi@example.com",
    coins: 950,
    amount: 950,
    source: "Reward adjustment",
    reference: "RWD-1120",
    depositedAt: "2026-08-28",
    status: "Completed",
  },
  {
    id: "DP-3081",
    user: "Amaka Okafor",
    email: "amaka.okafor@example.com",
    coins: 5000,
    amount: 5000,
    source: "Cash deposit",
    reference: "PAY-7A42",
    depositedAt: "2026-08-25",
    status: "Completed",
  },
  {
    id: "DP-3080",
    user: "Michael Tunde",
    email: "michael.tunde@example.com",
    coins: 2200,
    amount: 2200,
    source: "Cash deposit",
    reference: "PAY-2C18",
    depositedAt: "2026-08-22",
    status: "Pending",
  },
];

const STATUS_OPTIONS = [
  "All statuses",
  "Completed",
  "Pending",
  "Failed",
] as const;
const SOURCE_OPTIONS = [
  "All sources",
  "Cash deposit",
  "Coin conversion",
  "Admin credit",
  "Reward adjustment",
] as const;
const RANGE_OPTIONS = [
  "All time",
  "Today",
  "Last 7 days",
  "Last 30 days",
] as const;
const PAGE_SIZE = 5;

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(amount);

const formatDate = (date: string) =>
  new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date));

const initials = (name: string) =>
  name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("");

function StatusBadge({ status }: { readonly status: DepositStatus }) {
  const styles: Record<DepositStatus, string> = {
    Completed: "bg-emerald-500/10 text-emerald-700",
    Pending: "bg-amber-500/10 text-amber-700",
    Failed: "bg-rose-500/10 text-rose-700",
  };
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${styles[status]}`}
    >
      {status}
    </span>
  );
}

export default function DepositsPage() {
  const [deposits, setDeposits] = useState(INITIAL_DEPOSITS);
  const [query, setQuery] = useState("");
  const [status, setStatus] =
    useState<(typeof STATUS_OPTIONS)[number]>("All statuses");
  const [source, setSource] =
    useState<(typeof SOURCE_OPTIONS)[number]>("All sources");
  const [range, setRange] =
    useState<(typeof RANGE_OPTIONS)[number]>("All time");
  const [page, setPage] = useState(1);
  const [now] = useState(() => Date.now());

  const filteredDeposits = useMemo(() => {
    const days =
      range === "Today"
        ? 1
        : range === "Last 7 days"
          ? 7
          : range === "Last 30 days"
            ? 30
            : 0;
    const cutoff = days ? now - days * 86400000 : 0;
    const normalized = query.trim().toLowerCase();
    return deposits.filter((deposit) => {
      const matchesQuery =
        !normalized ||
        `${deposit.id} ${deposit.user} ${deposit.email} ${deposit.reference}`
          .toLowerCase()
          .includes(normalized);
      const matchesStatus =
        status === "All statuses" || deposit.status === status;
      const matchesSource =
        source === "All sources" || deposit.source === source;
      const matchesRange =
        !cutoff || new Date(deposit.depositedAt).getTime() >= cutoff;
      return matchesQuery && matchesStatus && matchesSource && matchesRange;
    });
  }, [deposits, now, query, range, source, status]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredDeposits.length / PAGE_SIZE),
  );
  const currentPage = Math.min(page, totalPages);
  const visibleDeposits = filteredDeposits.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );
  const pending = deposits.filter((item) => item.status === "Pending");
  const completed = deposits.filter((item) => item.status === "Completed");
  const updateStatus = (id: string, nextStatus: DepositStatus) =>
    setDeposits((items) =>
      items.map((item) =>
        item.id === id ? { ...item, status: nextStatus } : item,
      ),
    );
  const resetPage = () => setPage(1);

  return (
    <AdminShell>
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h1 className="mt-4 text-3xl font-bold tracking-tight">Deposits &amp; credits</h1>
            <p className="text-muted-foreground mt-2 max-w-2xl text-sm">
              Track cash deposits, coin conversions, and account credits in one auditable ledger. These events increase a user’s withdrawable coin balance; XP activity is recorded separately.
            </p>
          </div>
          <span className="rounded-full bg-amber-500/10 px-3 py-2 text-xs font-semibold text-amber-700">
            {pending.length} needs attention
          </span>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            [
              "Total credited",
              formatCurrency(
                completed.reduce((sum, item) => sum + item.amount, 0),
              ),
              `${completed.reduce((sum, item) => sum + item.coins, 0).toLocaleString()} coins`,
              "green",
            ],
            [
              "Completed deposits",
              completed.length.toString(),
              "Successfully settled",
              "purple",
            ],
            [
              "Pending review",
              pending.length.toString(),
              formatCurrency(
                pending.reduce((sum, item) => sum + item.amount, 0),
              ),
              "amber",
            ],
            ["Coin rate", "1 coin", "= ₦1 wallet value", "blue"],
          ].map(([label, value, detail, tone]) => (
            <article className="surface-card rounded-2xl p-5" key={label}>
              <div
                className={`mb-4 size-2 rounded-full ${tone === "amber" ? "bg-amber-500" : tone === "green" ? "bg-emerald-500" : tone === "blue" ? "bg-blue-500" : "bg-primary"}`}
              />
              <p className="text-muted-foreground text-xs font-medium">
                {label}
              </p>
              <p className="mt-2 text-2xl font-bold tracking-tight">{value}</p>
              <p className="text-muted-foreground mt-1 text-xs">{detail}</p>
            </article>
          ))}
        </section>

        <section className="surface-card overflow-hidden rounded-2xl">
          <div className="border-border flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <div>
              <h2 className="font-semibold">Deposit ledger</h2>
              <p className="text-muted-foreground mt-1 text-xs">
                Every credit should have a traceable source and reference.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <input
                aria-label="Search deposits"
                className="border-border bg-background placeholder:text-muted-foreground focus:border-primary h-9 min-w-44 rounded-lg border px-3 text-xs outline-none"
                onChange={(event) => {
                  setQuery(event.target.value);
                  resetPage();
                }}
                placeholder="Search user or reference"
                value={query}
              />
              <select
                className="border-border bg-background h-9 rounded-lg border px-2.5 text-xs"
                onChange={(event) => {
                  setStatus(
                    event.target.value as (typeof STATUS_OPTIONS)[number],
                  );
                  resetPage();
                }}
                value={status}
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
              <select
                className="border-border bg-background h-9 rounded-lg border px-2.5 text-xs"
                onChange={(event) => {
                  setSource(
                    event.target.value as (typeof SOURCE_OPTIONS)[number],
                  );
                  resetPage();
                }}
                value={source}
              >
                {SOURCE_OPTIONS.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
              <select
                className="border-border bg-background h-9 rounded-lg border px-2.5 text-xs"
                onChange={(event) => {
                  setRange(
                    event.target.value as (typeof RANGE_OPTIONS)[number],
                  );
                  resetPage();
                }}
                value={range}
              >
                {RANGE_OPTIONS.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </div>
          </div>

          {visibleDeposits.length ? (
            <>
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full text-left text-sm">
                  <thead className="bg-surface-subtle/60 text-muted-foreground text-xs">
                    <tr>
                      <th className="px-5 py-3 font-semibold">Recipient</th>
                      <th className="px-5 py-3 font-semibold">Credit</th>
                      <th className="px-5 py-3 font-semibold">Source</th>
                      <th className="px-5 py-3 font-semibold">Deposited</th>
                      <th className="px-5 py-3 font-semibold">Status</th>
                      <th className="px-5 py-3 text-right font-semibold">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-border divide-y">
                    {visibleDeposits.map((item) => (
                      <tr className="hover:bg-surface-subtle/30" key={item.id}>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <span className="bg-primary/10 text-primary grid size-9 place-items-center rounded-xl text-xs font-bold">
                              {initials(item.user)}
                            </span>
                            <div>
                              <p className="font-semibold">{item.user}</p>
                              <p className="text-muted-foreground mt-0.5 text-xs">
                                {item.id} · {item.email}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <p className="font-semibold">
                            {item.coins.toLocaleString()} coins
                          </p>
                          <p className="text-muted-foreground mt-0.5 text-xs">
                            {formatCurrency(item.amount)}
                          </p>
                        </td>
                        <td className="px-5 py-4">
                          <p className="text-xs font-medium">{item.source}</p>
                          <p className="text-muted-foreground mt-0.5 text-xs">
                            {item.reference}
                          </p>
                        </td>
                        <td className="text-muted-foreground px-5 py-4 text-xs">
                          {formatDate(item.depositedAt)}
                        </td>
                        <td className="px-5 py-4">
                          <StatusBadge status={item.status} />
                        </td>
                        <td className="px-5 py-4 text-right">
                          {item.status === "Pending" ? (
                            <div className="inline-flex gap-2">
                              <button
                                className="border-danger text-danger hover:bg-danger/5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold"
                                onClick={() => updateStatus(item.id, "Failed")}
                              >
                                Reject
                              </button>
                              <button
                                className="bg-primary text-primary-foreground hover:bg-primary-strong rounded-lg px-2.5 py-1.5 text-xs font-semibold"
                                onClick={() =>
                                  updateStatus(item.id, "Completed")
                                }
                              >
                                Confirm
                              </button>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-xs">
                              Recorded
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="divide-border divide-y md:hidden">
                {visibleDeposits.map((item) => (
                  <article className="space-y-3 p-4" key={item.id}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="bg-primary/10 text-primary grid size-9 place-items-center rounded-xl text-xs font-bold">
                          {initials(item.user)}
                        </span>
                        <div>
                          <p className="text-sm font-semibold">{item.user}</p>
                          <p className="text-muted-foreground text-[11px]">
                            {item.id} · {formatDate(item.depositedAt)}
                          </p>
                        </div>
                      </div>
                      <StatusBadge status={item.status} />
                    </div>
                    <div className="bg-surface-subtle/60 flex items-center justify-between rounded-xl px-3 py-2">
                      <div>
                        <p className="text-muted-foreground text-[11px]">
                          Credit
                        </p>
                        <p className="text-sm font-bold">
                          {item.coins.toLocaleString()} coins
                        </p>
                      </div>
                      <p className="text-muted-foreground text-right text-xs">
                        {item.source}
                        <br />
                        {item.reference}
                      </p>
                    </div>
                    {item.status === "Pending" ? (
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          className="border-danger text-danger hover:bg-danger/5 rounded-lg border py-2 text-xs font-semibold"
                          onClick={() => updateStatus(item.id, "Failed")}
                        >
                          Reject
                        </button>
                        <button
                          className="bg-primary text-primary-foreground hover:bg-primary-strong rounded-lg py-2 text-xs font-semibold"
                          onClick={() => updateStatus(item.id, "Completed")}
                        >
                          Confirm
                        </button>
                      </div>
                    ) : null}
                  </article>
                ))}
              </div>
              {totalPages > 1 ? (
                <div className="border-border flex items-center justify-between border-t p-4">
                  <button
                    className="text-muted-foreground text-xs font-semibold disabled:opacity-40"
                    disabled={currentPage === 1}
                    onClick={() => setPage((value) => Math.max(1, value - 1))}
                  >
                    ← Previous
                  </button>
                  <span className="text-muted-foreground text-xs">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    className="text-primary text-xs font-semibold disabled:opacity-40"
                    disabled={currentPage === totalPages}
                    onClick={() =>
                      setPage((value) => Math.min(totalPages, value + 1))
                    }
                  >
                    Next →
                  </button>
                </div>
              ) : null}
            </>
          ) : (
            <div className="p-12 text-center">
              <p className="font-semibold">No deposits found</p>
              <p className="text-muted-foreground mt-1 text-sm">
                Try changing your filters or search term.
              </p>
            </div>
          )}
        </section>
        <p className="text-muted-foreground text-xs">
          Keep a source and reference for every balance change so wallet
          reconciliation remains auditable when payment and rewards services are
          connected.
        </p>
      </div>
    </AdminShell>
  );
}
