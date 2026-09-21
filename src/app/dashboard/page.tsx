"use client";

import { useState } from "react";
import { AdminShell } from "@/components/layout";

// ─── Types ────────────────────────────────────────────────────────────────────

type Period = "7" | "30" | "90" | "180" | "0";

// ─── Mock data ────────────────────────────────────────────────────────────────

const OVERVIEW_STATS = {
  activeUsers: 14820,
  activeUsersGrowth: "+12.4%",
  quizzesCompleted: 248930,
  quizzesGrowth: "+8.1%",
  revenue: 6100000,
  revenueGrowth: "+15.2%",
  activeCampaigns: 4,
  pendingWithdrawals: 18,
  systemUptime: "99.9%",
};

// Daily active users for the last 14 days (sparkline)
const DAU_SPARK = [980, 1020, 1100, 1280, 1350, 1190, 1050, 1310, 1420, 1380, 1290, 1450, 1390, 1342];

// Revenue over last 14 days (sparkline)
const REVENUE_SPARK = [320, 410, 390, 520, 610, 480, 420, 580, 690, 610, 550, 780, 710, 680];

const RECENT_ALERTS = [
  { id: 1, type: "Withdrawal", message: "18 pending withdrawals require approval", severity: "medium", time: "10 mins ago" },
  { id: 2, type: "System", message: "Database automated backup completed", severity: "low", time: "2 hours ago" },
  { id: 3, type: "Content", message: "User flagged question in Chemistry DB", severity: "medium", time: "4 hours ago" },
  { id: 4, type: "Finance", message: "Large deposit (₦150,000) from new user", severity: "low", time: "5 hours ago" },
  { id: 5, type: "Security", message: "Multiple failed logins on admin account", severity: "high", time: "1 day ago" },
];

const QUICK_ACTIONS = [
  { label: "Review Withdrawals", href: "/finance/withdrawals", icon: "↗", color: "text-amber-600", bg: "bg-amber-500/10" },
  { label: "View Analytics", href: "/analytics", icon: "▥", color: "text-primary", bg: "bg-primary/10" },
  { label: "Manage Users", href: "/users", icon: "♙", color: "text-blue-600", bg: "bg-blue-500/10" },
  { label: "Content Editor", href: "/content", icon: "✎", color: "text-violet-600", bg: "bg-violet-500/10" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number) => n.toLocaleString("en-NG");
const fmtNGN = (n: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(n);

const PERIOD_OPTIONS: { value: Period; label: string }[] = [
  { value: "7", label: "Last 7 days" },
  { value: "30", label: "Last 30 days" },
  { value: "90", label: "Last 3 months" },
  { value: "0", label: "All time" },
];

// ─── Reusable UI primitives ───────────────────────────────────────────────────

function Sparkline({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  
  return (
    <div className="flex h-10 items-end gap-1">
      {data.map((val, i) => (
        <div
          key={i}
          className={`w-full rounded-sm ${color} opacity-80`}
          style={{ height: `${Math.max(10, ((val - min) / range) * 100)}%` }}
        />
      ))}
    </div>
  );
}

function SectionTitle({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="mb-5">
      <h2 className="text-foreground text-lg font-bold">{title}</h2>
      <p className="text-muted-foreground mt-0.5 text-xs">{sub}</p>
    </div>
  );
}

function AlertBadge({ severity }: { severity: string }) {
  const styles: Record<string, string> = {
    low: "bg-emerald-500/10 text-emerald-600",
    medium: "bg-amber-500/10 text-amber-600",
    high: "bg-rose-500/10 text-rose-600",
  };
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
        styles[severity] ?? "bg-surface-subtle text-muted-foreground"
      }`}
    >
      {severity}
    </span>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [period, setPeriod] = useState<Period>("30");

  const days = period === "0" ? 14 : Math.min(Number(period), 14);
  const dauSlice = DAU_SPARK.slice(-days);
  const revSlice = REVENUE_SPARK.slice(-days);

  return (
    <AdminShell>
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="text-primary text-[10px] font-bold tracking-widest uppercase">
            Operations Workspace
          </span>
          <h1 className="text-foreground mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
            Platform Overview
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Monitor and manage the entire Preppal ecosystem from one place.
          </p>
        </div>
        <div className="flex items-center gap-1 rounded-full bg-surface-subtle/80 p-1 w-fit">
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

      {/* ── 1. Top Level Metrics ───────────────────────────────────────── */}
      <section className="mb-8 grid gap-4 lg:grid-cols-4 sm:grid-cols-2">
        <article className="surface-card rounded-2xl p-5">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-foreground text-sm font-semibold">Active Users</p>
            <span className="text-emerald-600 text-xs font-bold">{OVERVIEW_STATS.activeUsersGrowth}</span>
          </div>
          <p className="text-foreground mb-4 text-3xl font-black">{fmt(OVERVIEW_STATS.activeUsers)}</p>
          <Sparkline data={dauSlice} color="bg-primary" />
        </article>

        <article className="surface-card rounded-2xl p-5">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-foreground text-sm font-semibold">Total Revenue</p>
            <span className="text-emerald-600 text-xs font-bold">{OVERVIEW_STATS.revenueGrowth}</span>
          </div>
          <p className="text-foreground mb-4 text-3xl font-black">{fmtNGN(OVERVIEW_STATS.revenue)}</p>
          <Sparkline data={revSlice} color="bg-emerald-500" />
        </article>

        <article className="surface-card rounded-2xl p-5">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-foreground text-sm font-semibold">Quizzes Completed</p>
            <span className="text-emerald-600 text-xs font-bold">{OVERVIEW_STATS.quizzesGrowth}</span>
          </div>
          <p className="text-foreground mb-4 text-3xl font-black">{fmt(OVERVIEW_STATS.quizzesCompleted)}</p>
          <Sparkline data={dauSlice} color="bg-violet-500" />
        </article>

        <article className="surface-card rounded-2xl p-5">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-foreground text-sm font-semibold">System Health</p>
          </div>
          <div className="mt-4 flex flex-col gap-3 text-sm font-medium">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Uptime</span>
              <span className="text-emerald-600">{OVERVIEW_STATS.systemUptime}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Pending Withdrawals</span>
              <span className="text-amber-600">{OVERVIEW_STATS.pendingWithdrawals}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Active Campaigns</span>
              <span className="text-primary">{OVERVIEW_STATS.activeCampaigns}</span>
            </div>
          </div>
        </article>
      </section>

      {/* ── 2. Quick Actions & Alerts ──────────────────────────────────── */}
      <section className="mb-8 grid gap-6 lg:grid-cols-3">
        
        {/* Quick Actions */}
        <div>
          <SectionTitle title="Quick Actions" sub="Jump to frequent tasks" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-2">
            {QUICK_ACTIONS.map((action) => (
              <a
                key={action.label}
                href={action.href}
                className="surface-card group flex flex-col items-center justify-center gap-3 rounded-2xl p-4 text-center transition-colors hover:bg-surface-subtle"
              >
                <div className={`grid size-10 place-items-center rounded-xl text-lg ${action.bg} ${action.color} transition-transform group-hover:scale-110`}>
                  {action.icon}
                </div>
                <span className="text-foreground text-xs font-semibold">{action.label}</span>
              </a>
            ))}
          </div>
        </div>

        {/* System Alerts */}
        <div className="lg:col-span-2">
          <SectionTitle title="Recent Alerts & Notifications" sub="System events requiring your attention" />
          <div className="surface-card rounded-2xl p-5">
            <div className="divide-border divide-y">
              {RECENT_ALERTS.map((alert) => (
                <div key={alert.id} className="flex items-start gap-4 py-3 first:pt-0 last:pb-0">
                  <div className="mt-0.5">
                    <AlertBadge severity={alert.severity} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-foreground text-sm font-medium">{alert.message}</p>
                    <div className="text-muted-foreground mt-1 flex items-center gap-2 text-[10px]">
                      <span className="font-semibold uppercase tracking-wider">{alert.type}</span>
                      <span>•</span>
                      <span>{alert.time}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </AdminShell>
  );
}
