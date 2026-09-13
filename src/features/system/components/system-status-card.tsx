"use client";

import { useSystemStatus } from "../hooks/use-system-status";

export function SystemStatusCard() {
  const query = useSystemStatus();
  const connected = query.data?.data.status === "ok";
  return (
    <button
      className="border-border bg-surface flex items-center gap-3 rounded-full border px-4 py-2 text-left text-sm"
      onClick={() => query.refetch()}
      type="button"
    >
      <span
        className={`h-2.5 w-2.5 rounded-full ${connected ? "bg-success" : "bg-danger"}`}
      />
      <span>
        {query.isFetching
          ? "Checking API…"
          : connected
            ? "API connected"
            : "API offline · retry"}
      </span>
    </button>
  );
}
