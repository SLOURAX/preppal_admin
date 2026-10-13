"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ChevronRight,
  Command,
  LogOut,
  Menu,
  Search,
  ShieldCheck,
  X,
  type LucideIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type PropsWithChildren } from "react";

import { AdminIcon } from "@/components/ui";
import { ADMIN_NAVIGATION } from "@/constants";
import { apiClient } from "@/lib/api/client";
import { cn } from "@/lib/utils";

import { ThemeToggle } from "./theme-toggle";

interface AdminSession {
  readonly email: string;
  readonly fullName: string;
  readonly id: string;
  readonly role: "ADMIN";
}

function isActive(pathname: string, href: string): boolean {
  if (href === "/dashboard") return pathname === href;
  if (href === "/finance") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function ShellGlyph({
  className,
  name,
}: {
  readonly className?: string;
  readonly name: "chevron" | "close" | "logout" | "menu" | "search";
}) {
  const icons: Record<
    "chevron" | "close" | "logout" | "menu" | "search",
    LucideIcon
  > = {
    chevron: ChevronRight,
    close: X,
    logout: LogOut,
    menu: Menu,
    search: Search,
  };
  const Icon = icons[name];
  return <Icon aria-hidden="true" className={className} strokeWidth={1.9} />;
}

function NavigationList({
  onNavigate,
  pathname,
}: {
  readonly onNavigate?: () => void;
  readonly pathname: string;
}) {
  return (
    <nav aria-label="Admin navigation" className="space-y-0.5">
      {ADMIN_NAVIGATION.map((item, index) => {
        const active = isActive(pathname, item.href);
        const showGroupHeader =
          item.group !== null &&
          item.group !== ADMIN_NAVIGATION[index - 1]?.group;

        return (
          <div key={item.href}>
            {showGroupHeader ? (
              <p className="text-muted-foreground mt-5 mb-1.5 px-3 text-[.58rem] font-bold tracking-[0.16em] uppercase">
                {item.group}
              </p>
            ) : null}
            <Link
              aria-current={active ? "page" : undefined}
              className={cn(
                "group relative flex min-h-10 items-center gap-3 rounded-xl px-3 text-[.78rem] font-semibold transition",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-surface-subtle hover:text-foreground",
              )}
              href={item.href}
              onClick={onNavigate}
            >
              {active ? (
                <span className="bg-primary absolute inset-y-2 left-0 w-0.5 rounded-full" />
              ) : null}
              <AdminIcon className="size-[17px] shrink-0" name={item.icon} />
              <span className="min-w-0 flex-1 truncate">{item.label}</span>
              <ShellGlyph
                className={cn(
                  "size-3.5 opacity-0 transition group-hover:opacity-60",
                  active && "opacity-50",
                )}
                name="chevron"
              />
            </Link>
          </div>
        );
      })}
    </nav>
  );
}

function AccessCheck() {
  return (
    <div className="bg-background flex min-h-screen items-center justify-center p-5">
      <div className="surface-card w-full max-w-sm p-6 text-center">
        <div className="bg-primary/10 text-primary mx-auto grid size-11 place-items-center rounded-2xl">
          <ShieldCheck
            aria-hidden="true"
            className="size-5 animate-pulse"
            strokeWidth={1.9}
          />
        </div>
        <h1 className="text-foreground mt-4 text-base font-bold">
          Checking secure access
        </h1>
        <p className="text-muted-foreground mt-1.5 text-[.75rem]">
          Confirming your administrator session…
        </p>
      </div>
    </div>
  );
}

export function AdminShell({ children }: PropsWithChildren) {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const session = useQuery({
    queryKey: ["auth", "admin", "session"],
    queryFn: () => apiClient<AdminSession>("/api/v1/auth/admin/me"),
    retry: false,
    staleTime: 60_000,
  });
  const isAuthorised = session.data?.role === "ADMIN";
  const currentItem = ADMIN_NAVIGATION.find((item) =>
    isActive(pathname, item.href),
  );
  const initials = (session.data?.fullName ?? "Admin User")
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const searchResults = ADMIN_NAVIGATION.filter((item) =>
    item.label.toLowerCase().includes(searchQuery.trim().toLowerCase()),
  );

  useEffect(() => {
    if (session.isError || (session.data && !isAuthorised)) {
      router.replace("/");
    }
  }, [isAuthorised, router, session.data, session.isError]);

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen(true);
      }
      if (event.key === "Escape") {
        setMobileOpen(false);
        setSearchOpen(false);
      }
    };
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, []);

  const signOut = async () => {
    try {
      await apiClient("/api/v1/auth/logout", { method: "POST" });
    } finally {
      queryClient.removeQueries({ queryKey: ["auth", "admin"] });
      router.replace("/");
    }
  };

  if (!isAuthorised) return <AccessCheck />;

  const sidebarContent = (
    <>
      <Link className="flex items-center gap-3" href="/dashboard">
        <span className="border-primary/15 bg-primary/8 grid size-10 place-items-center rounded-2xl border">
          <Image
            alt="Preppal"
            className="size-8 object-contain"
            height={32}
            loading="lazy"
            src="/assets/brand/preppal-mark.svg"
            width={32}
          />
        </span>
        <span>
          <span className="text-foreground block text-[.9rem] font-bold tracking-[-0.03em]">
            Preppal Admin
          </span>
          <span className="text-muted-foreground mt-0.5 block text-[.58rem] font-semibold tracking-[0.12em] uppercase">
            Operations console
          </span>
        </span>
      </Link>

      <div className="bg-border/70 my-5 h-px" />
      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
        <NavigationList
          onNavigate={() => setMobileOpen(false)}
          pathname={pathname}
        />
      </div>

      <div className="border-border mt-5 border-t pt-4">
        <div className="bg-surface-subtle/75 flex items-center gap-3 rounded-2xl p-3">
          <span className="bg-primary text-primary-foreground grid size-8 shrink-0 place-items-center rounded-xl text-[.65rem] font-bold">
            {initials}
          </span>
          <span className="min-w-0 flex-1">
            <span className="text-foreground block truncate text-[.7rem] font-bold">
              {session.data?.fullName}
            </span>
            <span className="text-muted-foreground mt-0.5 block truncate text-[.58rem]">
              Administrator
            </span>
          </span>
          <button
            aria-label="Sign out"
            className="text-muted-foreground hover:bg-surface hover:text-danger grid size-8 place-items-center rounded-lg transition"
            onClick={signOut}
            type="button"
          >
            <ShellGlyph className="size-4" name="logout" />
          </button>
        </div>
      </div>
    </>
  );

  return (
    <div className="text-foreground min-h-screen">
      <aside className="border-border bg-surface/94 fixed inset-y-0 left-0 z-40 hidden w-[17rem] flex-col border-r px-5 py-5 backdrop-blur-xl lg:flex">
        {sidebarContent}
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-[80] lg:hidden">
          <button
            aria-label="Close navigation"
            className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
            type="button"
          />
          <aside className="border-border bg-surface absolute inset-y-0 left-0 flex w-[86%] max-w-[19rem] flex-col border-r p-5 shadow-2xl">
            <button
              aria-label="Close navigation"
              className="text-muted-foreground hover:bg-surface-subtle absolute top-4 right-4 grid size-8 place-items-center rounded-xl"
              onClick={() => setMobileOpen(false)}
              type="button"
            >
              <ShellGlyph className="size-4" name="close" />
            </button>
            {sidebarContent}
          </aside>
        </div>
      ) : null}

      <main className="admin-workspace min-h-screen min-w-0 lg:pl-[17rem]">
        <header className="border-border bg-surface/88 sticky top-0 z-30 flex h-16 items-center gap-3 border-b px-4 backdrop-blur-xl sm:px-6 lg:px-8">
          <button
            aria-label="Open navigation"
            className="text-muted-foreground hover:bg-surface-subtle grid size-9 place-items-center rounded-xl lg:hidden"
            onClick={() => setMobileOpen(true)}
            type="button"
          >
            <ShellGlyph className="size-5" name="menu" />
          </button>

          <div className="min-w-0 flex-1">
            <p className="text-muted-foreground text-[.58rem] font-semibold tracking-[0.12em] uppercase">
              {currentItem?.group ?? "Workspace"}
            </p>
            <p className="text-foreground mt-0.5 truncate text-[.78rem] font-bold">
              {currentItem?.label ?? "Admin workspace"}
            </p>
          </div>

          <button
            className="border-border bg-background/70 text-muted-foreground hover:border-primary/30 hover:text-foreground hidden h-9 w-56 items-center gap-2 rounded-xl border px-3 text-left text-[.68rem] transition sm:flex"
            onClick={() => setSearchOpen(true)}
            type="button"
          >
            <ShellGlyph className="size-4" name="search" />
            <span className="flex-1">Search admin</span>
            <kbd className="border-border bg-surface inline-flex items-center gap-0.5 rounded-md border px-1.5 py-0.5 text-[.55rem]">
              <Command className="size-2.5" strokeWidth={1.9} />K
            </kbd>
          </button>
          <ThemeToggle />
          <div className="hidden items-center gap-2 border-l pl-3 md:flex">
            <span className="bg-primary text-primary-foreground grid size-8 place-items-center rounded-xl text-[.62rem] font-bold">
              {initials}
            </span>
            <span className="hidden xl:block">
              <span className="text-foreground block max-w-32 truncate text-[.68rem] font-bold">
                {session.data?.fullName}
              </span>
            </span>
          </div>
        </header>

        <div className="p-4 sm:p-6 lg:p-7">{children}</div>
      </main>

      {searchOpen ? (
        <div className="fixed inset-0 z-[100] flex items-start justify-center bg-slate-950/35 p-4 pt-[12vh] backdrop-blur-sm">
          <button
            aria-label="Close search"
            className="absolute inset-0"
            onClick={() => setSearchOpen(false)}
            type="button"
          />
          <section
            aria-label="Admin search"
            aria-modal="true"
            className="bg-surface border-border relative z-10 w-full max-w-lg overflow-hidden rounded-3xl border shadow-2xl"
            role="dialog"
          >
            <div className="border-border flex items-center gap-3 border-b px-4">
              <ShellGlyph
                className="text-muted-foreground size-4"
                name="search"
              />
              <input
                autoFocus
                className="text-foreground placeholder:text-muted-foreground h-13 min-w-0 flex-1 bg-transparent text-[.78rem] outline-none"
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search pages and management areas…"
                value={searchQuery}
              />
              <button
                className="text-muted-foreground hover:bg-surface-subtle grid size-8 place-items-center rounded-lg"
                onClick={() => setSearchOpen(false)}
                type="button"
              >
                <ShellGlyph className="size-4" name="close" />
              </button>
            </div>
            <div className="max-h-80 overflow-y-auto p-2">
              {searchResults.length ? (
                searchResults.map((item) => (
                  <Link
                    className="hover:bg-surface-subtle flex items-center gap-3 rounded-xl px-3 py-2.5 transition"
                    href={item.href}
                    key={item.href}
                    onClick={() => {
                      setSearchOpen(false);
                      setSearchQuery("");
                    }}
                  >
                    <span className="bg-primary/10 text-primary grid size-8 place-items-center rounded-xl">
                      <AdminIcon className="size-4" name={item.icon} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="text-foreground block text-[.72rem] font-bold">
                        {item.label}
                      </span>
                      <span className="text-muted-foreground mt-0.5 block text-[.58rem]">
                        {item.group ?? "Workspace"}
                      </span>
                    </span>
                    <ShellGlyph
                      className="text-muted-foreground size-3.5"
                      name="chevron"
                    />
                  </Link>
                ))
              ) : (
                <div className="px-4 py-10 text-center">
                  <p className="text-foreground text-[.75rem] font-bold">
                    No matching section
                  </p>
                  <p className="text-muted-foreground mt-1 text-[.65rem]">
                    Try learners, payments, rewards, or analytics.
                  </p>
                </div>
              )}
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}
