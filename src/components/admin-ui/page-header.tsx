import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface AdminPageHeaderProps {
  readonly actions?: ReactNode;
  readonly description: string;
  readonly eyebrow?: string;
  readonly status?: ReactNode;
  readonly title: string;
  readonly className?: string;
}

export function AdminPageHeader({
  actions,
  className,
  description,
  eyebrow,
  status,
  title,
}: AdminPageHeaderProps) {
  return (
    <header
      className={cn(
        "flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between",
        className,
      )}
    >
      <div className="min-w-0">
        {eyebrow ? (
          <p className="text-primary text-[.64rem] font-bold tracking-[0.16em] uppercase">
            {eyebrow}
          </p>
        ) : null}
        <div className="mt-1.5 flex flex-wrap items-center gap-2.5">
          <h1 className="text-foreground text-[1.55rem] leading-tight font-bold tracking-[-0.04em] sm:text-[1.8rem]">
            {title}
          </h1>
          {status}
        </div>
        <p className="text-muted-foreground mt-1.5 max-w-2xl text-[.78rem] leading-5">
          {description}
        </p>
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {actions}
        </div>
      ) : null}
    </header>
  );
}
