"use client";

import { useState } from "react";
import { AdminShell } from "@/components/layout";

// ─── Types ────────────────────────────────────────────────────────────────────

type Period = "7" | "30" | "90" | "180" | "0";

// ─── Mock data ────────────────────────────────────────────────────────────────

const REWARD_STATS = {
  totalRewardsIssued: 48210,
  coinsDistributed: 840200,
  activeCampaigns: 4,
  usersRewardedThisMonth: 3420,
  marketplaceRedemptions: 1140,
  referralSignups: 890,
  streakBonuses: 14200,
  avgRewardValue: 17.4,
};

const ACTIVE_CAMPAIGNS = [
  { id: "RC-01", name: "Weekly Top 10 Leaderboard", type: "Recurring", coinsPool: 10000, participants: 8400, status: "Active" },
  { id: "RC-02", name: "7-Day Study Streak", type: "Automated", coinsPool: "Unlimited", participants: 12400, status: "Active" },
  { id: "RC-03", name: "Back to School Referral Promo", type: "Time-bound", coinsPool: 50000, participants: 2100, status: "Ending soon" },
  { id: "RC-04", name: "First Perfect Score", type: "Achievement", coinsPool: "Unlimited", participants: 4500, status: "Active" },
];

const RECENT_REWARDS = [
  { id: "RW-4821", user: "Amara Okafor", reason: "Weekly Leaderboard - 1st", amount: 1000, date: "10 mins ago" },
  { id: "RW-4820", user: "David Adebayo", reason: "Referral Bonus", amount: 250, date: "45 mins ago" },
  { id: "RW-4819", user: "Zainab Bello", reason: "7-Day Streak", amount: 50, date: "2 hours ago" },
  { id: "RW-4818", user: "Chinedu Okoro", reason: "Marketplace: Exam Past Questions", amount: -500, date: "3 hours ago" }, // Negative means redemption
  { id: "RW-4817", user: "Grace Mensah", reason: "First Perfect Score", amount: 500, date: "4 hours ago" },
  { id: "RW-4816", user: "Tunde Bakare", reason: "Referral Bonus", amount: 250, date: "5 hours ago" },
  { id: "RW-4815", user: "Maya Johnson", reason: "Weekly Leaderboard - 2nd", amount: 500, date: "5 hours ago" },
];

const MARKETPLACE_ITEMS = [
  { name: "JAMB Past Questions Bundle", cost: 500, redemptions: 480, status: "Available" },
  { name: "WAEC Science Prep Kit", cost: 800, redemptions: 310, status: "Available" },
  { name: "1-on-1 Tutor Session (30m)", cost: 5000, redemptions: 45, status: "Limited" },
  { name: "Preppal Pro (1 Month)", cost: 2000, redemptions: 210, status: "Available" },
  { name: "Preppal T-Shirt Merch", cost: 10000, redemptions: 12, status: "Out of stock" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number | string) => (typeof n === "number" ? n.toLocaleString("en-NG") : n);

const PERIOD_OPTIONS: { value: Period; label: string }[] = [
  { value: "7", label: "Last 7 days" },
  { value: "30", label: "Last 30 days" },
  { value: "90", label: "Last 3 months" },
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
      <span className={`grid size-9 place-items-center rounded-xl text-base ${tone}`}>
        {icon}
      </span>
      <p className="text-foreground mt-3 text-xl font-bold">{value}</p>
      <p className="text-foreground text-[.75rem] font-medium">{label}</p>
      <p className="text-muted-foreground mt-0.5 text-[11px]">{sub}</p>
    </article>
  );
}

function StatusBadge({ status }: { readonly status: string }) {
  const styles: Record<string, string> = {
    Active: "bg-emerald-500/10 text-emerald-600",
    Available: "bg-emerald-500/10 text-emerald-600",
    "Ending soon": "bg-amber-500/10 text-amber-600",
    Limited: "bg-amber-500/10 text-amber-600",
    "Out of stock": "bg-rose-500/10 text-rose-600",
  };
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
        styles[status] ?? "bg-surface-subtle text-muted-foreground"
      }`}
    >
      {status}
    </span>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function RewardsPage() {
  const [period, setPeriod] = useState<Period>("30");

  return (
    <AdminShell>
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="text-primary text-[10px] font-bold tracking-widest uppercase">
            Gamification & Incentives
          </span>
          <h1 className="text-foreground mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
            Rewards & Campaigns
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Manage coin distributions, leaderboards, achievements, and the marketplace.
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

      {/* ── 1. Reward KPIs ─────────────────────────────────────────────── */}
      <section className="mb-8">
        <SectionTitle
          title="Rewards Overview"
          sub="Top-level metrics for gamification and incentives"
        />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
          <KpiCard label="Coins distributed" value={fmt(REWARD_STATS.coinsDistributed)} sub="Given out as rewards" icon="ℙ" tone="bg-amber-500/10 text-amber-600" />
          <KpiCard label="Rewards issued" value={fmt(REWARD_STATS.totalRewardsIssued)} sub="Total distinct payouts" icon="✦" tone="bg-primary/10 text-primary" />
          <KpiCard label="Users rewarded" value={fmt(REWARD_STATS.usersRewardedThisMonth)} sub="Unique users in period" icon="♙" tone="bg-blue-500/10 text-blue-600" />
          <KpiCard label="Avg reward value" value={fmt(REWARD_STATS.avgRewardValue)} sub="Coins per payout" icon="÷" tone="bg-violet-500/10 text-violet-600" />
          <KpiCard label="Marketplace redeems" value={fmt(REWARD_STATS.marketplaceRedemptions)} sub="Items claimed by users" icon="🛍" tone="bg-emerald-500/10 text-emerald-600" />
          <KpiCard label="Active campaigns" value={fmt(REWARD_STATS.activeCampaigns)} sub="Running promotions" icon="⚑" tone="bg-rose-500/10 text-rose-600" />
          <KpiCard label="Streak bonuses" value={fmt(REWARD_STATS.streakBonuses)} sub="Hit by active users" icon="🔥" tone="bg-orange-500/10 text-orange-600" />
          <KpiCard label="Referral payouts" value={fmt(REWARD_STATS.referralSignups)} sub="Signups rewarded" icon="⇒" tone="bg-indigo-500/10 text-indigo-600" />
        </div>
      </section>

      {/* ── 2. Active Campaigns & Marketplace ──────────────────────────── */}
      <section className="mb-8">
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Active Campaigns */}
          <div>
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-foreground text-lg font-bold">Active Campaigns</h2>
                <p className="text-muted-foreground mt-0.5 text-xs">Manage ongoing promotions</p>
              </div>
              <button type="button" className="bg-primary text-primary-foreground rounded-lg px-3 py-1.5 text-xs font-semibold">
                + New Campaign
              </button>
            </div>
            <div className="surface-card rounded-2xl p-5">
              <div className="space-y-4">
                {ACTIVE_CAMPAIGNS.map((c) => (
                  <div key={c.id} className="border-border border-b pb-4 last:border-0 last:pb-0">
                    <div className="mb-1.5 flex items-start justify-between">
                      <div>
                        <p className="text-foreground text-sm font-semibold">{c.name}</p>
                        <p className="text-muted-foreground mt-0.5 text-[11px]">{c.type} · {fmt(c.participants)} participants</p>
                      </div>
                      <StatusBadge status={c.status} />
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="bg-surface-subtle text-muted-foreground rounded px-2 py-0.5 text-[10px] font-semibold">
                        Pool: {fmt(c.coinsPool)} ℙ
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Marketplace Items */}
          <div>
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-foreground text-lg font-bold">Marketplace Items</h2>
                <p className="text-muted-foreground mt-0.5 text-xs">What users are spending coins on</p>
              </div>
              <button type="button" className="bg-primary text-primary-foreground rounded-lg px-3 py-1.5 text-xs font-semibold">
                + Add Item
              </button>
            </div>
            <div className="surface-card rounded-2xl p-5">
              <div className="space-y-4">
                {MARKETPLACE_ITEMS.map((item) => (
                  <div key={item.name} className="border-border flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                    <div>
                      <p className="text-foreground text-sm font-semibold">{item.name}</p>
                      <p className="text-muted-foreground mt-0.5 text-[11px]">{fmt(item.redemptions)} total redemptions</p>
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <span className="text-foreground text-xs font-bold">{fmt(item.cost)} ℙ</span>
                      <StatusBadge status={item.status} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. Recent Rewards Issued ───────────────────────────────────── */}
      <section className="mb-8">
        <SectionTitle
          title="Recent Activity"
          sub="Latest coins issued or redeemed across the platform"
        />
        <div className="surface-card rounded-2xl p-5">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-border text-muted-foreground border-b text-xs">
                  <th className="pb-3 font-medium">Log ID</th>
                  <th className="pb-3 font-medium">User</th>
                  <th className="pb-3 font-medium">Reason</th>
                  <th className="pb-3 font-medium text-right">Amount</th>
                  <th className="pb-3 font-medium text-right">Time</th>
                </tr>
              </thead>
              <tbody className="divide-border divide-y">
                {RECENT_REWARDS.map((rw) => (
                  <tr key={rw.id} className="group transition-colors hover:bg-surface-subtle">
                    <td className="py-3 pr-4">
                      <p className="text-foreground font-semibold">{rw.id}</p>
                    </td>
                    <td className="py-3 pr-4">
                      <p className="text-foreground text-xs font-semibold">{rw.user}</p>
                    </td>
                    <td className="py-3 pr-4">
                      <p className="text-foreground text-[11px]">{rw.reason}</p>
                    </td>
                    <td className="py-3 pr-4 text-right">
                      <span
                        className={`font-bold ${
                          rw.amount > 0 ? "text-emerald-600" : "text-rose-600"
                        }`}
                      >
                        {rw.amount > 0 ? "+" : ""}
                        {fmt(rw.amount)} ℙ
                      </span>
                    </td>
                    <td className="text-muted-foreground py-3 text-right text-[11px]">
                      {rw.date}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </AdminShell>
  );
}
