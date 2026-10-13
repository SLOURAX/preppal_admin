import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface SectionCardProps {
  readonly actions?: ReactNode;
  readonly children: ReactNode;
  readonly className?: string;
  readonly description?: string;
  readonly title?: string;
}

export function SectionCard({
  actions,
  children,
  className,
  description,
  title,
}: SectionCardProps) {
  return (
    <section className={cn("surface-card p-4 sm:p-5", className)}>
      {title || actions ? (
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            {title ? (
              <h2 className="text-foreground text-[.9rem] font-bold tracking-[-0.02em]">
                {title}
              </h2>
            ) : null}
            {description ? (
              <p className="text-muted-foreground mt-1 text-[.68rem] leading-4">
                {description}
              </p>
            ) : null}
          </div>
          {actions}
        </div>
      ) : null}
      {children}
    </section>
  );
}
