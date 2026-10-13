import type { ReactNode } from "react";

import { AdminIcon, type AdminIconName } from "@/components/ui";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  readonly accent?: string;
  readonly change?: string;
  readonly detail: string;
  readonly icon: AdminIconName;
  readonly label: string;
  readonly value: string;
  readonly footer?: ReactNode;
}

export function MetricCard({
  accent = "bg-primary/10 text-primary",
  change,
  detail,
  footer,
  icon,
  label,
  value,
}: MetricCardProps) {
  return (
    <article className="surface-card group relative overflow-hidden p-4 transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_16px_40px_rgb(58_34_140/.11)] sm:p-4.5">
      <div className="flex items-start justify-between gap-3">
        <span
          className={cn(
            "grid size-9 shrink-0 place-items-center rounded-xl",
            accent,
          )}
        >
          <AdminIcon className="size-[17px]" name={icon} />
        </span>
        {change ? (
          <span className="bg-success/10 text-success rounded-full px-2 py-1 text-[.62rem] font-bold">
            {change}
          </span>
        ) : null}
      </div>
      <p className="text-muted-foreground mt-4 text-[.68rem] font-semibold">
        {label}
      </p>
      <p className="text-foreground mt-1 text-[1.45rem] leading-none font-bold tracking-[-0.045em]">
        {value}
      </p>
      <p className="text-muted-foreground mt-2 text-[.65rem] leading-4">
        {detail}
      </p>
      {footer ? <div className="mt-3">{footer}</div> : null}
    </article>
  );
}
