"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type PropsWithChildren } from "react";

import { AdminIcon } from "@/components/ui";
import { ADMIN_NAVIGATION } from "@/constants";
import { apiClient } from "@/lib/api/client";

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

function renderNavItems(pathname: string, mobile = false) {
  let lastGroup: string | null | undefined;

  return ADMIN_NAVIGATION.map((item) => {
    const active = isActive(pathname, item.href);
    const showGroupHeader =
      !mobile && item.group !== null && item.group !== lastGroup;
    lastGroup = item.group;

    return (
      <div key={item.href}>
        {showGroupHeader ? (
          <p className="text-muted-foreground mt-7 mb-2 px-4 text-[10px] font-bold tracking-[0.14em] uppercase">
            {item.group}
          </p>
        ) : null}
        <Link
          className={`flex items-center gap-3 rounded-xl px-4 py-3 text-[.85rem] font-medium transition-colors ${
            active
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:bg-surface-subtle hover:text-foreground"
          } ${mobile ? "shrink-0 text-[.85rem]" : ""}`}
          href={item.href}
        >
          <AdminIcon className="size-[18px] shrink-0" name={item.icon} />
          {item.label}
        </Link>
      </div>
    );
  });
}

function AccessCheck() {
  return (
    <div className="bg-background flex min-h-screen items-center justify-center p-5">
      <div className="surface-card w-full max-w-sm rounded-3xl p-7 text-center">
        <div className="bg-primary/10 text-primary mx-auto grid size-12 place-items-center rounded-2xl">
          <svg
            aria-hidden="true"
            className="size-6 animate-pulse"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              d="M12 3 5 6v5c0 4.4 2.9 8.5 7 10 4.1-1.5 7-5.6 7-10V6l-7-3Z"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
            />
            <path
              d="m9 12 2 2 4-4"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
            />
          </svg>
        </div>
        <h1 className="text-foreground mt-4 text-lg font-bold">
          Checking secure access
        </h1>
        <p className="text-muted-foreground mt-2 text-sm">
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
  const session = useQuery({
    queryKey: ["auth", "admin", "session"],
    queryFn: () => apiClient<AdminSession>("/api/v1/auth/admin/me"),
    retry: false,
    staleTime: 60_000,
  });
  const isAuthorised = session.data?.role === "ADMIN";

  useEffect(() => {
    if (session.isError || (session.data && !isAuthorised)) {
      router.replace("/");
    }
  }, [isAuthorised, router, session.data, session.isError]);

  const signOut = async () => {
    try {
      await apiClient("/api/v1/auth/logout", { method: "POST" });
    } finally {
      queryClient.removeQueries({ queryKey: ["auth", "admin"] });
      router.replace("/");
    }
  };

  if (!isAuthorised) return <AccessCheck />;

  return (
    <div className="bg-background text-foreground flex min-h-screen overflow-x-hidden">
      <aside className="border-border bg-surface fixed inset-y-0 left-0 z-30 hidden w-64 shrink-0 overflow-y-auto border-r px-6 py-7 lg:flex lg:flex-col">
        <Link className="mb-10 flex items-center gap-3" href="/dashboard">
          <Image
            alt="Preppal"
            className="size-10 object-contain"
            height={40}
            src="/assets/brand/preppal-mark.svg"
            width={40}
          />
          <span className="font-bold">
            Preppal{" "}
            <span className="text-muted-foreground text-xs font-normal">
              Admin
            </span>
          </span>
        </Link>
        <nav aria-label="Admin navigation" className="flex-1 space-y-1">
          {renderNavItems(pathname)}
        </nav>
        <button
          className="text-muted-foreground border-border hover:text-danger flex w-full items-center gap-2 border-t pt-5 text-left text-[.85rem] font-medium transition-colors"
          onClick={signOut}
          type="button"
        >
          <svg
            aria-hidden="true"
            className="size-[18px]"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              d="M10 17l5-5-5-5M15 12H3M13 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.9"
            />
          </svg>
          Sign out
        </button>
      </aside>

      <main className="min-w-0 flex-1 overflow-x-hidden lg:pl-64">
        <header className="border-border bg-surface sticky top-0 z-20 flex h-16 items-center justify-between border-b px-5 sm:px-8">
          <div className="flex items-center gap-2 lg:hidden">
            <Image
              alt=""
              aria-hidden="true"
              className="size-8 object-contain"
              height={32}
              src="/assets/brand/preppal-mark.svg"
              width={32}
            />
            <span className="text-sm font-bold">Admin console</span>
          </div>
          <div className="ml-auto flex items-center gap-4">
            <ThemeToggle />
          </div>
        </header>

        <nav
          aria-label="Admin navigation"
          className="border-border bg-surface sticky top-16 z-20 flex gap-1 overflow-x-auto border-b px-4 py-2.5 lg:hidden"
        >
          {ADMIN_NAVIGATION.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-[.85rem] font-semibold ${
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground"
                }`}
                href={item.href}
                key={item.href}
              >
                <AdminIcon className="size-4" name={item.icon} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-5 sm:p-8">{children}</div>
      </main>
    </div>
  );
}
