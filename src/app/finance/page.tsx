"use client";

import { useMemo, useState } from "react";
import { AdminShell } from "@/components/layout";

// ─── Types ────────────────────────────────────────────────────────────────────

type Period = "7" | "30" | "90" | "180" | "0";

// ─── Mock data ────────────────────────────────────────────────────────────────

const FINANCE_STATS = {
  coinsCirculating: 2140300,
  totalDeposited: 6100000,
  totalWithdrawn: 4820000,
  pendingWithdrawalsCoins: 124000,
  pendingWithdrawalsCount: 18,
  avgDepositSize: 12500,
  avgWithdrawalSize: 18400,
  activeWallets: 11420,
};

// Daily deposits and withdrawals (last 14 days)
const FLOW_SERIES = [
  { day: "09-09", deposits: 42000, withdrawals: 28000 },
  { day: "09-10", deposits: 45000, withdrawals: 31000 },
  { day: "09-11", deposits: 38000, withdrawals: 45000 },
  { day: "09-12", deposits: 51000, withdrawals: 22000 },
  { day: "09-13", deposits: 62000, withdrawals: 18000 },
  { day: "09-14", deposits: 48000, withdrawals: 29000 },
  { day: "09-15", deposits: 44000, withdrawals: 35000 },
  { day: "09-16", deposits: 59000, withdrawals: 41000 },
  { day: "09-17", deposits: 71000, withdrawals: 26000 },
  { day: "09-18", deposits: 65000, withdrawals: 38000 },
  { day: "09-19", deposits: 52000, withdrawals: 51000 },
  { day: "09-20", deposits: 84000, withdrawals: 33000 },
  { day: "09-21", deposits: 76000, withdrawals: 42000 },
  { day: "09-22", deposits: 69000, withdrawals: 29000 },
];

const RECENT_TRANSACTIONS = [
  { id: "TX-9021", user: "Amara Okafor", type: "Deposit", amount: 25000, date: "2 mins ago", status: "Completed" },
  { id: "TX-9020", user: "David Adebayo", type: "Withdrawal", amount: -14000, date: "15 mins ago", status: "Pending" },
  { id: "TX-9019", user: "Zainab Bello", type: "Deposit", amount: 10000, date: "1 hour ago", status: "Completed" },
  { id: "TX-9018", user: "Chinedu Okoro", type: "Withdrawal", amount: -28000, date: "2 hours ago", status: "Completed" },
  { id: "TX-9017", user: "Grace Mensah", type: "Deposit", amount: 5000, date: "3 hours ago", status: "Completed" },
  { id: "TX-9016", user: "Tunde Bakare", type: "Deposit", amount: 15000, date: "3 hours ago", status: "Failed" },
  { id: "TX-9015", user: "Maya Johnson", type: "Withdrawal", amount: -42000, date: "5 hours ago", status: "Completed" },
];

const TOP_HOLDERS = [
  { name: "Amara Okafor", balance: 142000, plan: "Pro" },
  { name: "Maya Johnson", balance: 118500, plan: "Level 2" },
  { name: "Zainab Bello", balance: 94200, plan: "Level 2" },
  { name: "David Adebayo", balance: 88100, plan: "Pro" },
  { name: "Aisha Ibrahim", balance: 76400, plan: "Level 2" },
  { name: "Chinedu Okoro", balance: 64900, plan: "Level 1" },
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
      <span className={`grid size-9 place-items-center rounded-xl text-base ${tone}`}>
        {icon}
      </span>
      <p className="text-foreground mt-3 text-xl font-bold">{value}</p>
      <p className="text-foreground text-[.75rem] font-medium">{label}</p>
      <p className="text-muted-foreground mt-0.5 text-[11px]">{sub}</p>
    </article>
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

function StatusBadge({ status }: { readonly status: string }) {
  const styles: Record<string, string> = {
    Completed: "bg-emerald-500/10 text-emerald-600",
    Pending: "bg-amber-500/10 text-amber-600",
    Failed: "bg-rose-500/10 text-rose-600",
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

export default function WalletOverviewPage() {
  const [period, setPeriod] = useState<Period>("30");

  const days = period === "0" ? 14 : Math.min(Number(period), 14);
  const flowSlice = FLOW_SERIES.slice(-days);

  const maxFlow = Math.max(
    ...flowSlice.map((f) => Math.max(f.deposits, f.withdrawals)),
  );

  const netFlow = FINANCE_STATS.totalDeposited - FINANCE_STATS.totalWithdrawn;

  return (
    <AdminShell>
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="text-primary text-[10px] font-bold tracking-widest uppercase">
            Finance & Economy
          </span>
          <h1 className="text-foreground mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
            Wallet Overview
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Monitor platform liquidity, coin circulation, and transaction flows.
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

      {/* ── 1. Wallet KPIs ─────────────────────────────────────────────── */}
      <section className="mb-8">
        <SectionTitle
          title="Wallet Health"
          sub="Top-level financial indicators across the entire platform"
        />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
          <KpiCard label="Coins in circulation" value={fmt(FINANCE_STATS.coinsCirculating)} sub="Total unspent balances" icon="ℙ" tone="bg-amber-500/10 text-amber-600" />
          <KpiCard label="Active wallets" value={fmt(FINANCE_STATS.activeWallets)} sub="Wallets with balance > 0" icon="◈" tone="bg-primary/10 text-primary" />
          <KpiCard label="Net liquidity" value={fmtNGN(netFlow)} sub="Deposits minus withdrawals" icon="⇌" tone="bg-emerald-500/10 text-emerald-600" />
          <KpiCard label="Pending withdrawals" value={fmt(FINANCE_STATS.pendingWithdrawalsCount)} sub={`${fmt(FINANCE_STATS.pendingWithdrawalsCoins)} coins total`} icon="↗" tone="bg-amber-500/10 text-amber-600" />
          <KpiCard label="Total deposited" value={fmtNGN(FINANCE_STATS.totalDeposited)} sub="All-time fiat deposits" icon="↙" tone="bg-emerald-500/10 text-emerald-600" />
          <KpiCard label="Total withdrawn" value={fmtNGN(FINANCE_STATS.totalWithdrawn)} sub="All-time fiat withdrawals" icon="↗" tone="bg-rose-500/10 text-rose-600" />
          <KpiCard label="Avg deposit size" value={fmtNGN(FINANCE_STATS.avgDepositSize)} sub="Per transaction" icon="↘" tone="bg-emerald-500/10 text-emerald-600" />
          <KpiCard label="Avg withdrawal size" value={fmtNGN(FINANCE_STATS.avgWithdrawalSize)} sub="Per transaction" icon="↖" tone="bg-rose-500/10 text-rose-600" />
        </div>
      </section>

      {/* ── 2. Coin Flow Chart ───────────────────────────────────────────── */}
      <section className="mb-8">
        <SectionTitle
          title="Coin flow velocity"
          sub="Daily deposits vs. withdrawals (in coins)"
        />
        <div className="surface-card rounded-2xl p-5">
          <div className="flex items-end gap-2" style={{ height: 160 }}>
            {flowSlice.map(({ day, deposits, withdrawals }) => (
              <div
                key={day}
                className="group relative flex flex-1 flex-col items-center gap-1"
              >
                <div
                  className="flex w-full items-end gap-px"
                  style={{ height: 140 }}
                >
                  <div
                    className="flex-1 rounded-t-sm bg-emerald-500/80 transition-all hover:bg-emerald-500"
                    style={{ height: `${(deposits / maxFlow) * 140}px` }}
                    title={`${day} Deposits: ${fmt(deposits)}`}
                  />
                  <div
                    className="flex-1 rounded-t-sm bg-rose-500/70 transition-all hover:bg-rose-500"
                    style={{ height: `${(withdrawals / maxFlow) * 140}px` }}
                    title={`${day} Withdrawals: ${fmt(withdrawals)}`}
                  />
                </div>
                <span className="text-muted-foreground text-[9px]">{day}</span>
              </div>
            ))}
          </div>
          <div className="mt-5 flex items-center justify-center gap-6">
            <div className="flex items-center gap-1.5">
              <span className="inline-block size-3 rounded-sm bg-emerald-500/80" />
              <span className="text-muted-foreground text-[11px] font-semibold">Deposits</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="inline-block size-3 rounded-sm bg-rose-500/70" />
              <span className="text-muted-foreground text-[11px] font-semibold">Withdrawals</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. Recent Transactions & Top Holders ─────────────────────────── */}
      <section className="mb-8">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Recent transactions */}
          <div className="lg:col-span-2">
            <SectionTitle
              title="Recent large transactions"
              sub="Monitoring high-value movements > 5,000 coins"
            />
            <div className="surface-card rounded-2xl p-5">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-border text-muted-foreground border-b text-xs">
                      <th className="pb-3 font-medium">Transaction</th>
                      <th className="pb-3 font-medium">User</th>
                      <th className="pb-3 font-medium text-right">Amount</th>
                      <th className="pb-3 font-medium text-center">Status</th>
                      <th className="pb-3 font-medium text-right">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-border divide-y">
                    {RECENT_TRANSACTIONS.map((tx) => (
                      <tr key={tx.id} className="group transition-colors hover:bg-surface-subtle">
                        <td className="py-3 pr-4">
                          <p className="text-foreground font-semibold">{tx.id}</p>
                          <p className="text-muted-foreground text-[10px]">{tx.type}</p>
                        </td>
                        <td className="py-3 pr-4">
                          <p className="text-foreground text-xs font-semibold">{tx.user}</p>
                        </td>
                        <td className="py-3 pr-4 text-right">
                          <span
                            className={`font-bold ${
                              tx.amount > 0 ? "text-emerald-600" : "text-rose-600"
                            }`}
                          >
                            {tx.amount > 0 ? "+" : ""}
                            {fmt(tx.amount)} ℙ
                          </span>
                        </td>
                        <td className="py-3 pr-4 text-center">
                          <StatusBadge status={tx.status} />
                        </td>
                        <td className="text-muted-foreground py-3 text-right text-[11px]">
                          {tx.date}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Top Holders */}
          <div>
            <SectionTitle
              title="Top coin holders"
              sub="Users with the largest wallet balances"
            />
            <div className="surface-card rounded-2xl p-5">
              <div className="divide-border divide-y">
                {TOP_HOLDERS.map((h, i) => (
                  <div key={h.name} className="flex items-center gap-3 py-2.5">
                    <span className="text-muted-foreground w-4 shrink-0 text-center text-xs font-bold">
                      {i + 1}
                    </span>
                    <div className="bg-primary/10 text-primary grid size-8 shrink-0 place-items-center rounded-full text-xs font-bold">
                      {h.name.slice(0, 1)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-foreground truncate text-xs font-semibold">{h.name}</p>
                      <PlanBadge plan={h.plan} />
                    </div>
                    <div className="text-right">
                      <span className="text-amber-600 text-xs font-bold">{fmt(h.balance)} ℙ</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 4. Automated insights panel ─────────────────────────────────── */}
      <section className="mb-2">
        <div className="surface-card from-emerald-500/10 via-surface to-surface border-emerald-500/20 rounded-2xl bg-gradient-to-br p-5 sm:p-6">
          <div className="mb-4 flex items-center gap-3">
            <span className="bg-emerald-500 text-white grid size-10 place-items-center rounded-xl text-lg">
              ✧
            </span>
            <div>
              <p className="text-foreground font-bold">Wallet Risk & Insights</p>
              <p className="text-muted-foreground text-xs">
                Automated liquidity and compliance signals
              </p>
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {[
              "Liquidity is extremely healthy. Net deposits outpace withdrawals by 26%.",
              "18 pending withdrawals detected. Average approval time is currently 1.4 hours.",
              "No suspicious wallet accumulation detected. Top 10 holders account for <3% of total circulating supply.",
              "Deposit velocity spiked 18% over the last 3 days — closely correlating with the new Level 2 plan rollouts.",
            ].map((insight) => (
              <div
                key={insight}
                className="bg-surface/60 flex items-start gap-3 rounded-xl p-3"
              >
                <span className="bg-emerald-500/20 text-emerald-600 mt-0.5 grid size-5 shrink-0 place-items-center rounded-full text-[10px]">
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
