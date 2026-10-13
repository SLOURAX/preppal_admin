"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useDeferredValue, useState } from "react";
import { AdminPageHeader, Pagination, SectionCard } from "@/components/admin-ui";
import { AdminShell } from "@/components/layout";
import { AdminIcon, Select, type AdminIconName } from "@/components/ui";
import { apiClient } from "@/lib/api/client";

type AuditEvent = { id: string; action: string; type: string; summary: string; actor: string; createdAt: string };
type ActivityResponse = { events: AuditEvent[]; pagination: { page: number; pageSize: number; total: number; pages: number } };

const ACTIVITY_ICONS: Record<string, AdminIconName> = {
  user: "users", settings: "settings", blog: "blog", question: "content", exam: "content",
  wallet: "finance", payment: "finance", payout: "withdrawals", reward: "rewards", subscription: "finance",
};
const iconFor = (type: string): AdminIconName => ACTIVITY_ICONS[type] ?? "analytics";
const formatTime = (date: string) => new Intl.DateTimeFormat("en-NG", { dateStyle: "medium", timeStyle: "short" }).format(new Date(date));

export default function ActivityPage() {
  const [type, setType] = useState("ALL");
  const [term, setTerm] = useState("");
  const deferredTerm = useDeferredValue(term);
  const [page, setPage] = useState(1);
  const query = useQuery({
    queryKey: ["admin", "activity", type, deferredTerm, page],
    queryFn: () => apiClient<ActivityResponse>(`/api/v1/admin/activity?${new URLSearchParams({ page: String(page), pageSize: "20", type, query: deferredTerm })}`),
    placeholderData: (previous) => previous,
  });
  const data = query.data;
  return <AdminShell><div className="mx-auto w-full max-w-[1380px] space-y-5">
    <AdminPageHeader actions={<Link className="border-border hover:bg-surface-subtle inline-flex h-9 items-center rounded-xl border px-3 text-[.65rem] font-bold" href="/dashboard">Back to overview</Link>} description="A persistent record of staff actions and operational changes across Preppal." eyebrow="Monitoring" title="Platform activity" />
    <SectionCard description="Search the live audit trail. New actions appear here as they are performed." title="Audit activity">
      <div className="border-border mb-2 grid gap-2 border-y py-3 sm:grid-cols-[1fr_170px_auto]">
        <input className="border-border bg-background h-9 rounded-xl border px-3 text-[.67rem] outline-none" onChange={(event) => { setTerm(event.target.value); setPage(1); }} placeholder="Search actions or administrators" value={term} />
        <Select className="border-border bg-background h-9 rounded-xl border px-3 text-[.65rem]" onChange={(event) => { setType(event.target.value); setPage(1); }} value={type}>
          <option value="ALL">All activity</option><option value="USER">Users</option><option value="SETTINGS">Settings</option><option value="BLOG">Blog</option><option value="QUESTION">Questions</option><option value="EXAM">Exam setup</option><option value="PAYMENT">Payments</option><option value="PAYOUT">Withdrawals</option><option value="REWARD">Rewards</option>
        </Select>
        <button className="text-primary h-9 rounded-xl px-3 text-[.63rem] font-bold" onClick={() => { setTerm(""); setType("ALL"); setPage(1); }} type="button">Reset</button>
      </div>
      {query.isLoading ? <div className="py-12 text-center text-xs text-muted-foreground">Loading activity…</div> : null}
      {query.isError ? <div className="py-12 text-center text-xs text-destructive">Unable to load the audit trail. Please retry.</div> : null}
      {!query.isLoading && !query.isError ? <div className="divide-border divide-y">
        {data?.events.map((event) => <article className="flex items-center gap-3 py-3" key={event.id}><span className="bg-surface-subtle text-primary grid size-9 shrink-0 place-items-center rounded-xl"><AdminIcon className="size-4" name={iconFor(event.type)} /></span><div className="min-w-0 flex-1"><p className="text-[.69rem] font-bold">{event.summary}</p><p className="text-muted-foreground mt-1 truncate text-[.6rem]">{event.actor} · {event.action}</p></div><time className="text-muted-foreground hidden text-right text-[.58rem] sm:block">{formatTime(event.createdAt)}</time></article>)}
        {!data?.events.length ? <div className="py-12 text-center"><p className="text-xs font-bold">No activity yet</p><p className="text-muted-foreground mt-1 text-[.65rem]">Staff changes and operational actions will be recorded here.</p></div> : null}
      </div> : null}
      {data ? <Pagination currentPage={data.pagination.page} itemLabel="events" onPageChange={setPage} pageSize={data.pagination.pageSize} totalItems={data.pagination.total} totalPages={data.pagination.pages} /> : null}
    </SectionCard>
  </div></AdminShell>;
}
