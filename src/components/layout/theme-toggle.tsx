"use client";

import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

import { cn } from "@/lib/utils";

type ThemeName = "dark" | "light" | "system";

function ThemeIcon({ name }: { readonly name: ThemeName }) {
  const common = {
    fill: "none",
    stroke: "currentColor",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    strokeWidth: 1.8,
  };

  return (
    <svg aria-hidden="true" className="size-3.5" viewBox="0 0 24 24">
      {name === "light" ? (
        <>
          <circle {...common} cx="12" cy="12" r="3.5" />
          <path
            {...common}
            d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"
          />
        </>
      ) : null}
      {name === "system" ? (
        <>
          <rect {...common} height="12" rx="1.5" width="16" x="4" y="4" />
          <path {...common} d="M8 20h8M12 16v4" />
        </>
      ) : null}
      {name === "dark" ? (
        <path
          {...common}
          d="M20.3 15.6A8.6 8.6 0 0 1 8.4 3.7 8.6 8.6 0 1 0 20.3 15.6Z"
        />
      ) : null}
    </svg>
  );
}

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const mounted = useSyncExternalStore<boolean>(
    () => () => undefined,
    () => true,
    () => false,
  );
  const currentTheme = mounted ? theme : "light";

  return (
    <div
      aria-label="Color theme"
      className="bg-surface-subtle/80 relative grid h-9 w-[6.5rem] grid-cols-3 rounded-full p-1"
      role="group"
    >
      <span
        aria-hidden="true"
        className={cn(
          "bg-surface absolute top-1 left-[6px] size-7 rounded-full shadow-sm transition-transform duration-300 ease-out",
          currentTheme === "system" && "translate-x-8",
          currentTheme === "dark" && "translate-x-16",
        )}
      />
      {(["light", "system", "dark"] as const).map((theme) => (
        <button
          aria-label={`Use ${theme} theme`}
          aria-pressed={currentTheme === theme}
          className={cn(
            "relative z-10 grid place-items-center rounded-full transition-colors",
            currentTheme === theme
              ? theme === "light"
                ? "text-amber-500"
                : "text-primary"
              : "text-muted-foreground",
          )}
          disabled={!mounted}
          key={theme}
          onClick={() => setTheme(theme)}
          type="button"
        >
          <ThemeIcon name={theme} />
        </button>
      ))}
    </div>
  );
}
