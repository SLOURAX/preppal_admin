import { cn } from "@/lib/utils";

type StatusTone = "danger" | "info" | "neutral" | "success" | "warning";

const TONES: Record<StatusTone, string> = {
  danger: "bg-rose-500/10 text-rose-700 dark:text-rose-300",
  info: "bg-blue-500/10 text-blue-700 dark:text-blue-300",
  neutral: "bg-surface-subtle text-muted-foreground",
  success: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  warning: "bg-amber-500/12 text-amber-700 dark:text-amber-300",
};

export function StatusBadge({
  children,
  className,
  dot = false,
  tone = "neutral",
}: {
  readonly children: React.ReactNode;
  readonly className?: string;
  readonly dot?: boolean;
  readonly tone?: StatusTone;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[.63rem] font-bold",
        TONES[tone],
        className,
      )}
    >
      {dot ? <span className="size-1.5 rounded-full bg-current" /> : null}
      {children}
    </span>
  );
}
