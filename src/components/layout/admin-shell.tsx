"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { PropsWithChildren } from "react";
import { ADMIN_NAVIGATION } from "@/constants";
import { ThemeToggle } from "./theme-toggle";

export function AdminShell({ children }: PropsWithChildren) {
  const pathname = usePathname();
  return (
    <div className="bg-background text-foreground flex min-h-screen overflow-x-hidden">
      <aside className="border-border bg-surface fixed inset-y-0 left-0 z-30 hidden w-64 shrink-0 overflow-y-auto border-r p-5 lg:flex lg:flex-col">
        <Link className="mb-8 flex items-center gap-3" href="/dashboard">
          <span className="bg-primary text-primary-foreground grid size-10 place-items-center rounded-xl text-sm font-black">
            pp
          </span>
          <span className="font-bold">
            Preppal{" "}
            <span className="text-muted-foreground text-xs font-normal">
              Admin
            </span>
          </span>
        </Link>
        <nav className="flex-1 space-y-1" aria-label="Admin navigation">
          {ADMIN_NAVIGATION.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-surface-subtle hover:text-foreground"}`}
                href={item.href}
                key={item.href}
              >
                <span className="grid size-5 place-items-center text-base">
                  {item.icon}
                </span>
                {item.label}
              </Link>
            );
          })}
        </nav>
        <Link
          className="text-muted-foreground border-border hover:text-danger border-t pt-4 text-sm"
          href="/"
        >
          Sign out
        </Link>
      </aside>
      <main className="min-w-0 flex-1 overflow-x-hidden lg:pl-64">
        <header className="border-border bg-surface sticky top-0 z-20 flex h-16 items-center justify-between border-b px-5 sm:px-8">
          <div className="flex items-center gap-2 lg:hidden">
            <span className="bg-primary text-primary-foreground grid size-8 place-items-center rounded-lg text-xs font-black">
              pp
            </span>
            <span className="text-sm font-bold">Admin console</span>
          </div>
          <div className="ml-auto flex items-center gap-4">
            <span className="text-success text-xs font-semibold">
              ● Secure workspace
            </span>
            <ThemeToggle />
          </div>
        </header>
        <nav
          className="border-border bg-surface sticky top-16 z-20 flex gap-1 overflow-x-auto border-b px-4 py-2 lg:hidden"
          aria-label="Admin navigation"
        >
          {ADMIN_NAVIGATION.map((item) => (
            <Link
              className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold ${pathname === item.href ? "bg-primary/10 text-primary" : "text-muted-foreground"}`}
              href={item.href}
              key={item.href}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-5 sm:p-8">{children}</div>
      </main>
    </div>
  );
}
