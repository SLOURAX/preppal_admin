"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AdminShell } from "@/components/layout";

type UserStatus = "Active" | "Suspended" | "Pending";
type UserPlan = "Free" | "Premium";

interface AdminUser {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly status: UserStatus;
  readonly plan: UserPlan;
  readonly xp: number;
  readonly coins: number;
  readonly quizzes: number;
  readonly lastActive: string;
  readonly joinedAt: string;
}

const USERS: readonly AdminUser[] = [
  {
    id: "PP-10482",
    name: "Amaka Okafor",
    email: "amaka.okafor@example.com",
    status: "Active",
    plan: "Premium",
    xp: 8420,
    coins: 1240,
    quizzes: 86,
    lastActive: "2026-09-08",
    joinedAt: "2026-08-12",
  },
  {
    id: "PP-10481",
    name: "Daniel Kalu",
    email: "daniel.kalu@example.com",
    status: "Active",
    plan: "Free",
    xp: 4160,
    coins: 530,
    quizzes: 42,
    lastActive: "2026-09-08",
    joinedAt: "2026-08-28",
  },
  {
    id: "PP-10480",
    name: "Fatima Abdullahi",
    email: "fatima.abdullahi@example.com",
    status: "Pending",
    plan: "Free",
    xp: 240,
    coins: 0,
    quizzes: 2,
    lastActive: "2026-09-07",
    joinedAt: "2026-09-07",
  },
  {
    id: "PP-10479",
    name: "Chinedu Eze",
    email: "chinedu.eze@example.com",
    status: "Active",
    plan: "Premium",
    xp: 12650,
    coins: 2680,
    quizzes: 124,
    lastActive: "2026-09-06",
    joinedAt: "2026-07-19",
  },
  {
    id: "PP-10478",
    name: "Blessing Adebayo",
    email: "blessing.adebayo@example.com",
    status: "Suspended",
    plan: "Free",
    xp: 1900,
    coins: 120,
    quizzes: 18,
    lastActive: "2026-08-31",
    joinedAt: "2026-06-03",
  },
  {
    id: "PP-10477",
    name: "Yusuf Ibrahim",
    email: "yusuf.ibrahim@example.com",
    status: "Active",
    plan: "Free",
    xp: 6780,
    coins: 840,
    quizzes: 61,
    lastActive: "2026-09-05",
    joinedAt: "2026-08-06",
  },
  {
    id: "PP-10476",
    name: "Ifeoma Nwosu",
    email: "ifeoma.nwosu@example.com",
    status: "Active",
    plan: "Premium",
    xp: 9340,
    coins: 1760,
    quizzes: 97,
    lastActive: "2026-09-04",
    joinedAt: "2026-07-28",
  },
  {
    id: "PP-10475",
    name: "Samuel Adeyemi",
    email: "samuel.adeyemi@example.com",
    status: "Active",
    plan: "Free",
    xp: 3280,
    coins: 300,
    quizzes: 33,
    lastActive: "2026-09-02",
    joinedAt: "2026-08-15",
  },
] as const;

const STATUS_OPTIONS = [
  "All statuses",
  "Active",
  "Pending",
  "Suspended",
] as const;
const PLAN_OPTIONS = ["All plans", "Free", "Premium"] as const;
const RANGE_OPTIONS = [
  "All time",
  "Today",
  "Last 7 days",
  "Last 30 days",
] as const;
const PAGE_SIZE = 5;

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));

const initials = (name: string) =>
  name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("");

function StatusBadge({ status }: { readonly status: UserStatus }) {
  const styles: Record<UserStatus, string> = {
    Active: "bg-emerald-500/10 text-emerald-700",
    Pending: "bg-amber-500/10 text-amber-700",
    Suspended: "bg-rose-500/10 text-rose-700",
  };
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${styles[status]}`}
    >
      {status}
    </span>
  );
}

function UserAvatar({ name }: { readonly name: string }) {
  return (
    <span className="bg-primary/10 text-primary grid size-9 shrink-0 place-items-center rounded-xl text-xs font-bold">
      {initials(name)}
    </span>
  );
}

export default function UsersPage() {
  const [query, setQuery] = useState("");
  const [status, setStatus] =
    useState<(typeof STATUS_OPTIONS)[number]>("All statuses");
  const [plan, setPlan] = useState<(typeof PLAN_OPTIONS)[number]>("All plans");
  const [range, setRange] =
    useState<(typeof RANGE_OPTIONS)[number]>("All time");
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [page, setPage] = useState(1);
  const [now] = useState(() => Date.now());

  const filteredUsers = useMemo(() => {
    const rangeDays =
      range === "Today"
        ? 1
        : range === "Last 7 days"
          ? 7
          : range === "Last 30 days"
            ? 30
            : 0;
    const cutoff = rangeDays ? now - rangeDays * 86400000 : 0;
    const normalizedQuery = query.trim().toLowerCase();
    return USERS.filter((user) => {
      const matchesQuery =
        !normalizedQuery ||
        `${user.name} ${user.email} ${user.id}`
          .toLowerCase()
          .includes(normalizedQuery);
      const matchesStatus = status === "All statuses" || user.status === status;
      const matchesPlan = plan === "All plans" || user.plan === plan;
      const matchesRange =
        !cutoff || new Date(user.joinedAt).getTime() >= cutoff;
      return matchesQuery && matchesStatus && matchesPlan && matchesRange;
    });
  }, [now, plan, query, range, status]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const visibleUsers = useMemo(
    () =>
      filteredUsers.slice(
        (currentPage - 1) * PAGE_SIZE,
        currentPage * PAGE_SIZE,
      ),
    [currentPage, filteredUsers],
  );

  const metrics = [
    [
      "Total users",
      USERS.length.toLocaleString(),
      "All registered accounts",
      "↗",
    ],
    [
      "Active users",
      USERS.filter((user) => user.status === "Active").length.toLocaleString(),
      "Currently in good standing",
      "●",
    ],
    [
      "Premium members",
      USERS.filter((user) => user.plan === "Premium").length.toLocaleString(),
      "Active subscriptions",
      "◆",
    ],
    [
      "New this month",
      USERS.filter(
        (user) => user.joinedAt >= "2026-09-01",
      ).length.toLocaleString(),
      "Joined since Sep 1",
      "+",
    ],
  ] as const;

  return (
    <AdminShell>
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <Link
              className="text-muted-foreground hover:text-primary text-xs font-medium"
              href="/dashboard"
            >
              ← Overview
            </Link>
            <div className="mt-4 flex items-center gap-3">
              <span className="bg-primary/10 text-primary grid size-11 place-items-center rounded-2xl text-lg">
                ♙
              </span>
              <div>
                <h1 className="text-foreground text-2xl font-bold tracking-tight sm:text-3xl">
                  Users
                </h1>
                <p className="text-muted-foreground mt-1 text-sm">
                  Understand your learner base and inspect account details.
                </p>
              </div>
            </div>
          </div>
          <span className="bg-success/10 text-success rounded-full px-3 py-1.5 text-xs font-semibold">
            Live directory
          </span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {metrics.map(([label, value, detail, icon]) => (
            <article className="surface-card p-4 sm:p-5" key={label}>
              <div className="flex items-start justify-between gap-3">
                <p className="text-muted-foreground text-xs font-medium">
                  {label}
                </p>
                <span className="text-primary bg-primary/10 grid size-7 place-items-center rounded-lg text-xs font-bold">
                  {icon}
                </span>
              </div>
              <p className="text-foreground mt-3 text-2xl font-bold">{value}</p>
              <p className="text-muted-foreground mt-1 text-[11px]">{detail}</p>
            </article>
          ))}
        </div>

        <section className="surface-card overflow-hidden">
          <div className="border-border border-b p-4 sm:p-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-foreground font-semibold">
                  User directory
                </h2>
                <p className="text-muted-foreground mt-1 text-xs">
                  Search and filter registered learners before opening their
                  profile.
                </p>
              </div>
              <div className="relative w-full lg:max-w-xs">
                <span className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm">
                  ⌕
                </span>
                <input
                  className="border-border bg-background text-foreground placeholder:text-muted-foreground focus:border-primary h-10 w-full rounded-xl border pr-3 pl-9 text-xs transition-colors outline-none"
                  onChange={(event) => {
                    setQuery(event.target.value);
                    setPage(1);
                  }}
                  placeholder="Search name, email or ID"
                  value={query}
                />
              </div>
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              <select
                className="border-border bg-background text-foreground h-9 rounded-lg border px-3 text-xs outline-none"
                onChange={(event) => {
                  setStatus(
                    event.target.value as (typeof STATUS_OPTIONS)[number],
                  );
                  setPage(1);
                }}
                value={status}
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
              <select
                className="border-border bg-background text-foreground h-9 rounded-lg border px-3 text-xs outline-none"
                onChange={(event) => {
                  setPlan(event.target.value as (typeof PLAN_OPTIONS)[number]);
                  setPage(1);
                }}
                value={plan}
              >
                {PLAN_OPTIONS.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
              <select
                className="border-border bg-background text-foreground h-9 rounded-lg border px-3 text-xs outline-none"
                onChange={(event) => {
                  setRange(
                    event.target.value as (typeof RANGE_OPTIONS)[number],
                  );
                  setPage(1);
                }}
                value={range}
              >
                {RANGE_OPTIONS.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="border-border flex items-center justify-between border-b px-4 py-3 sm:px-5">
            <p className="text-muted-foreground text-xs">
              <span className="text-foreground font-semibold">
                {filteredUsers.length}
              </span>{" "}
              of {USERS.length} users
            </p>
            <button
              className="text-primary text-xs font-semibold"
              onClick={() => {
                setQuery("");
                setStatus("All statuses");
                setPlan("All plans");
                setRange("All time");
                setPage(1);
              }}
              type="button"
            >
              Reset filters
            </button>
          </div>

          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[820px] text-left">
              <thead className="bg-surface-subtle/60 text-muted-foreground text-[11px] font-semibold uppercase">
                <tr>
                  <th className="px-5 py-3">User</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Plan</th>
                  <th className="px-4 py-3">XP / coins</th>
                  <th className="px-4 py-3">Quizzes</th>
                  <th className="px-4 py-3">Last active</th>
                  <th className="px-5 py-3 text-right">Profile</th>
                </tr>
              </thead>
              <tbody className="divide-border divide-y">
                {visibleUsers.map((user) => (
                  <tr
                    className="hover:bg-surface-subtle/50 transition-colors"
                    key={user.id}
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <UserAvatar name={user.name} />
                        <div>
                          <p className="text-foreground text-xs font-semibold">
                            {user.name}
                          </p>
                          <p className="text-muted-foreground mt-0.5 text-[11px]">
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <StatusBadge status={user.status} />
                    </td>
                    <td className="text-foreground px-4 py-4 text-xs">
                      {user.plan}
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-foreground text-xs font-semibold">
                        {user.xp.toLocaleString()} XP
                      </p>
                      <p className="text-muted-foreground mt-0.5 text-[11px]">
                        {user.coins.toLocaleString()} coins
                      </p>
                    </td>
                    <td className="text-foreground px-4 py-4 text-xs">
                      {user.quizzes}
                    </td>
                    <td className="text-muted-foreground px-4 py-4 text-xs">
                      {formatDate(user.lastActive)}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        className="text-primary hover:bg-primary/10 rounded-lg px-2.5 py-1.5 text-xs font-semibold"
                        onClick={() => setSelectedUser(user)}
                        type="button"
                      >
                        View profile
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="divide-border divide-y md:hidden">
            {visibleUsers.map((user) => (
              <button
                className="flex w-full items-center gap-3 px-4 py-4 text-left"
                key={user.id}
                onClick={() => setSelectedUser(user)}
                type="button"
              >
                <UserAvatar name={user.name} />
                <span className="min-w-0 flex-1">
                  <span className="text-foreground block truncate text-xs font-semibold">
                    {user.name}
                  </span>
                  <span className="text-muted-foreground mt-0.5 block truncate text-[11px]">
                    {user.email}
                  </span>
                </span>
                <StatusBadge status={user.status} />
                <span className="text-muted-foreground text-lg">›</span>
              </button>
            ))}
          </div>

          {!filteredUsers.length && (
            <div className="text-muted-foreground p-10 text-center text-sm">
              No users match the current filters.
            </div>
          )}

          {filteredUsers.length > 0 && totalPages > 1 && (
            <div className="border-border flex flex-col gap-3 border-t px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <p className="text-muted-foreground text-xs">
                Showing {(currentPage - 1) * PAGE_SIZE + 1}–
                {Math.min(currentPage * PAGE_SIZE, filteredUsers.length)} of{" "}
                {filteredUsers.length}
              </p>
              <div
                className="flex items-center gap-1.5"
                aria-label="User directory pagination"
              >
                <button
                  className="border-border text-muted-foreground hover:bg-surface-subtle rounded-lg border px-2.5 py-1.5 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-40"
                  disabled={currentPage === 1}
                  onClick={() => setPage((value) => Math.max(1, value - 1))}
                  type="button"
                >
                  Previous
                </button>
                {Array.from(
                  { length: totalPages },
                  (_, index) => index + 1,
                ).map((pageNumber) => (
                  <button
                    aria-current={
                      currentPage === pageNumber ? "page" : undefined
                    }
                    className={`size-8 rounded-lg text-xs font-semibold ${currentPage === pageNumber ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-surface-subtle"}`}
                    key={pageNumber}
                    onClick={() => setPage(pageNumber)}
                    type="button"
                  >
                    {pageNumber}
                  </button>
                ))}
                <button
                  className="border-border text-muted-foreground hover:bg-surface-subtle rounded-lg border px-2.5 py-1.5 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-40"
                  disabled={currentPage === totalPages}
                  onClick={() =>
                    setPage((value) => Math.min(totalPages, value + 1))
                  }
                  type="button"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </section>

        {selectedUser ? (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 p-4 backdrop-blur-sm lg:left-64"
            onClick={() => setSelectedUser(null)}
            role="presentation"
          >
            <section
              className="bg-surface w-full max-w-lg rounded-2xl p-5 shadow-2xl sm:p-6"
              onClick={(event) => event.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-label={`${selectedUser.name} profile`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <UserAvatar name={selectedUser.name} />
                  <div>
                    <h2 className="text-foreground font-semibold">
                      {selectedUser.name}
                    </h2>
                    <p className="text-muted-foreground mt-0.5 text-xs">
                      {selectedUser.id} · Joined{" "}
                      {formatDate(selectedUser.joinedAt)}
                    </p>
                  </div>
                </div>
                <button
                  className="text-muted-foreground hover:text-foreground text-xl"
                  onClick={() => setSelectedUser(null)}
                  type="button"
                >
                  ×
                </button>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  ["Status", selectedUser.status],
                  ["Plan", selectedUser.plan],
                  ["XP", selectedUser.xp.toLocaleString()],
                  ["Coins", selectedUser.coins.toLocaleString()],
                ].map(([label, value]) => (
                  <div className="bg-surface-subtle rounded-xl p-3" key={label}>
                    <p className="text-muted-foreground text-[10px] uppercase">
                      {label}
                    </p>
                    <p className="text-foreground mt-1 text-sm font-semibold">
                      {value}
                    </p>
                  </div>
                ))}
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-muted-foreground text-xs">Email address</p>
                  <p className="text-foreground mt-1 text-sm font-medium">
                    {selectedUser.email}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Last active</p>
                  <p className="text-foreground mt-1 text-sm font-medium">
                    {formatDate(selectedUser.lastActive)}
                  </p>
                </div>
              </div>
              <p className="text-muted-foreground mt-5 border-t pt-4 text-xs">
                User actions such as suspension, crediting, and wallet
                adjustments will be available from this profile in the next
                admin phase.
              </p>
              <button
                className="bg-primary text-primary-foreground mt-5 w-full rounded-xl py-2.5 text-sm font-semibold"
                onClick={() => setSelectedUser(null)}
                type="button"
              >
                Close profile
              </button>
            </section>
          </div>
        ) : null}
      </div>
    </AdminShell>
  );
}
