"use client";

import { Monitor, Moon, Sun, type LucideIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

import { cn } from "@/lib/utils";

type ThemeName = "dark" | "light" | "system";

function ThemeIcon({ name }: { readonly name: ThemeName }) {
  const icons: Record<ThemeName, LucideIcon> = {
    dark: Moon,
    light: Sun,
    system: Monitor,
  };
  const Icon = icons[name];
  return <Icon aria-hidden="true" className="size-3.5" strokeWidth={1.8} />;
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
