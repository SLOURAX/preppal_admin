"use client";

import { useMemo, useState } from "react";
import { AdminShell } from "@/components/layout";

type WithdrawalStatus = "Pending" | "Approved" | "Declined";

interface Withdrawal {
  readonly id: string;
  readonly user: string;
  readonly email: string;
  readonly coins: number;
  readonly amount: number;
  readonly method: string;
  readonly account: string;
  readonly requestedAt: string;
  status: WithdrawalStatus;
}

const INITIAL_WITHDRAWALS: Withdrawal[] = [
  { id: "WD-2048", user: "Amaka Okafor", email: "amaka.okafor@example.com", coins: 1240, amount: 1240, method: "Bank transfer", account: "•••• 4821", requestedAt: "2026-09-09", status: "Pending" },
  { id: "WD-2047", user: "Chinedu Eze", email: "chinedu.eze@example.com", coins: 2680, amount: 2680, method: "Bank transfer", account: "•••• 1093", requestedAt: "2026-09-08", status: "Pending" },
  { id: "WD-2046", user: "Ifeoma Nwosu", email: "ifeoma.nwosu@example.com", coins: 1760, amount: 1760, method: "Bank transfer", account: "•••• 7740", requestedAt: "2026-09-07", status: "Approved" },
  { id: "WD-2045", user: "Daniel Kalu", email: "daniel.kalu@example.com", coins: 530, amount: 530, method: "Bank transfer", account: "•••• 3388", requestedAt: "2026-09-06", status: "Declined" },
  { id: "WD-2044", user: "Yusuf Ibrahim", email: "yusuf.ibrahim@example.com", coins: 840, amount: 840, method: "Bank transfer", account: "•••• 2516", requestedAt: "2026-09-05", status: "Approved" },
  { id: "WD-2043", user: "Samuel Adeyemi", email: "samuel.adeyemi@example.com", coins: 300, amount: 300, method: "Bank transfer", account: "•••• 8602", requestedAt: "2026-09-03", status: "Pending" },
  { id: "WD-2042", user: "Fatima Abdullahi", email: "fatima.abdullahi@example.com", coins: 950, amount: 950, method: "Bank transfer", account: "•••• 1120", requestedAt: "2026-08-28", status: "Approved" },
];

const STATUS_OPTIONS = ["All statuses", "Pending", "Approved", "Declined"] as const;
const RANGE_OPTIONS = ["All time", "Today", "Last 7 days", "Last 30 days"] as const;
const PAGE_SIZE = 5;

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(amount);

const formatDate = (date: string) =>
  new Intl.DateTimeFormat("en-NG", { day: "numeric", month: "short", year: "numeric" }).format(new Date(date));

const initials = (name: string) =>
  name.split(" ").map((part) => part[0]).slice(0, 2).join("");

function StatusBadge({ status }: { readonly status: WithdrawalStatus }) {
  const styles: Record<WithdrawalStatus, string> = {
    Pending: "bg-amber-500/10 text-amber-700",
    Approved: "bg-emerald-500/10 text-emerald-700",
    Declined: "bg-rose-500/10 text-rose-700",
  };
  return <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${styles[status]}`}>{status}</span>;
}

export default function WithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState(INITIAL_WITHDRAWALS);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<(typeof STATUS_OPTIONS)[number]>("All statuses");
  const [range, setRange] = useState<(typeof RANGE_OPTIONS)[number]>("All time");
  const [page, setPage] = useState(1);
  const [now] = useState(() => Date.now());

  const filteredWithdrawals = useMemo(() => {
    const days = range === "Today" ? 1 : range === "Last 7 days" ? 7 : range === "Last 30 days" ? 30 : 0;
    const cutoff = days ? now - days * 86400000 : 0;
    const normalized = query.trim().toLowerCase();
    return withdrawals.filter((withdrawal) => {
      const matchesQuery = !normalized || `${withdrawal.id} ${withdrawal.user} ${withdrawal.email}`.toLowerCase().includes(normalized);
      const matchesStatus = status === "All statuses" || withdrawal.status === status;
      const matchesRange = !cutoff || new Date(withdrawal.requestedAt).getTime() >= cutoff;
      return matchesQuery && matchesStatus && matchesRange;
    });
  }, [now, query, range, status, withdrawals]);

  const totalPages = Math.max(1, Math.ceil(filteredWithdrawals.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const visibleWithdrawals = filteredWithdrawals.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const pending = withdrawals.filter((item) => item.status === "Pending");
  const approved = withdrawals.filter((item) => item.status === "Approved");
  const updateStatus = (id: string, nextStatus: WithdrawalStatus) => {
    setWithdrawals((items) => items.map((item) => (item.id === id ? { ...item, status: nextStatus } : item)));
  };
  const resetPage = () => setPage(1);

  return (
    <AdminShell>
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h1 className="mt-4 text-3xl font-bold tracking-tight">Withdrawals</h1>
            <p className="text-muted-foreground mt-2 max-w-2xl text-sm">
              Review requests to convert withdrawable Preppal Coins into NGN payouts. XP remains a learning balance and is never paid out directly.
            </p>
          </div>
          <span className="bg-amber-500/10 text-amber-700 rounded-full px-3 py-2 text-xs font-semibold">{pending.length} awaiting review</span>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            ["Pending review", pending.length.toString(), `${formatCurrency(pending.reduce((sum, item) => sum + item.amount, 0))} requested`, "amber"],
            ["Approved this period", approved.length.toString(), formatCurrency(approved.reduce((sum, item) => sum + item.amount, 0)), "green"],
            ["Average payout", formatCurrency(Math.round(withdrawals.reduce((sum, item) => sum + item.amount, 0) / withdrawals.length)), "per approved request", "purple"],
            ["Settlement window", "1–2 days", "after approval", "blue"],
          ].map(([label, value, detail, tone]) => (
            <article className="surface-card rounded-2xl p-5" key={label}>
              <div className={`mb-4 size-2 rounded-full ${tone === "amber" ? "bg-amber-500" : tone === "green" ? "bg-emerald-500" : tone === "blue" ? "bg-blue-500" : "bg-primary"}`} />
              <p className="text-muted-foreground text-xs font-medium">{label}</p>
              <p className="mt-2 text-2xl font-bold tracking-tight">{value}</p>
              <p className="text-muted-foreground mt-1 text-xs">{detail}</p>
            </article>
          ))}
        </section>

        <section className="surface-card overflow-hidden rounded-2xl">
          <div className="border-border flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <div>
              <h2 className="font-semibold">Withdrawal queue</h2>
              <p className="text-muted-foreground mt-1 text-xs">Confirm the recipient and amount before approving a payout.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <input
                aria-label="Search withdrawals"
                className="border-border bg-background placeholder:text-muted-foreground h-9 min-w-44 rounded-lg border px-3 text-xs outline-none focus:border-primary"
                onChange={(event) => { setQuery(event.target.value); resetPage(); }}
                placeholder="Search user or request ID"
                value={query}
              />
              <select className="border-border bg-background h-9 rounded-lg border px-2.5 text-xs" onChange={(event) => { setStatus(event.target.value as (typeof STATUS_OPTIONS)[number]); resetPage(); }} value={status}>
                {STATUS_OPTIONS.map((option) => <option key={option}>{option}</option>)}
              </select>
              <select className="border-border bg-background h-9 rounded-lg border px-2.5 text-xs" onChange={(event) => { setRange(event.target.value as (typeof RANGE_OPTIONS)[number]); resetPage(); }} value={range}>
                {RANGE_OPTIONS.map((option) => <option key={option}>{option}</option>)}
              </select>
            </div>
          </div>

          {visibleWithdrawals.length ? (
            <>
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full text-left text-sm">
                  <thead className="bg-surface-subtle/60 text-muted-foreground text-xs">
                    <tr><th className="px-5 py-3 font-semibold">Requester</th><th className="px-5 py-3 font-semibold">Amount</th><th className="px-5 py-3 font-semibold">Payout method</th><th className="px-5 py-3 font-semibold">Requested</th><th className="px-5 py-3 font-semibold">Status</th><th className="px-5 py-3 text-right font-semibold">Action</th></tr>
                  </thead>
                  <tbody className="divide-border divide-y">
                    {visibleWithdrawals.map((item) => <tr className="hover:bg-surface-subtle/30" key={item.id}>
                      <td className="px-5 py-4"><div className="flex items-center gap-3"><span className="bg-primary/10 text-primary grid size-9 place-items-center rounded-xl text-xs font-bold">{initials(item.user)}</span><div><p className="font-semibold">{item.user}</p><p className="text-muted-foreground mt-0.5 text-xs">{item.id} · {item.email}</p></div></div></td>
                      <td className="px-5 py-4"><p className="font-semibold">{formatCurrency(item.amount)}</p><p className="text-muted-foreground mt-0.5 text-xs">{item.coins.toLocaleString()} coins</p></td>
                      <td className="px-5 py-4"><p className="text-xs font-medium">{item.method}</p><p className="text-muted-foreground mt-0.5 text-xs">{item.account}</p></td>
                      <td className="text-muted-foreground px-5 py-4 text-xs">{formatDate(item.requestedAt)}</td>
                      <td className="px-5 py-4"><StatusBadge status={item.status} /></td>
                      <td className="px-5 py-4 text-right">{item.status === "Pending" ? <div className="inline-flex gap-2"><button className="border-danger text-danger hover:bg-danger/5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold" onClick={() => updateStatus(item.id, "Declined")}>Decline</button><button className="bg-primary text-primary-foreground hover:bg-primary-strong rounded-lg px-2.5 py-1.5 text-xs font-semibold" onClick={() => updateStatus(item.id, "Approved")}>Approve</button></div> : <span className="text-muted-foreground text-xs">Processed</span>}</td>
                    </tr>)}
                  </tbody>
                </table>
              </div>
              <div className="divide-border divide-y md:hidden">
                {visibleWithdrawals.map((item) => <article className="space-y-3 p-4" key={item.id}>
                  <div className="flex items-start justify-between gap-3"><div className="flex items-center gap-3"><span className="bg-primary/10 text-primary grid size-9 place-items-center rounded-xl text-xs font-bold">{initials(item.user)}</span><div><p className="text-sm font-semibold">{item.user}</p><p className="text-muted-foreground text-[11px]">{item.id} · {formatDate(item.requestedAt)}</p></div></div><StatusBadge status={item.status} /></div>
                  <div className="bg-surface-subtle/60 flex items-center justify-between rounded-xl px-3 py-2"><div><p className="text-muted-foreground text-[11px]">Payout</p><p className="text-sm font-bold">{formatCurrency(item.amount)}</p></div><p className="text-muted-foreground text-xs">{item.coins.toLocaleString()} coins · {item.account}</p></div>
                  {item.status === "Pending" ? <div className="grid grid-cols-2 gap-2"><button className="border-danger text-danger hover:bg-danger/5 rounded-lg border py-2 text-xs font-semibold" onClick={() => updateStatus(item.id, "Declined")}>Decline</button><button className="bg-primary text-primary-foreground hover:bg-primary-strong rounded-lg py-2 text-xs font-semibold" onClick={() => updateStatus(item.id, "Approved")}>Approve</button></div> : null}
                </article>)}
              </div>
              {totalPages > 1 ? <div className="border-border flex items-center justify-between border-t p-4"><button className="text-muted-foreground text-xs font-semibold disabled:opacity-40" disabled={currentPage === 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>← Previous</button><span className="text-muted-foreground text-xs">Page {currentPage} of {totalPages}</span><button className="text-primary text-xs font-semibold disabled:opacity-40" disabled={currentPage === totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))}>Next →</button></div> : null}
            </>
          ) : <div className="p-12 text-center"><p className="font-semibold">No withdrawal requests found</p><p className="text-muted-foreground mt-1 text-sm">Try changing your filters or search term.</p></div>}
        </section>

        <p className="text-muted-foreground text-xs">Payout actions should be reconciled against your payment provider. Approving a request is the point at which the user’s withdrawable coin balance is reserved.</p>
      </div>
    </AdminShell>
  );
}
