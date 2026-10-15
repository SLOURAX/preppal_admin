"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  Bot,
  BrainCircuit,
  CircleDollarSign,
  Clock3,
  Database,
  Gauge,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";

import {
  AdminPageHeader,
  Pagination,
  SegmentedControl,
} from "@/components/admin-ui";
import { AdminShell } from "@/components/layout";
import { apiClient } from "@/lib/api/client";

type Period = "1" | "7" | "30" | "90" | "180" | "0" | "custom";
type RequestStatus = "PENDING" | "SUCCEEDED" | "FAILED" | "REJECTED";

interface UsageBreakdown {
  requests: number;
  totalTokens: number;
  estimatedCostUsd: number;
}

interface AiUsageResponse {
  generatedAt: string;
  summary: {
    requests: number;
    succeeded: number;
    failed: number;
    successRate: number;
    inputTokens: number;
    cachedInputTokens: number;
    cacheWriteTokens: number;
    outputTokens: number;
    reasoningTokens: number;
    totalTokens: number;
    estimatedCostUsd: number;
    averageLatencyMs: number;
  };
  byTask: Array<UsageBreakdown & { taskType: string }>;
  byModel: Array<UsageBreakdown & { model: string }>;
  byStatus: Array<{ status: RequestStatus; requests: number }>;
  topUsers: Array<
    UsageBreakdown & {
      userId: string | null;
      name: string;
      email: string | null;
    }
  >;
  daily: Array<{
    date: string;
    requests: number;
    tokens: number;
    estimatedCostUsd: number;
  }>;
  filters: { tasks: string[]; models: string[] };
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
  recent: Array<{
    id: string;
    taskType: string;
    provider: string;
    model: string;
    promptVersion: string;
    status: RequestStatus;
    inputTokens: number;
    cachedInputTokens: number;
    outputTokens: number;
    reasoningTokens: number;
    totalTokens: number;
    estimatedCostUsd: number;
    costEstimated: boolean;
    latencyMs: number | null;
    errorCode: string | null;
    user: { id: string; fullName: string; email: string } | null;
    createdAt: string;
  }>;
}

const PERIODS = [
  { value: "1", label: "Today" },
  { value: "7", label: "7 days" },
  { value: "30", label: "30 days" },
  { value: "90", label: "3 months" },
  { value: "0", label: "All time" },
  { value: "custom", label: "Custom" },
] satisfies Array<{ value: Period; label: string }>;

const number = (value: number) => value.toLocaleString("en-NG");
const usd = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: value < 0.01 ? 4 : 2,
    maximumFractionDigits: value < 0.01 ? 6 : 2,
  }).format(value);
const dateTime = (value: string) =>
  new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
    hour12: true,
  }).format(new Date(value));

function Status({ value }: { readonly value: RequestStatus }) {
  const styles: Record<RequestStatus, string> = {
    SUCCEEDED: "bg-emerald-500/10 text-emerald-700",
    FAILED: "bg-rose-500/10 text-rose-700",
    REJECTED: "bg-amber-500/10 text-amber-700",
    PENDING: "bg-blue-500/10 text-blue-700",
  };
  return (
    <span
      className={`rounded-full px-2 py-1 text-[10px] font-bold ${styles[value]}`}
    >
      {value.toLowerCase()}
    </span>
  );
}

function BreakdownList({
  items,
}: {
  readonly items: Array<
    UsageBreakdown & ({ model: string } | { taskType: string })
  >;
}) {
  const max = Math.max(1, ...items.map((item) => item.totalTokens));
  if (!items.length)
    return (
      <p className="text-muted-foreground py-10 text-center text-xs">
        Usage will appear after the first AI request.
      </p>
    );
  return (
    <div className="space-y-4">
      {items.map((item) => {
        const label = "model" in item ? item.model : item.taskType;
        return (
          <div key={label}>
            <div className="mb-1.5 flex items-center justify-between gap-3 text-xs">
              <span className="text-foreground min-w-0 truncate font-semibold">
                {label}
              </span>
              <span className="text-muted-foreground shrink-0">
                {number(item.totalTokens)} tokens · {usd(item.estimatedCostUsd)}
              </span>
            </div>
            <div className="bg-surface-subtle h-2 overflow-hidden rounded-full">
              <div
                className="bg-primary h-full rounded-full"
                style={{
                  width: `${Math.max(2, (item.totalTokens / max) * 100)}%`,
                }}
              />
            </div>
            <p className="text-muted-foreground mt-1 text-[10px]">
              {number(item.requests)} request{item.requests === 1 ? "" : "s"}
            </p>
          </div>
        );
      })}
    </div>
  );
}

export default function AiUsagePage() {
  const [period, setPeriod] = useState<Period>("30");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [taskType, setTaskType] = useState("");
  const [model, setModel] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const queryString = useMemo(() => {
    const params = new URLSearchParams({
      period,
      page: String(page),
      pageSize: String(pageSize),
    });
    if (period === "custom" && from && to) {
      params.set("from", from);
      params.set("to", to);
    }
    if (taskType) params.set("taskType", taskType);
    if (model) params.set("model", model);
    if (status) params.set("status", status);
    return params.toString();
  }, [from, model, page, period, status, taskType, to]);
  const query = useQuery({
    queryKey: ["admin", "ai-usage", queryString],
    queryFn: () =>
      apiClient<AiUsageResponse>(`/api/v1/admin/ai-usage?${queryString}`),
    enabled: period !== "custom" || Boolean(from && to),
  });
  const data = query.data;
  const resetPage = (update: () => void) => {
    update();
    setPage(1);
  };
  const maxDaily = Math.max(
    1,
    ...(data?.daily.map((item) => item.tokens) ?? []),
  );

  return (
    <AdminShell>
      <AdminPageHeader
        actions={
          <SegmentedControl
            ariaLabel="AI usage reporting period"
            onChange={(value) => resetPage(() => setPeriod(value))}
            options={PERIODS}
            value={period}
          />
        }
        className="mb-6"
        description="Token consumption, estimated model cost, reliability, and the tasks driving AI usage. Prompt and response content is not stored."
        eyebrow="Insights"
        title="AI usage"
      />

      {period === "custom" ? (
        <div className="surface-card mb-4 grid gap-3 p-4 sm:grid-cols-2">
          <label className="text-muted-foreground text-[11px] font-semibold">
            From
            <input
              className="border-border bg-surface text-foreground mt-1 block h-10 w-full rounded-xl border px-3 text-xs"
              max={to || undefined}
              onChange={(event) => resetPage(() => setFrom(event.target.value))}
              type="date"
              value={from}
            />
          </label>
          <label className="text-muted-foreground text-[11px] font-semibold">
            To
            <input
              className="border-border bg-surface text-foreground mt-1 block h-10 w-full rounded-xl border px-3 text-xs"
              min={from || undefined}
              onChange={(event) => resetPage(() => setTo(event.target.value))}
              type="date"
              value={to}
            />
          </label>
        </div>
      ) : null}

      <section className="surface-card mb-5 grid gap-3 p-4 sm:grid-cols-3">
        <label className="text-muted-foreground text-[11px] font-semibold">
          Task
          <select
            className="border-border bg-surface text-foreground mt-1 block h-10 w-full rounded-xl border px-3 text-xs"
            onChange={(event) =>
              resetPage(() => setTaskType(event.target.value))
            }
            value={taskType}
          >
            <option value="">All tasks</option>
            {data?.filters.tasks.map((task) => (
              <option key={task} value={task}>
                {task}
              </option>
            ))}
          </select>
        </label>
        <label className="text-muted-foreground text-[11px] font-semibold">
          Model
          <select
            className="border-border bg-surface text-foreground mt-1 block h-10 w-full rounded-xl border px-3 text-xs"
            onChange={(event) => resetPage(() => setModel(event.target.value))}
            value={model}
          >
            <option value="">All models</option>
            {data?.filters.models.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
        <label className="text-muted-foreground text-[11px] font-semibold">
          Status
          <select
            className="border-border bg-surface text-foreground mt-1 block h-10 w-full rounded-xl border px-3 text-xs"
            onChange={(event) => resetPage(() => setStatus(event.target.value))}
            value={status}
          >
            <option value="">All statuses</option>
            <option value="SUCCEEDED">Succeeded</option>
            <option value="FAILED">Failed</option>
            <option value="REJECTED">Rejected</option>
            <option value="PENDING">Pending</option>
          </select>
        </label>
      </section>

      {query.isLoading ? (
        <div className="text-muted-foreground flex min-h-72 items-center justify-center gap-2 text-xs">
          <span className="border-primary size-5 animate-spin rounded-full border-2 border-t-transparent" />
          Loading AI usage…
        </div>
      ) : query.isError || !data ? (
        <div className="surface-card p-10 text-center">
          <p className="text-foreground text-sm font-bold">
            AI usage is unavailable
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
          <section className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[
              [
                Bot,
                "Requests",
                number(data.summary.requests),
                `${data.summary.successRate.toFixed(1)}% successful`,
              ],
              [
                BrainCircuit,
                "Total tokens",
                number(data.summary.totalTokens),
                `${number(data.summary.outputTokens)} output`,
              ],
              [
                CircleDollarSign,
                "Estimated cost",
                usd(data.summary.estimatedCostUsd),
                "Based on recorded model rates",
              ],
              [
                Clock3,
                "Average latency",
                `${number(data.summary.averageLatencyMs)} ms`,
                `${number(data.summary.failed)} failed or rejected`,
              ],
            ].map(([Icon, label, value, sub]) => {
              const Glyph = Icon as typeof Bot;
              return (
                <article className="surface-card p-4" key={String(label)}>
                  <span className="bg-primary/10 text-primary grid size-9 place-items-center rounded-xl">
                    <Glyph className="size-4" />
                  </span>
                  <p className="text-foreground mt-3 text-xl font-bold">
                    {String(value)}
                  </p>
                  <p className="text-foreground text-xs font-semibold">
                    {String(label)}
                  </p>
                  <p className="text-muted-foreground mt-0.5 text-[10px]">
                    {String(sub)}
                  </p>
                </article>
              );
            })}
          </section>

          <section className="mb-5 grid gap-5 xl:grid-cols-2">
            <article className="surface-card p-5">
              <div className="mb-5 flex items-center gap-3">
                <Gauge className="text-primary size-5" />
                <div>
                  <h2 className="text-foreground text-sm font-bold">
                    Highest-token tasks
                  </h2>
                  <p className="text-muted-foreground text-[11px]">
                    Product capabilities consuming the most tokens
                  </p>
                </div>
              </div>
              <BreakdownList items={data.byTask} />
            </article>
            <article className="surface-card p-5">
              <div className="mb-5 flex items-center gap-3">
                <Database className="text-primary size-5" />
                <div>
                  <h2 className="text-foreground text-sm font-bold">
                    Usage by model
                  </h2>
                  <p className="text-muted-foreground text-[11px]">
                    Compare model volume and estimated spend
                  </p>
                </div>
              </div>
              <BreakdownList items={data.byModel} />
            </article>
          </section>

          <section className="surface-card mb-5 p-5">
            <div className="mb-5 flex items-center gap-3">
              <Activity className="text-primary size-5" />
              <div>
                <h2 className="text-foreground text-sm font-bold">
                  Token trend
                </h2>
                <p className="text-muted-foreground text-[11px]">
                  Daily token volume for the selected filters
                </p>
              </div>
            </div>
            {data.daily.length ? (
              <div className="flex h-44 items-end gap-1.5 overflow-x-auto border-b border-dashed pb-1">
                {data.daily.map((item) => (
                  <div
                    className="group flex min-w-5 flex-1 flex-col items-center justify-end"
                    key={item.date}
                    title={`${item.date}: ${number(item.tokens)} tokens, ${usd(item.estimatedCostUsd)}`}
                  >
                    <div
                      className="bg-primary/75 group-hover:bg-primary w-full max-w-8 rounded-t-md transition"
                      style={{
                        height: `${Math.max(3, (item.tokens / maxDaily) * 150)}px`,
                      }}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground py-10 text-center text-xs">
                No usage in this period.
              </p>
            )}
          </section>

          <section className="mb-5 grid gap-5 xl:grid-cols-[1.25fr_.75fr]">
            <article className="surface-card overflow-hidden p-5">
              <div className="mb-4 flex items-center gap-3">
                <Bot className="text-primary size-5" />
                <div>
                  <h2 className="text-foreground text-sm font-bold">
                    Recent requests
                  </h2>
                  <p className="text-muted-foreground text-[11px]">
                    Metadata only—prompt and response content is excluded
                  </p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-left text-xs">
                  <thead className="text-muted-foreground border-b text-[10px] uppercase">
                    <tr>
                      <th className="py-3 pr-4">Task</th>
                      <th className="py-3 pr-4">User</th>
                      <th className="py-3 pr-4">Model</th>
                      <th className="py-3 pr-4">Tokens</th>
                      <th className="py-3 pr-4">Cost</th>
                      <th className="py-3 pr-4">Status</th>
                      <th className="py-3">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-border divide-y">
                    {data.recent.map((item) => (
                      <tr key={item.id}>
                        <td className="py-3 pr-4 font-semibold">
                          {item.taskType}
                          <span className="text-muted-foreground block text-[10px] font-normal">
                            {item.promptVersion}
                          </span>
                        </td>
                        <td className="py-3 pr-4">
                          {item.user?.fullName ?? "System"}
                        </td>
                        <td className="py-3 pr-4">{item.model}</td>
                        <td className="py-3 pr-4">
                          {number(item.totalTokens)}
                        </td>
                        <td className="py-3 pr-4">
                          {item.costEstimated
                            ? usd(item.estimatedCostUsd)
                            : "—"}
                        </td>
                        <td className="py-3 pr-4">
                          <Status value={item.status} />
                        </td>
                        <td className="text-muted-foreground py-3 text-[10px]">
                          {dateTime(item.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination
                currentPage={data.pagination.page}
                itemLabel="AI requests"
                onPageChange={setPage}
                pageSize={data.pagination.pageSize}
                totalItems={data.pagination.totalItems}
                totalPages={data.pagination.totalPages}
              />
            </article>

            <article className="surface-card p-5">
              <div className="mb-4 flex items-center gap-3">
                <Users className="text-primary size-5" />
                <div>
                  <h2 className="text-foreground text-sm font-bold">
                    Highest-token users
                  </h2>
                  <p className="text-muted-foreground text-[11px]">
                    Useful for quota and abuse review
                  </p>
                </div>
              </div>
              <div className="divide-border divide-y">
                {data.topUsers.map((user, index) => (
                  <div
                    className="flex items-center gap-3 py-3"
                    key={user.userId}
                  >
                    <span className="bg-primary/10 text-primary grid size-8 shrink-0 place-items-center rounded-xl text-[10px] font-bold">
                      {index + 1}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="text-foreground block truncate text-xs font-semibold">
                        {user.name}
                      </span>
                      <span className="text-muted-foreground block truncate text-[10px]">
                        {user.email ?? "No email"}
                      </span>
                    </span>
                    <span className="shrink-0 text-right">
                      <span className="text-foreground block text-xs font-bold">
                        {number(user.totalTokens)}
                      </span>
                      <span className="text-muted-foreground block text-[10px]">
                        {usd(user.estimatedCostUsd)}
                      </span>
                    </span>
                  </div>
                ))}
                {!data.topUsers.length ? (
                  <p className="text-muted-foreground py-10 text-center text-xs">
                    No user usage in this period.
                  </p>
                ) : null}
              </div>
            </article>
          </section>
        </>
      )}
    </AdminShell>
  );
}
