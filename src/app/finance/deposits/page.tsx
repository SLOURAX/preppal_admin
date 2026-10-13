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

interface Payment {
  id: string;
  purpose: "WALLET_DEPOSIT" | "PLAN_PURCHASE";
  status: "PENDING" | "SUCCEEDED" | "FAILED" | "EXPIRED" | "REFUNDED";
  amountMinor: number;
  providerReference: string;
  createdAt: string;
  user: { fullName: string; email: string };
  plan: { name: string } | null;
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
const summaries = (items: Payment[]) => {
  const paid = items.filter((item) => item.status === "SUCCEEDED");
  return [
    {
      label: "Settled volume",
      value: money(paid.reduce((sum, item) => sum + item.amountMinor, 0)),
      detail: `${paid.length} confirmed`,
      icon: "finance" as AdminIconName,
    },
    {
      label: "Wallet deposits",
      value: String(
        items.filter((item) => item.purpose === "WALLET_DEPOSIT").length,
      ),
      detail: "Spend-only balance",
      icon: "deposits" as AdminIconName,
    },
    {
      label: "Plan purchases",
      value: String(
        items.filter((item) => item.purpose === "PLAN_PURCHASE").length,
      ),
      detail: "Monthly and annual",
      icon: "rewards" as AdminIconName,
    },
    {
      label: "Pending",
      value: String(items.filter((item) => item.status === "PENDING").length),
      detail: "Awaiting Bachs",
      icon: "analytics" as AdminIconName,
    },
  ];
};

const PAGE_SIZE = 8;

const paymentTone = (status: Payment["status"]) => {
  if (status === "SUCCEEDED") return "success" as const;
  if (status === "PENDING") return "warning" as const;
  return "danger" as const;
};

export default function DepositsPage() {
  const [queryText, setQueryText] = useState("");
  const [status, setStatus] = useState("ALL");
  const [purpose, setPurpose] = useState("ALL");
  const [page, setPage] = useState(1);
  const query = useQuery({
    queryKey: ["admin", "finance", "payments"],
    queryFn: () => apiClient<Payment[]>("/api/v1/admin/finance/payments"),
  });
  const payments = useMemo(() => query.data ?? [], [query.data]);
  const filteredPayments = useMemo(() => {
    const normalized = queryText.trim().toLowerCase();
    return payments.filter((item) => {
      const matchesSearch =
        !normalized ||
        `${item.user.fullName} ${item.user.email} ${item.providerReference}`
          .toLowerCase()
          .includes(normalized);
      const matchesStatus = status === "ALL" || item.status === status;
      const matchesPurpose = purpose === "ALL" || item.purpose === purpose;
      return matchesSearch && matchesStatus && matchesPurpose;
    });
  }, [payments, purpose, queryText, status]);
  const totalPages = Math.max(
    1,
    Math.ceil(filteredPayments.length / PAGE_SIZE),
  );
  const currentPage = Math.min(page, totalPages);
  const visiblePayments = filteredPayments.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  return (
    <AdminShell>
      <div className="mx-auto max-w-[1420px] space-y-5">
        <AdminPageHeader
          description="Live Bachs wallet deposits and premium-plan purchases. Signed provider events remain the settlement source of truth."
          eyebrow="Commerce"
          title="Payments"
        />
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {summaries(payments).map(({ label, value, detail, icon }, index) => (
            <MetricCard
              accent={
                index === 0
                  ? "bg-emerald-500/10 text-emerald-600"
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
          description="References and statuses are read-only and provider-backed."
          title="Bachs payment ledger"
        >
          <div className="border-border mb-3 grid gap-2 border-y py-3 md:grid-cols-[1fr_180px_190px_auto]">
            <input
              className="border-border bg-background text-foreground placeholder:text-muted-foreground focus:border-primary h-9 rounded-xl border px-3 text-[.67rem] outline-none"
              onChange={(event) => {
                setQueryText(event.target.value);
                setPage(1);
              }}
              placeholder="Search customer, email, or reference"
              value={queryText}
            />
            <Select
              className="border-border bg-background text-foreground h-9 rounded-xl border px-3 text-[.65rem] outline-none"
              onChange={(event) => {
                setPurpose(event.target.value);
                setPage(1);
              }}
              value={purpose}
            >
              <option value="ALL">All payment types</option>
              <option value="WALLET_DEPOSIT">Wallet deposits</option>
              <option value="PLAN_PURCHASE">Plan purchases</option>
            </Select>
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
              <option value="EXPIRED">Expired</option>
              <option value="REFUNDED">Refunded</option>
            </Select>
            <button
              className="text-primary hover:bg-primary/10 h-9 rounded-xl px-3 text-[.63rem] font-bold"
              onClick={() => {
                setQueryText("");
                setPurpose("ALL");
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
              Loading payments…
            </div>
          ) : query.isError ? (
            <div className="p-10 text-center">
              <p className="font-semibold">Could not load payments</p>
              <button
                className="text-primary mt-2 text-xs font-bold"
                onClick={() => query.refetch()}
              >
                Try again
              </button>
            </div>
          ) : filteredPayments.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] text-left text-[.67rem]">
                <thead className="bg-surface-subtle text-muted-foreground text-[.61rem]">
                  <tr>
                    <th className="px-5 py-3">Customer</th>
                    <th className="px-5 py-3">Purpose</th>
                    <th className="px-5 py-3">Amount</th>
                    <th className="px-5 py-3">Reference</th>
                    <th className="px-5 py-3">Created</th>
                    <th className="px-5 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-border divide-y">
                  {visiblePayments.map((item) => (
                    <tr className="hover:bg-surface-subtle/60" key={item.id}>
                      <td className="px-5 py-3">
                        <p className="font-semibold">{item.user.fullName}</p>
                        <p className="text-muted-foreground text-xs">
                          {item.user.email}
                        </p>
                      </td>
                      <td className="px-5 py-3 text-[.64rem]">
                        {item.purpose === "PLAN_PURCHASE"
                          ? (item.plan?.name ?? "Plan")
                          : "Wallet deposit"}
                      </td>
                      <td className="px-5 py-3 font-semibold">
                        {money(item.amountMinor)}
                      </td>
                      <td className="text-muted-foreground max-w-52 truncate px-5 py-3 font-mono text-[.59rem]">
                        {item.providerReference}
                      </td>
                      <td className="text-muted-foreground px-5 py-3 text-[.61rem]">
                        {date(item.createdAt)}
                      </td>
                      <td className="px-5 py-3">
                        <StatusBadge tone={paymentTone(item.status)}>
                          {item.status}
                        </StatusBadge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center text-xs">
              <p className="font-semibold">No payments yet</p>
              <p className="text-muted-foreground mt-1">
                New Bachs checkouts or matching filtered results will appear
                here.
              </p>
            </div>
          )}
          <Pagination
            currentPage={currentPage}
            itemLabel="payments"
            onPageChange={setPage}
            pageSize={PAGE_SIZE}
            totalItems={filteredPayments.length}
            totalPages={totalPages}
          />
        </SectionCard>
      </div>
    </AdminShell>
  );
}
