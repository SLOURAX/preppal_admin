import { cn } from "@/lib/utils";

export interface SegmentOption<T extends string> {
  readonly label: string;
  readonly value: T;
}

export function SegmentedControl<T extends string>({
  active = true,
  ariaLabel,
  onChange,
  options,
  value,
}: {
  readonly active?: boolean;
  readonly ariaLabel: string;
  readonly onChange: (value: T) => void;
  readonly options: readonly SegmentOption<T>[];
  readonly value: T;
}) {
  return (
    <div
      aria-label={ariaLabel}
      className="bg-surface-subtle flex w-fit max-w-full gap-0.5 overflow-x-auto rounded-full p-1"
      role="group"
    >
      {options.map((option) => (
        <button
          aria-pressed={active && value === option.value}
          className={cn(
            "shrink-0 rounded-full px-3 py-1.5 text-[.65rem] font-semibold transition",
            active && value === option.value
              ? "bg-surface text-primary shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
          key={option.value}
          onClick={() => onChange(option.value)}
          type="button"
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
