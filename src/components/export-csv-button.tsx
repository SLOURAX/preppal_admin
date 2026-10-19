"use client";

import { Download } from "lucide-react";

type CsvValue = string | number | boolean | null | undefined;

interface ExportCsvButtonProps {
  readonly filename: string;
  readonly rows: readonly Record<string, CsvValue>[];
  readonly label?: string;
}

const csvCell = (value: CsvValue): string =>
  `"${String(value ?? "").replaceAll('"', '""')}"`;

export function ExportCsvButton({
  filename,
  rows,
  label = "Export CSV",
}: ExportCsvButtonProps) {
  const exportRows = () => {
    if (!rows.length) return;
    const headers = Object.keys(rows[0]);
    const csv = [
      headers.map(csvCell).join(","),
      ...rows.map((row) =>
        headers.map((header) => csvCell(row[header])).join(","),
      ),
    ].join("\r\n");
    const url = URL.createObjectURL(
      new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" }),
    );
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${filename}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <button
      className="border-border bg-surface text-foreground hover:border-primary/30 hover:text-primary inline-flex h-9 items-center gap-2 rounded-xl border px-3 text-[.65rem] font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-50"
      disabled={!rows.length}
      onClick={exportRows}
      type="button"
    >
      <Download className="size-3.5" /> {label}
    </button>
  );
}
