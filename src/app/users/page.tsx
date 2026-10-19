"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Crown,
  Mail,
  Phone,
  Search,
  Target,
  UserCheck,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { useDeferredValue, useState } from "react";

import { Pagination } from "@/components/admin-ui";
import { AdminShell } from "@/components/layout";
import { Select } from "@/components/ui";
import { apiClient } from "@/lib/api/client";
import { ExportCsvButton } from "@/components/export-csv-button";

type UserStatus = "Active" | "Suspended" | "Pending";
type StatusFilter = "ALL" | "ACTIVE" | "PENDING" | "SUSPENDED";
type PlanFilter = "ALL" | "FREE" | "MONTHLY" | "ANNUAL";
type RangeFilter = "0" | "1" | "7" | "30";
type UserRole = "LEARNER" | "MODERATOR" | "ADMIN";
type RoleFilter = "ALL" | UserRole;

interface AdminUser {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  phoneCountryCode: string | null;
  avatarUrl: string | null;
  status: UserStatus;
  role: UserRole;
  plan: string;
  planInterval: "FREE" | "MONTH" | "YEAR";
  planEndsAt: string | null;
  xp: number;
  lifetimeXp: number;
  coins: number;
  depositedBalanceMinor: number;
  pendingCoins: number;
  quizzes: number;
  checkIns: number;
  verifiedReferrals: number;
  lastActive: string | null;
  joinedAt: string;
  emailVerifiedAt: string | null;
  level: { number: number; name: string };
  learningLevel: string | null;
  primaryExamGoal: string | null;
  weeklyGoalDays: number | null;
  onboardingCompleted: boolean;
}

interface UsersResponse {
  generatedAt: string;
  metrics: {
    totalUsers: number;
    activeUsers: number;
    premiumMembers: number;
    newThisMonth: number;
    monthStart: string;
  };
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
  users: AdminUser[];
}

const PAGE_SIZE = 10;
const number = (value: number) => value.toLocaleString("en-NG");
const formatDate = (value: string | null) =>
  value
    ? new Intl.DateTimeFormat("en-NG", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }).format(new Date(value))
    : "Never";
const formatMonth = (value: string) =>
  new Intl.DateTimeFormat("en-NG", { month: "short", year: "numeric" }).format(
    new Date(value),
  );
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

function RoleBadge({ role }: { readonly role: UserRole }) {
  const styles: Record<UserRole, string> = {
    LEARNER: "bg-blue-500/10 text-blue-700",
    MODERATOR: "bg-amber-500/10 text-amber-700",
    ADMIN: "bg-violet-500/10 text-violet-700",
  };
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${styles[role]}`}
    >
      {role.charAt(0) + role.slice(1).toLowerCase()}
    </span>
  );
}

export default function UsersPage() {
  const queryClient = useQueryClient();
  const [queryText, setQueryText] = useState("");
  const deferredQuery = useDeferredValue(queryText);
  const [status, setStatus] = useState<StatusFilter>("ALL");
  const [role, setRole] = useState<RoleFilter>("ALL");
  const [plan, setPlan] = useState<PlanFilter>("ALL");
  const [range, setRange] = useState<RangeFilter>("0");
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [page, setPage] = useState(1);
  const query = useQuery({
    queryKey: [
      "admin",
      "users",
      deferredQuery,
      status,
      role,
      plan,
      range,
      page,
    ],
    queryFn: () => {
      const params = new URLSearchParams({
        query: deferredQuery,
        status,
        role,
        plan,
        range,
        page: String(page),
        pageSize: String(PAGE_SIZE),
      });
      return apiClient<UsersResponse>(
        `/api/v1/admin/users?${params.toString()}`,
      );
    },
    placeholderData: (previous) => previous,
  });
  const accountAction = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Record<string, string> }) =>
      apiClient(`/api/v1/admin/users/${id}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      setSelectedUser(null);
    },
  });
  const revokeSessions = useMutation({
    mutationFn: (id: string) =>
      apiClient(`/api/v1/admin/users/${id}/revoke-sessions`, {
        method: "POST",
        body: JSON.stringify({ reason: "Revoked by administrator" }),
      }),
  });
  const data = query.data;
  const users = data?.users ?? [];
  const metrics = [
    {
      label: "Total users",
      value: number(data?.metrics.totalUsers ?? 0),
      detail: "Learners, moderators, and admins",
      icon: Users,
    },
    {
      label: "Active users",
      value: number(data?.metrics.activeUsers ?? 0),
      detail: "Verified and in good standing",
      icon: UserCheck,
    },
    {
      label: "Premium members",
      value: number(data?.metrics.premiumMembers ?? 0),
      detail: "Current active subscriptions",
      icon: Crown,
    },
    {
      label: "New this month",
      value: number(data?.metrics.newThisMonth ?? 0),
      detail: data
        ? `Joined since ${formatMonth(data.metrics.monthStart)}`
        : "Current month",
      icon: UserPlus,
    },
  ];

  const resetFilters = () => {
    setQueryText("");
    setStatus("ALL");
    setRole("ALL");
    setPlan("ALL");
    setRange("0");
    setPage(1);
  };

  return (
    <AdminShell>
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <Link
              className="text-muted-foreground hover:text-primary inline-flex items-center gap-1.5 text-xs font-medium"
              href="/dashboard"
            >
              <ChevronLeft className="size-3.5" /> Overview
            </Link>
            <div className="mt-4 flex items-center gap-3">
              <span className="bg-primary/10 text-primary grid size-11 place-items-center rounded-2xl">
                <Users className="size-5" strokeWidth={1.9} />
              </span>
              <div>
                <h1 className="text-foreground text-2xl font-bold tracking-tight sm:text-3xl">
                  Users
                </h1>
                <p className="text-muted-foreground mt-1 text-sm">
                  Manage learners, moderators, and administrators from one live
                  directory.
                </p>
              </div>
            </div>
          </div>
          <ExportCsvButton
            filename={`preppal-users-${new Date().toISOString().slice(0, 10)}`}
            rows={users.map((user) => ({
              Name: user.name,
              Email: user.email,
              Phone: user.phone,
              Role: user.role,
              Status: user.status,
              Plan: user.plan,
              Level: `${user.level.number} - ${user.level.name}`,
              XP: user.xp,
              "Lifetime XP": user.lifetimeXp,
              Coins: user.coins,
              Quizzes: user.quizzes,
              "Last active": user.lastActive,
              "Joined at": user.joinedAt,
            }))}
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {metrics.map(({ label, value, detail, icon: Icon }) => (
            <article className="surface-card p-4 sm:p-5" key={label}>
              <div className="flex items-start justify-between gap-3">
                <p className="text-muted-foreground text-xs font-medium">
                  {label}
                </p>
                <span className="text-primary bg-primary/10 grid size-7 place-items-center rounded-lg">
                  <Icon className="size-3.5" strokeWidth={1.9} />
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
                  Search every account role with database-backed filters and
                  pagination.
                </p>
              </div>
              <div className="relative w-full lg:max-w-xs">
                <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2" />
                <input
                  className="border-border bg-background text-foreground placeholder:text-muted-foreground focus:border-primary h-10 w-full rounded-xl border pr-3 pl-9 text-xs outline-none"
                  onChange={(event) => {
                    setQueryText(event.target.value);
                    setPage(1);
                  }}
                  placeholder="Search name, email, or ID"
                  value={queryText}
                />
              </div>
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
              <Select
                className="border-border bg-background text-foreground h-9 rounded-lg border px-3 text-xs outline-none"
                onChange={(event) => {
                  const nextRole = event.target.value as RoleFilter;
                  setRole(nextRole);
                  if (nextRole === "ADMIN" || nextRole === "MODERATOR") {
                    setPlan("ALL");
                  }
                  setPage(1);
                }}
                value={role}
              >
                <option value="ALL">All roles</option>
                <option value="LEARNER">Learners</option>
                <option value="MODERATOR">Moderators</option>
                <option value="ADMIN">Administrators</option>
              </Select>
              <Select
                className="border-border bg-background text-foreground h-9 rounded-lg border px-3 text-xs outline-none"
                onChange={(event) => {
                  setStatus(event.target.value as StatusFilter);
                  setPage(1);
                }}
                value={status}
              >
                <option value="ALL">All statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="PENDING">Pending verification</option>
                <option value="SUSPENDED">Suspended</option>
              </Select>
              <Select
                className="border-border bg-background text-foreground h-9 rounded-lg border px-3 text-xs outline-none"
                disabled={role === "ADMIN" || role === "MODERATOR"}
                onChange={(event) => {
                  setPlan(event.target.value as PlanFilter);
                  setPage(1);
                }}
                value={plan}
              >
                <option value="ALL">All plans</option>
                <option value="FREE">Free</option>
                <option value="MONTHLY">Monthly Premium</option>
                <option value="ANNUAL">Annual Premium</option>
              </Select>
              <Select
                className="border-border bg-background text-foreground h-9 rounded-lg border px-3 text-xs outline-none"
                onChange={(event) => {
                  setRange(event.target.value as RangeFilter);
                  setPage(1);
                }}
                value={range}
              >
                <option value="0">All time</option>
                <option value="1">Joined today</option>
                <option value="7">Joined in last 7 days</option>
                <option value="30">Joined in last 30 days</option>
              </Select>
            </div>
          </div>

          <div className="border-border flex items-center justify-between border-b px-4 py-3 sm:px-5">
            <p className="text-muted-foreground text-xs">
              <span className="text-foreground font-semibold">
                {number(data?.pagination.totalItems ?? 0)}
              </span>{" "}
              matching users
            </p>
            <button
              className="text-primary text-xs font-semibold"
              onClick={resetFilters}
              type="button"
            >
              Reset filters
            </button>
          </div>

          {query.isLoading ? (
            <div className="text-muted-foreground flex min-h-64 items-center justify-center gap-2 text-xs">
              <span className="border-primary size-5 animate-spin rounded-full border-2 border-t-transparent" />
              Loading users…
            </div>
          ) : query.isError ? (
            <div className="p-10 text-center">
              <p className="text-foreground text-sm font-semibold">
                Could not load users
              </p>
              <button
                className="text-primary mt-2 text-xs font-bold"
                onClick={() => query.refetch()}
                type="button"
              >
                Try again
              </button>
            </div>
          ) : (
            <>
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[940px] text-left">
                  <thead className="bg-surface-subtle/60 text-muted-foreground text-[11px] font-semibold uppercase">
                    <tr>
                      <th className="px-5 py-3">User</th>
                      <th className="px-4 py-3">Role</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Plan</th>
                      <th className="px-4 py-3">XP / coins</th>
                      <th className="px-4 py-3">Quizzes</th>
                      <th className="px-4 py-3">Last active</th>
                      <th className="px-5 py-3 text-right">Profile</th>
                    </tr>
                  </thead>
                  <tbody className="divide-border divide-y">
                    {users.map((user) => (
                      <tr
                        className="hover:bg-surface-subtle/50 transition-colors"
                        key={user.id}
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <UserAvatar name={user.name} />
                            <div className="min-w-0">
                              <p className="text-foreground truncate text-xs font-semibold">
                                {user.name}
                              </p>
                              <p className="text-muted-foreground mt-0.5 truncate text-[11px]">
                                {user.email}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <RoleBadge role={user.role} />
                        </td>
                        <td className="px-4 py-4">
                          <StatusBadge status={user.status} />
                        </td>
                        <td className="text-foreground px-4 py-4 text-xs">
                          {user.plan}
                        </td>
                        <td className="px-4 py-4">
                          {user.role === "LEARNER" ? (
                            <>
                              <p className="text-foreground text-xs font-semibold">
                                {number(user.xp)} XP
                              </p>
                              <p className="text-muted-foreground mt-0.5 text-[11px]">
                                {number(user.coins)} coins
                              </p>
                            </>
                          ) : (
                            <span className="text-muted-foreground text-xs">
                              Not applicable
                            </span>
                          )}
                        </td>
                        <td className="text-foreground px-4 py-4 text-xs">
                          {user.role === "LEARNER" ? number(user.quizzes) : "—"}
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
                {users.map((user) => (
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
                    <RoleBadge role={user.role} />
                    <StatusBadge status={user.status} />
                    <ChevronRight className="text-muted-foreground size-4" />
                  </button>
                ))}
              </div>

              {!users.length ? (
                <div className="text-muted-foreground p-10 text-center text-sm">
                  No users match the current filters.
                </div>
              ) : null}

              <div className="px-4 pb-4 sm:px-5">
                <Pagination
                  currentPage={data?.pagination.page ?? page}
                  itemLabel="users"
                  onPageChange={setPage}
                  pageSize={PAGE_SIZE}
                  totalItems={data?.pagination.totalItems ?? 0}
                  totalPages={data?.pagination.totalPages ?? 1}
                />
              </div>
            </>
          )}
        </section>

        {selectedUser ? (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 p-4 backdrop-blur-sm lg:left-64"
            onClick={() => setSelectedUser(null)}
            role="presentation"
          >
            <section
              aria-label={`${selectedUser.name} user profile`}
              aria-modal="true"
              className="bg-surface max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-3xl p-6 shadow-2xl sm:p-8"
              onClick={(event) => event.stopPropagation()}
              role="dialog"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <span className="bg-primary/10 text-primary grid size-14 shrink-0 place-items-center rounded-2xl text-base font-bold">
                    {initials(selectedUser.name)}
                  </span>
                  <div>
                    <h2 className="text-foreground text-xl font-bold">
                      {selectedUser.name}
                    </h2>
                    <p className="text-muted-foreground mt-1 text-sm">
                      {selectedUser.id.slice(0, 8)} · Joined{" "}
                      {formatDate(selectedUser.joinedAt)}
                    </p>
                  </div>
                </div>
                <button
                  aria-label="Close user profile"
                  className="text-muted-foreground hover:text-foreground rounded-lg p-1"
                  onClick={() => setSelectedUser(null)}
                  type="button"
                >
                  <X className="size-4" />
                </button>
              </div>

              <div className="bg-surface-subtle mt-6 flex flex-wrap items-center gap-2 rounded-2xl p-4">
                <RoleBadge role={selectedUser.role} />
                <StatusBadge status={selectedUser.status} />
                {selectedUser.role === "LEARNER" ? (
                  <>
                    <span className="border-border bg-background rounded-full border px-3 py-1 text-xs font-semibold">
                      {selectedUser.plan}
                    </span>
                    <span className="border-border bg-background rounded-full border px-3 py-1 text-xs font-semibold">
                      Level {selectedUser.level.number} ·{" "}
                      {selectedUser.level.name}
                    </span>
                  </>
                ) : (
                  <span className="text-muted-foreground px-1 text-xs">
                    Staff account
                  </span>
                )}
              </div>

              {selectedUser.role === "LEARNER" ? (
                <section className="mt-6">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-sm font-bold">Learning snapshot</h3>
                    <span className="text-muted-foreground text-xs">
                      {selectedUser.weeklyGoalDays
                        ? `${selectedUser.weeklyGoalDays}-day weekly goal`
                        : "No weekly goal set"}
                    </span>
                  </div>
                  <dl className="divide-border overflow-hidden rounded-2xl border">
                    <div className="grid grid-cols-2 divide-x sm:grid-cols-4">
                      <div className="p-4">
                        <dt className="text-muted-foreground text-xs">
                          Available XP
                        </dt>
                        <dd className="mt-1 text-lg font-bold">
                          {number(selectedUser.xp)}
                        </dd>
                      </div>
                      <div className="p-4">
                        <dt className="text-muted-foreground text-xs">Coins</dt>
                        <dd className="mt-1 text-lg font-bold">
                          {number(selectedUser.coins)}
                        </dd>
                      </div>
                      <div className="p-4">
                        <dt className="text-muted-foreground text-xs">
                          Quizzes completed
                        </dt>
                        <dd className="mt-1 text-lg font-bold">
                          {number(selectedUser.quizzes)}
                        </dd>
                      </div>
                      <div className="p-4">
                        <dt className="text-muted-foreground text-xs">
                          Check-ins
                        </dt>
                        <dd className="mt-1 text-lg font-bold">
                          {number(selectedUser.checkIns)}
                        </dd>
                      </div>
                    </div>
                    <div className="bg-surface-subtle flex flex-wrap gap-x-6 gap-y-2 px-4 py-3 text-xs">
                      <span>
                        Lifetime XP{" "}
                        <strong className="ml-1">
                          {number(selectedUser.lifetimeXp)}
                        </strong>
                      </span>
                      <span>
                        Referrals{" "}
                        <strong className="ml-1">
                          {number(selectedUser.verifiedReferrals)}
                        </strong>
                      </span>
                      <span>
                        Onboarding{" "}
                        <strong className="ml-1">
                          {selectedUser.onboardingCompleted
                            ? "Complete"
                            : "Incomplete"}
                        </strong>
                      </span>
                    </div>
                  </dl>
                </section>
              ) : null}

              <div className="border-border mt-5 grid gap-4 border-t pt-5 sm:grid-cols-2">
                <div className="flex items-start gap-2.5">
                  <Mail className="text-primary mt-0.5 size-4" />
                  <div>
                    <p className="text-muted-foreground text-[10px]">
                      Email address
                    </p>
                    <p className="text-foreground mt-1 text-xs font-medium break-all">
                      {selectedUser.email}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <Phone className="text-primary mt-0.5 size-4" />
                  <div>
                    <p className="text-muted-foreground text-[10px]">
                      Phone number
                    </p>
                    <p className="text-foreground mt-1 text-xs font-medium">
                      {selectedUser.phone
                        ? `${selectedUser.phoneCountryCode ?? ""}${selectedUser.phone}`
                        : "Not provided"}
                    </p>
                  </div>
                </div>
                {selectedUser.role === "LEARNER" ? (
                  <div className="flex items-start gap-2.5">
                    <Target className="text-primary mt-0.5 size-4" />
                    <div>
                      <p className="text-muted-foreground text-[10px]">
                        Primary exam goal
                      </p>
                      <p className="text-foreground mt-1 text-xs font-medium">
                        {selectedUser.primaryExamGoal ?? "Not set"}
                      </p>
                    </div>
                  </div>
                ) : null}
                <div className="flex items-start gap-2.5">
                  <CalendarDays className="text-primary mt-0.5 size-4" />
                  <div>
                    <p className="text-muted-foreground text-[10px]">
                      Activity and subscription
                    </p>
                    <p className="text-foreground mt-1 text-xs font-medium">
                      Last active {formatDate(selectedUser.lastActive)}
                    </p>
                    {selectedUser.planEndsAt ? (
                      <p className="text-muted-foreground mt-1 text-[10px]">
                        Plan ends {formatDate(selectedUser.planEndsAt)}
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="border-border mt-5 border-t pt-4">
                <p className="text-muted-foreground text-[10px] font-bold tracking-wide uppercase">
                  Account controls
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    className="border-border hover:bg-surface-subtle rounded-lg border px-3 py-2 text-xs font-semibold disabled:opacity-50"
                    disabled={accountAction.isPending}
                    onClick={() =>
                      accountAction.mutate({
                        id: selectedUser.id,
                        body: {
                          status:
                            selectedUser.status === "Suspended"
                              ? "ACTIVE"
                              : "SUSPENDED",
                          reason:
                            selectedUser.status === "Suspended"
                              ? "Restored by administrator"
                              : "Suspended by administrator",
                        },
                      })
                    }
                    type="button"
                  >
                    {selectedUser.status === "Suspended"
                      ? "Restore account"
                      : "Suspend account"}
                  </button>
                  <Select
                    aria-label="Change user role"
                    className="border-border bg-background h-9 rounded-lg border px-2 text-xs"
                    disabled={accountAction.isPending}
                    onChange={(event) => {
                      if (event.target.value !== selectedUser.role)
                        accountAction.mutate({
                          id: selectedUser.id,
                          body: {
                            role: event.target.value,
                            reason: "Role updated by administrator",
                          },
                        });
                    }}
                    value={selectedUser.role}
                  >
                    <option value="LEARNER">Learner</option>
                    <option value="MODERATOR">Moderator</option>
                    <option value="ADMIN">Administrator</option>
                  </Select>
                  <button
                    className="border-border hover:bg-surface-subtle rounded-lg border px-3 py-2 text-xs font-semibold disabled:opacity-50"
                    disabled={revokeSessions.isPending}
                    onClick={() => revokeSessions.mutate(selectedUser.id)}
                    type="button"
                  >
                    {revokeSessions.isPending
                      ? "Revoking sessions…"
                      : "Revoke sessions"}
                  </button>
                </div>
                {accountAction.isError || revokeSessions.isError ? (
                  <p className="text-destructive mt-2 text-xs">
                    The account action could not be completed. Refresh and try
                    again.
                  </p>
                ) : null}
              </div>

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
