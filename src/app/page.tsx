"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui";
import { apiClient } from "@/lib/api/client";

interface AdminLoginResponse {
  readonly expiresAt: string;
  readonly user: {
    readonly role: "ADMIN";
  };
}

export default function AdminLoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const result = await apiClient<AdminLoginResponse>(
        "/api/v1/auth/admin/login",
        {
          method: "POST",
          body: JSON.stringify({ identifier, password }),
        },
      );

      if (result.user.role !== "ADMIN") {
        throw new Error("Administrator access is required");
      }

      router.replace("/dashboard");
    } catch (loginError: unknown) {
      setError(
        loginError instanceof Error
          ? loginError.message
          : "We could not sign you in. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="from-primary/10 via-background to-background relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br p-5 sm:p-8">
      <div className="pointer-events-none absolute -top-32 -left-28 size-80 rounded-full bg-violet-400/15 blur-3xl" />
      <div className="pointer-events-none absolute -right-32 -bottom-32 size-96 rounded-full bg-blue-400/10 blur-3xl" />

      <section className="surface-card relative w-full max-w-md rounded-3xl p-6 shadow-[0_24px_70px_rgb(38_24_94/0.13)] sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <Image
              alt="Preppal"
              className="size-12 object-contain"
              height={48}
              priority
              src="/assets/brand/preppal-mark.svg"
              width={48}
            />
            <div>
              <p className="text-foreground font-bold tracking-[-0.03em]">
                Preppal Admin
              </p>
              <p className="text-muted-foreground text-xs">
                Operations console
              </p>
            </div>
          </div>
          <span className="border-success/20 bg-success/10 text-success inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold tracking-wide uppercase">
            <svg
              aria-hidden="true"
              className="size-3.5"
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
            Secure
          </span>
        </div>

        <div className="mt-8">
          <span className="text-primary bg-primary/10 inline-flex rounded-full px-3 py-1 text-[10px] font-bold tracking-[0.14em] uppercase">
            Restricted workspace
          </span>
          <h1 className="text-foreground mt-4 text-2xl font-bold tracking-[-0.035em] sm:text-3xl">
            Sign in securely
          </h1>
          <p className="text-muted-foreground mt-2 text-sm leading-6">
            This workspace is available only to authorised Preppal
            administrators.
          </p>
        </div>

        <form className="mt-7 space-y-4" onSubmit={submit}>
          <label className="text-foreground block text-sm font-semibold">
            Administrator email
            <input
              autoComplete="username"
              className="border-border bg-surface focus:border-primary focus:ring-primary/15 mt-1.5 h-11 w-full rounded-xl border px-3 text-sm font-normal transition outline-none focus:ring-4"
              disabled={isSubmitting}
              name="identifier"
              onChange={(event) => setIdentifier(event.target.value)}
              placeholder="admin@preppal.com"
              required
              type="email"
              value={identifier}
            />
          </label>

          <label className="text-foreground block text-sm font-semibold">
            Password
            <input
              autoComplete="current-password"
              className="border-border bg-surface focus:border-primary focus:ring-primary/15 mt-1.5 h-11 w-full rounded-xl border px-3 text-sm font-normal transition outline-none focus:ring-4"
              disabled={isSubmitting}
              name="password"
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your password"
              required
              type="password"
              value={password}
            />
          </label>

          {error ? (
            <p
              aria-live="polite"
              className="border-danger/20 bg-danger/10 text-danger rounded-xl border px-3 py-2.5 text-xs leading-5"
            >
              {error}
            </p>
          ) : null}

          <Button
            className="h-11 w-full rounded-xl"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? "Signing in securely…" : "Sign in to admin"}
          </Button>
        </form>

        <p className="text-muted-foreground mt-6 text-center text-xs leading-5">
          Your access is logged and protected. Contact a platform owner if you
          need administrator access.
        </p>
      </section>
    </main>
  );
}
