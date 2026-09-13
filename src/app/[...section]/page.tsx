import { notFound } from "next/navigation";
import { AdminShell } from "@/components/layout";
import { ADMIN_NAVIGATION } from "@/constants";
export default async function AdminSectionPage({
  params,
}: {
  params: Promise<{ section: string[] }>;
}) {
  const { section } = await params;
  const key = section.join("/");
  const item = ADMIN_NAVIGATION.find((entry) => entry.href.slice(1) === key);
  if (!item) notFound();
  return (
    <AdminShell>
      <div className="mb-8">
        <span className="eyebrow">Admin workspace</span>
        <h1 className="mt-4 text-3xl font-bold">{item.label}</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          Tools and controls for this area.
        </p>
      </div>
      <div className="surface-card flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed p-8 text-center">
        <span className="bg-primary/10 text-primary mb-4 grid size-12 place-items-center rounded-2xl text-xl">
          {item.icon}
        </span>
        <p className="font-semibold">{item.label} workspace</p>
        <p className="text-muted-foreground mt-1 text-sm">
          This section is coming soon.
        </p>
      </div>
    </AdminShell>
  );
}
