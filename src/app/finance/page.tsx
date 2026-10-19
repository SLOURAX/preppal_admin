"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import {
  ArrowDownToLine,
  ArrowLeftRight,
  ArrowRight,
  ArrowUpFromLine,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  Coins,
  Bot,
  TrendingDown,
  WalletCards,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";

import { AdminPageHeader, SegmentedControl } from "@/components/admin-ui";
import { AdminShell } from "@/components/layout";
import { apiClient } from "@/lib/api/client";
import { ExportCsvButton } from "@/components/export-csv-button";

type Period = "7" | "30" | "90" | "180" | "0";

interface WalletResponse {
  generatedAt: string;
  period: Period;
  stats: {
    coinsCirculating: number;
    activeWallets: number;
    totalDepositedMinor: number;
    totalWithdrawnMinor: number;
    netLiquidityMinor: number;
    averageDepositMinor: number;
    averageWithdrawalMinor: number;
    depositCount: number;
    withdrawalCount: number;
    pendingWithdrawalsCoins: number;
    pendingWithdrawalsMinor: number;
    pendingWithdrawalsCount: number;
    depositedWalletBalanceMinor: number;
    pendingWalletBalanceMinor: number;
  };
  flow: Array<{
    date: string;
    depositsMinor: number;
    withdrawalsMinor: number;
  }>;
  recentTransactions: Array<{
    id: string;
    user: string;
    email: string;
    type: "Deposit" | "Withdrawal";
    amountMinor: number;
    coinAmount: number | null;
    status: string;
    createdAt: string;
  }>;
  topHolders: Array<{
    id: string;
    name: string;
    balance: number;
    plan: string;
  }>;
  insights: {
    topHolderSharePercentage: number;
    withdrawalToDepositPercentage: number;
  };
}

const fmt = (value: number) => value.toLocaleString("en-NG");
const fmtNGN = (minor: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(minor / 100);
const dateTime = (value: string) =>
  new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
    hour12: true,
  }).format(new Date(value));

const PERIOD_OPTIONS: { value: Period; label: string }[] = [
  { value: "7", label: "Last 7 days" },
  { value: "30", label: "Last 30 days" },
  { value: "90", label: "Last 3 months" },
  { value: "180", label: "Last 6 months" },
  { value: "0", label: "All time" },
];

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
      <span className={`grid size-9 place-items-center rounded-xl ${tone}`}>
        <Icon className="size-[17px]" strokeWidth={1.9} />
      </span>
      <p className="text-foreground mt-3 text-xl font-bold">{value}</p>
      <p className="text-foreground text-[.75rem] font-medium">{label}</p>
      <p className="text-muted-foreground mt-0.5 text-[11px]">{sub}</p>
    </article>
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
      className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${styles[plan] ?? "bg-primary/10 text-primary"}`}
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
    Expired: "bg-slate-500/10 text-slate-600",
    Refunded: "bg-blue-500/10 text-blue-600",
  };
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${styles[status] ?? "bg-surface-subtle text-muted-foreground"}`}
    >
      {status}
    </span>
  );
}

export default function WalletOverviewPage() {
  const [period, setPeriod] = useState<Period>("30");
  const query = useQuery({
    queryKey: ["admin", "wallets", period],
    queryFn: () =>
      apiClient<WalletResponse>(`/api/v1/admin/wallets?period=${period}`),
  });
  const data = query.data;
  const maxFlow = Math.max(
    1,
    ...(data?.flow.map((item) =>
      Math.max(item.depositsMinor, item.withdrawalsMinor),
    ) ?? [1]),
  );

  return (
    <AdminShell>
      <AdminPageHeader
        actions={
          <SegmentedControl
            ariaLabel="Wallet reporting period"
            onChange={setPeriod}
            options={PERIOD_OPTIONS}
            value={period}
          />
        }
        className="mb-6"
        description="Live wallet balances, settled deposits, payouts, and liquidity from the platform ledger."
        eyebrow="Commerce"
        title="Wallet overview"
      />

      {query.isLoading ? (
        <div className="text-muted-foreground flex min-h-72 items-center justify-center gap-2 text-xs">
          <span className="border-primary size-5 animate-spin rounded-full border-2 border-t-transparent" />
          Loading wallet activity…
        </div>
      ) : query.isError || !data ? (
        <div className="surface-card rounded-2xl p-10 text-center">
          <p className="text-foreground text-sm font-bold">
            Wallet data is unavailable
          </p>
          <p className="text-muted-foreground mt-1 text-xs">
            The live wallet records could not be loaded.
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
          <section className="mb-8">
            <SectionTitle
              title="Wallet health"
              sub="Balances are current; transaction KPIs follow the selected reporting period"
            />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
              <KpiCard
                label="Coins in circulation"
                value={fmt(data.stats.coinsCirculating)}
                sub="Current withdrawable balances"
                icon={Coins}
                tone="bg-amber-500/10 text-amber-600"
              />
              <KpiCard
                label="Active wallets"
                value={fmt(data.stats.activeWallets)}
                sub="Wallets with a non-zero balance"
                icon={WalletCards}
              />
              <KpiCard
                label="Net settled flow"
                value={fmtNGN(data.stats.netLiquidityMinor)}
                sub="Deposits minus successful payouts"
                icon={ArrowLeftRight}
                tone="bg-emerald-500/10 text-emerald-600"
              />
              <KpiCard
                label="Pending withdrawals"
                value={fmt(data.stats.pendingWithdrawalsCount)}
                sub={`${fmt(data.stats.pendingWithdrawalsCoins)} coins · ${fmtNGN(data.stats.pendingWithdrawalsMinor)}`}
                icon={Clock3}
                tone="bg-amber-500/10 text-amber-600"
              />
              <KpiCard
                label="Settled deposits"
                value={fmtNGN(data.stats.totalDepositedMinor)}
                sub={`${fmt(data.stats.depositCount)} transactions in period`}
                icon={ArrowDownToLine}
                tone="bg-emerald-500/10 text-emerald-600"
              />
              <KpiCard
                label="Settled withdrawals"
                value={fmtNGN(data.stats.totalWithdrawnMinor)}
                sub={`${fmt(data.stats.withdrawalCount)} payouts in period`}
                icon={ArrowUpFromLine}
                tone="bg-rose-500/10 text-rose-600"
              />
              <KpiCard
                label="Average deposit"
                value={fmtNGN(data.stats.averageDepositMinor)}
                sub="Per settled wallet deposit"
                icon={CircleDollarSign}
                tone="bg-emerald-500/10 text-emerald-600"
              />
              <KpiCard
                label="Average withdrawal"
                value={fmtNGN(data.stats.averageWithdrawalMinor)}
                sub="Per completed payout"
                icon={TrendingDown}
                tone="bg-rose-500/10 text-rose-600"
              />
            </div>
          </section>

          <section className="mb-8">
            <SectionTitle
              title="Settled cash flow"
              sub="Daily successful wallet deposits versus completed payouts in naira"
            />
            <div className="surface-card rounded-2xl p-5">
              <div className="flex h-44 items-end gap-1.5 overflow-x-auto">
                {data.flow.map((item) => (
                  <div
                    className="flex min-w-4 flex-1 flex-col items-center gap-1"
                    key={item.date}
                  >
                    <div className="flex h-36 w-full items-end gap-px">
                      <div
                        className="flex-1 rounded-t-sm bg-emerald-500/80 transition-colors hover:bg-emerald-500"
                        style={{
                          height: `${item.depositsMinor ? Math.max(3, (item.depositsMinor / maxFlow) * 140) : 0}px`,
                        }}
                        title={`${item.date} deposits: ${fmtNGN(item.depositsMinor)}`}
                      />
                      <div
                        className="flex-1 rounded-t-sm bg-rose-500/70 transition-colors hover:bg-rose-500"
                        style={{
                          height: `${item.withdrawalsMinor ? Math.max(3, (item.withdrawalsMinor / maxFlow) * 140) : 0}px`,
                        }}
                        title={`${item.date} withdrawals: ${fmtNGN(item.withdrawalsMinor)}`}
                      />
                    </div>
                    <span className="text-muted-foreground text-[8px]">
                      {item.date.slice(5)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-5 flex items-center justify-center gap-6">
                <div className="flex items-center gap-1.5">
                  <span className="inline-block size-3 rounded-sm bg-emerald-500/80" />
                  <span className="text-muted-foreground text-[11px] font-semibold">
                    Deposits
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="inline-block size-3 rounded-sm bg-rose-500/70" />
                  <span className="text-muted-foreground text-[11px] font-semibold">
                    Withdrawals
                  </span>
                </div>
              </div>
            </div>
          </section>

          <section className="mb-8">
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <div className="mb-5 flex items-end justify-between gap-3">
                  <SectionTitle
                    title="Recent wallet transactions"
                    sub="Latest deposits and withdrawal requests across all statuses"
                  />
                  <ExportCsvButton
                    filename={`preppal-wallet-transactions-${new Date().toISOString().slice(0, 10)}`}
                    rows={(data?.recentTransactions ?? []).map((item) => ({
                      ID: item.id,
                      User: item.user,
                      Email: item.email,
                      Type: item.type,
                      "Amount (NGN)": item.amountMinor / 100,
                      Coins: item.coinAmount,
                      Status: item.status,
                      Date: item.createdAt,
                    }))}
                  />
                </div>
                <div className="surface-card rounded-2xl p-5">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-border text-muted-foreground border-b text-xs">
                          <th className="pb-3 font-medium">Transaction</th>
                          <th className="pb-3 font-medium">User</th>
                          <th className="pb-3 text-right font-medium">
                            Amount
                          </th>
                          <th className="pb-3 text-center font-medium">
                            Status
                          </th>
                          <th className="pb-3 text-right font-medium">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-border divide-y">
                        {data.recentTransactions.map((transaction) => (
                          <tr
                            className="hover:bg-surface-subtle transition-colors"
                            key={`${transaction.type}-${transaction.id}`}
                          >
                            <td className="py-3 pr-4">
                              <p className="text-foreground font-semibold">
                                {transaction.id.slice(0, 8)}
                              </p>
                              <p className="text-muted-foreground text-[10px]">
                                {transaction.type}
                              </p>
                            </td>
                            <td className="py-3 pr-4">
                              <p className="text-foreground text-xs font-semibold">
                                {transaction.user}
                              </p>
                              <p className="text-muted-foreground text-[10px]">
                                {transaction.email}
                              </p>
                            </td>
                            <td className="py-3 pr-4 text-right">
                              <span
                                className={`font-bold ${transaction.amountMinor >= 0 ? "text-emerald-600" : "text-rose-600"}`}
                              >
                                {transaction.amountMinor >= 0 ? "+" : "−"}
                                {fmtNGN(Math.abs(transaction.amountMinor))}
                              </span>
                              {transaction.coinAmount ? (
                                <p className="text-muted-foreground text-[9px]">
                                  {fmt(transaction.coinAmount)} coins
                                </p>
                              ) : null}
                            </td>
                            <td className="py-3 pr-4 text-center">
                              <StatusBadge status={transaction.status} />
                            </td>
                            <td className="text-muted-foreground py-3 text-right text-[10px]">
                              {dateTime(transaction.createdAt)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {!data.recentTransactions.length ? (
                    <p className="text-muted-foreground py-10 text-center text-xs">
                      No wallet transactions have been recorded yet.
                    </p>
                  ) : null}
                  <Link
                    className="text-primary border-border mt-3 inline-flex items-center gap-1.5 border-t pt-3 text-[.64rem] font-bold"
                    href="/finance/deposits"
                  >
                    View all payments <ArrowRight className="size-3.5" />
                  </Link>
                </div>
              </div>

              <div>
                <SectionTitle
                  title="Top coin holders"
                  sub="Largest current withdrawable balances"
                />
                <div className="surface-card rounded-2xl p-5">
                  <div className="divide-border divide-y">
                    {data.topHolders.map((holder, index) => (
                      <div
                        className="flex items-center gap-3 py-2.5"
                        key={holder.id}
                      >
                        <span className="text-muted-foreground w-4 shrink-0 text-center text-xs font-bold">
                          {index + 1}
                        </span>
                        <div className="bg-primary/10 text-primary grid size-8 shrink-0 place-items-center rounded-full text-xs font-bold">
                          {holder.name.slice(0, 1)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-foreground truncate text-xs font-semibold">
                            {holder.name}
                          </p>
                          <PlanBadge plan={holder.plan} />
                        </div>
                        <span className="text-right text-xs font-bold text-amber-600">
                          {fmt(holder.balance)} coins
                        </span>
                      </div>
                    ))}
                  </div>
                  {!data.topHolders.length ? (
                    <p className="text-muted-foreground py-8 text-center text-xs">
                      No funded wallets yet.
                    </p>
                  ) : null}
                  <Link
                    className="text-primary border-border mt-3 inline-flex items-center gap-1.5 border-t pt-3 text-[.64rem] font-bold"
                    href="/users"
                  >
                    View all learners <ArrowRight className="size-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </section>

          <section className="mb-2">
            <div className="surface-card via-surface to-surface rounded-2xl border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 p-5 sm:p-6">
              <div className="mb-4 flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-xl bg-emerald-500 text-white">
                  <Bot className="size-[18px]" strokeWidth={1.9} />
                </span>
                <div>
                  <p className="text-foreground font-bold">
                    Wallet risk and insights
                  </p>
                  <p className="text-muted-foreground text-xs">
                    Calculated from the selected settled transaction window
                  </p>
                </div>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {[
                  `Withdrawals are ${data.insights.withdrawalToDepositPercentage}% of settled deposits for this period.`,
                  `${fmt(data.stats.pendingWithdrawalsCount)} withdrawal request${data.stats.pendingWithdrawalsCount === 1 ? " is" : "s are"} awaiting settlement, worth ${fmt(data.stats.pendingWithdrawalsCoins)} coins.`,
                  `The six largest visible balances hold ${data.insights.topHolderSharePercentage}% of circulating coins.`,
                  `${fmtNGN(data.stats.depositedWalletBalanceMinor)} remains in spend-only deposited balances across learner wallets.`,
                ].map((insight) => (
                  <div
                    className="bg-surface/60 flex items-start gap-3 rounded-xl p-3"
                    key={insight}
                  >
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                    <p className="text-foreground text-xs leading-5">
                      {insight}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </>
      )}
    </AdminShell>
  );
}
