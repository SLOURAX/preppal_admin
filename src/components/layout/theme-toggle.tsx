"use client";

import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

const THEMES = [
  { value: "light", label: "Light", icon: "☼" },
  { value: "system", label: "System", icon: "▣" },
  { value: "dark", label: "Dark", icon: "◐" },
] as const;

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const mounted = useSyncExternalStore<boolean>(
    () => () => undefined,
    () => true,
    () => false,
  );
  const activeTheme = mounted ? theme : "system";

  return (
    <div
      aria-label="Theme preference"
      className="bg-surface-subtle inline-flex items-center gap-0.5 rounded-xl p-1"
      role="group"
    >
      {THEMES.map(({ value, label, icon }) => {
        const active = activeTheme === value;
        return (
          <button
            aria-pressed={active}
            className={`flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold transition-colors ${active ? "bg-surface text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            disabled={!mounted}
            key={value}
            onClick={() => setTheme(value)}
            title={label}
            type="button"
          >
            <span aria-hidden="true" className="text-sm leading-none">
              {icon}
            </span>
            <span className="hidden sm:inline">{label}</span>
          </button>
        );
      })}
    </div>
  );
}
