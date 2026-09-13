"use client";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { Button } from "@/components/ui";
export default function AdminLoginPage() {
  const router = useRouter();
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    router.push("/dashboard");
  };
  return (
    <main className="bg-background flex min-h-screen items-center justify-center p-5">
      <section className="surface-card w-full max-w-md rounded-3xl p-6 sm:p-8">
        <div className="mb-8 flex items-center gap-3">
          <span className="bg-primary text-primary-foreground grid size-11 place-items-center rounded-xl text-sm font-black">
            pp
          </span>
          <div>
            <p className="font-bold">Preppal Admin</p>
            <p className="text-muted-foreground text-xs">Operations console</p>
          </div>
        </div>
        <h1 className="text-2xl font-bold">Welcome back</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Sign in to manage the Preppal platform.
        </p>
        <form className="mt-6 space-y-4" onSubmit={submit}>
          <label className="block text-sm font-medium">
            Work email
            <input
              className="border-border bg-surface focus:border-primary mt-1.5 h-11 w-full rounded-xl border px-3 text-sm outline-none"
              placeholder="admin@preppal.com"
              required
              type="email"
            />
          </label>
          <label className="block text-sm font-medium">
            Password
            <input
              className="border-border bg-surface focus:border-primary mt-1.5 h-11 w-full rounded-xl border px-3 text-sm outline-none"
              placeholder="Enter your password"
              required
              type="password"
            />
          </label>
          <Button className="h-11 w-full rounded-xl" type="submit">
            Sign in to console
          </Button>
        </form>
      </section>
    </main>
  );
}
