import { AdminShell } from "@/components/layout";
export default function DashboardPage() {
  return (
    <AdminShell>
      <div className="mb-8">
        <span className="eyebrow">Operations workspace</span>
        <h1 className="mt-4 text-3xl font-bold tracking-tight">
          Platform overview
        </h1>
        <p className="text-muted-foreground mt-2 text-sm">
          Monitor and manage the Preppal experience from one place.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          "Active users",
          "Quizzes completed",
          "Pending withdrawals",
          "XP issued",
        ].map((label) => (
          <article className="surface-card rounded-2xl p-5" key={label}>
            <p className="text-muted-foreground text-xs">{label}</p>
            <p className="mt-3 text-2xl font-bold">—</p>
            <p className="text-muted-foreground mt-1 text-xs">Coming soon</p>
          </article>
        ))}
      </div>
      <div className="surface-card mt-6 rounded-2xl border border-dashed p-8 text-center">
        <p className="font-semibold">Your admin workspace is ready</p>
        <p className="text-muted-foreground mt-1 text-sm">
          Choose a section from the sidebar. Detailed tools and data views are
          coming soon.
        </p>
      </div>
    </AdminShell>
  );
}
