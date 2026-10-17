"use client";

import { QueryClientProvider, type QueryClient } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { ThemeProvider } from "next-themes";
import { type PropsWithChildren, useEffect, useRef, useState } from "react";

import { createQueryClient } from "@/lib/query-client";
import { AI_LIMIT_EVENT } from "@/lib/api/client";

function AiLimitNotification() {
  const [message, setMessage] = useState<string | null>(null);
  const lastNotification = useRef<{ message: string; shownAt: number } | null>(
    null,
  );
  useEffect(() => {
    const notify = (event: Event) => {
      const detail = (event as CustomEvent<{ message?: string }>).detail;
      const nextMessage =
        detail?.message || "The daily AI allowance has been reached.";
      const now = Date.now();
      if (
        lastNotification.current?.message === nextMessage &&
        now - lastNotification.current.shownAt < 2_000
      )
        return;
      lastNotification.current = { message: nextMessage, shownAt: now };
      setMessage(nextMessage);
    };
    window.addEventListener(AI_LIMIT_EVENT, notify);
    return () => window.removeEventListener(AI_LIMIT_EVENT, notify);
  }, []);
  if (!message) return null;
  return (
    <div className="fixed inset-0 z-[200] grid place-items-center bg-slate-950/40 p-5 backdrop-blur-sm">
      <div
        aria-modal="true"
        className="w-full max-w-sm rounded-3xl border border-white/60 bg-white p-6 text-center shadow-2xl dark:border-slate-700 dark:bg-slate-900"
        role="dialog"
      >
        <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-violet-500/10 text-2xl text-violet-600">
          !
        </div>
        <h2 className="mt-4 text-base font-bold">Daily AI limit reached</h2>
        <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
          {message}
        </p>
        <button
          className="mt-6 h-11 w-full rounded-xl bg-violet-600 text-sm font-semibold text-white"
          onClick={() => setMessage(null)}
          type="button"
        >
          Got it
        </button>
      </div>
    </div>
  );
}

export function AppProviders({ children }: PropsWithChildren) {
  const [queryClient] = useState<QueryClient>(createQueryClient);
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <QueryClientProvider client={queryClient}>
        {children}
        <AiLimitNotification />
        {process.env.NODE_ENV === "development" ? (
          <ReactQueryDevtools initialIsOpen={false} />
        ) : null}
      </QueryClientProvider>
    </ThemeProvider>
  );
}
