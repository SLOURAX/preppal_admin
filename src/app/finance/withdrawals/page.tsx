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
import { Select, type AdminIconName } from "@/components/ui";
import { apiClient } from "@/lib/api/client";

interface Payout {
  id: string;
  coinAmount: number;
  amountMinor: number;
  providerReference: string;
  status: "PENDING" | "SUCCEEDED" | "FAILED";
  failureReason: string | null;
  createdAt: string;
  user: {
    fullName: string;
    email: string;
    payoutAccount: { bankName: string; accountNumberLast4: string } | null;
  };
}

const money = (minor: number) =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(
    minor / 100,
  );
const date = (value: string) =>
  new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
const summaries = (items: Payout[]) => {
  const paid = items.filter((item) => item.status === "SUCCEEDED");
  const pending = items.filter((item) => item.status === "PENDING");
  return [
    {
      label: "Paid",
      value: money(paid.reduce((sum, item) => sum + item.amountMinor, 0)),
      detail: `${paid.length} settled`,
      icon: "finance" as AdminIconName,
    },
    {
      label: "Pending",
      value: String(pending.length),
      detail: `${money(pending.reduce((sum, item) => sum + item.amountMinor, 0))} reserved`,
      icon: "analytics" as AdminIconName,
    },
    {
      label: "Failed",
      value: String(items.filter((item) => item.status === "FAILED").length),
      detail: "Coins automatically released",
      icon: "content" as AdminIconName,
    },
    {
      label: "All requests",
      value: String(items.length),
      detail: "Provider-backed records",
      icon: "withdrawals" as AdminIconName,
    },
  ];
};

const PAGE_SIZE = 8;

const payoutTone = (status: Payout["status"]) => {
  if (status === "SUCCEEDED") return "success" as const;
  if (status === "PENDING") return "warning" as const;
  return "danger" as const;
};

export default function WithdrawalsPage() {
  const [queryText, setQueryText] = useState("");
  const [status, setStatus] = useState("ALL");
  const [page, setPage] = useState(1);
  const query = useQuery({
    queryKey: ["admin", "finance", "payouts"],
    queryFn: () => apiClient<Payout[]>("/api/v1/admin/finance/payouts"),
  });
  const payouts = useMemo(() => query.data ?? [], [query.data]);
  const filteredPayouts = useMemo(() => {
    const normalized = queryText.trim().toLowerCase();
    return payouts.filter((item) => {
      const matchesSearch =
        !normalized ||
        `${item.user.fullName} ${item.user.email} ${item.providerReference} ${item.user.payoutAccount?.bankName ?? ""}`
          .toLowerCase()
          .includes(normalized);
      const matchesStatus = status === "ALL" || item.status === status;
      return matchesSearch && matchesStatus;
    });
  }, [payouts, queryText, status]);
  const totalPages = Math.max(1, Math.ceil(filteredPayouts.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const visiblePayouts = filteredPayouts.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  return (
    <AdminShell>
      <div className="mx-auto max-w-[1420px] space-y-5">
        <AdminPageHeader
          description="Real-time Bachs Connect transfers and learner bank payouts. Signed provider events remain the settlement source of truth."
          eyebrow="Commerce"
          title="Withdrawals"
        />
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {summaries(payouts).map(({ label, value, detail, icon }, index) => (
            <MetricCard
              accent={
                index === 0
                  ? "bg-emerald-500/10 text-emerald-600"
                  : index === 2
                    ? "bg-rose-500/10 text-rose-600"
                    : "bg-primary/10 text-primary"
              }
              detail={detail}
              icon={icon}
              key={label}
              label={label}
              value={value}
            />
          ))}
        </section>
        <SectionCard
          description="Coins are reserved while payouts are pending and released automatically on failure."
          title="Bachs payout ledger"
        >
          <div className="border-border mb-3 grid gap-2 border-y py-3 md:grid-cols-[1fr_190px_auto]">
            <input
              className="border-border bg-background text-foreground placeholder:text-muted-foreground focus:border-primary h-9 rounded-xl border px-3 text-[.67rem] outline-none"
              onChange={(event) => {
                setQueryText(event.target.value);
                setPage(1);
              }}
              placeholder="Search learner, bank, email, or reference"
              value={queryText}
            />
            <Select
              className="border-border bg-background text-foreground h-9 rounded-xl border px-3 text-[.65rem] outline-none"
              onChange={(event) => {
                setStatus(event.target.value);
                setPage(1);
              }}
              value={status}
            >
              <option value="ALL">All statuses</option>
              <option value="SUCCEEDED">Succeeded</option>
              <option value="PENDING">Pending</option>
              <option value="FAILED">Failed</option>
            </Select>
            <button
              className="text-primary hover:bg-primary/10 h-9 rounded-xl px-3 text-[.63rem] font-bold"
              onClick={() => {
                setQueryText("");
                setStatus("ALL");
                setPage(1);
              }}
              type="button"
            >
              Reset filters
            </button>
          </div>
          {query.isLoading ? (
            <div className="text-muted-foreground flex min-h-56 items-center justify-center gap-2 text-xs">
              <span className="border-primary size-5 animate-spin rounded-full border-2 border-t-transparent" />{" "}
              Loading payouts…
            </div>
          ) : query.isError ? (
            <div className="p-10 text-center">
              <p className="font-semibold">Could not load payouts</p>
              <button
                className="text-primary mt-2 text-xs font-bold"
                onClick={() => query.refetch()}
              >
                Try again
              </button>
            </div>
          ) : filteredPayouts.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-[.67rem]">
                <thead className="bg-surface-subtle text-muted-foreground text-[.61rem]">
                  <tr>
                    <th className="px-5 py-3">Learner</th>
                    <th className="px-5 py-3">Bank</th>
                    <th className="px-5 py-3">Value</th>
                    <th className="px-5 py-3">Reference</th>
                    <th className="px-5 py-3">Requested</th>
                    <th className="px-5 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-border divide-y">
                  {visiblePayouts.map((item) => (
                    <tr className="hover:bg-surface-subtle/60" key={item.id}>
                      <td className="px-5 py-3">
                        <p className="font-semibold">{item.user.fullName}</p>
                        <p className="text-muted-foreground text-xs">
                          {item.user.email}
                        </p>
                      </td>
                      <td className="px-5 py-3">
                        <p className="text-xs font-medium">
                          {item.user.payoutAccount?.bankName ?? "Unavailable"}
                        </p>
                        <p className="text-muted-foreground text-[11px]">
                          ••••{" "}
                          {item.user.payoutAccount?.accountNumberLast4 ??
                            "----"}
                        </p>
                      </td>
                      <td className="px-5 py-3">
                        <p className="font-semibold">
                          {money(item.amountMinor)}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          {item.coinAmount.toLocaleString()} coins
                        </p>
                      </td>
                      <td className="text-muted-foreground max-w-52 truncate px-5 py-3 font-mono text-[.59rem]">
                        {item.providerReference}
                      </td>
                      <td className="text-muted-foreground px-5 py-3 text-[.61rem]">
                        {date(item.createdAt)}
                      </td>
                      <td className="px-5 py-3">
                        <StatusBadge tone={payoutTone(item.status)}>
                          {item.status}
                        </StatusBadge>
                        {item.failureReason ? (
                          <p className="mt-1 max-w-40 text-[10px] text-rose-600">
                            {item.failureReason}
                          </p>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center text-xs">
              <p className="font-semibold">No withdrawals yet</p>
              <p className="text-muted-foreground mt-1">
                Learner payout requests or matching filtered results will appear
                here.
              </p>
            </div>
          )}
          <Pagination
            currentPage={currentPage}
            itemLabel="withdrawals"
            onPageChange={setPage}
            pageSize={PAGE_SIZE}
            totalItems={filteredPayouts.length}
            totalPages={totalPages}
          />
        </SectionCard>
      </div>
    </AdminShell>
  );
}
