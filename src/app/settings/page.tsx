"use client";

import { useState } from "react";
import { AdminShell } from "@/components/layout";
import { Button } from "@/components/ui/button";

type ToggleProps = { label: string; description: string; checked: boolean; onChange: (value: boolean) => void };

function Toggle({ label, description, checked, onChange }: ToggleProps) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 py-3">
      <span>
        <span className="block text-sm font-semibold">{label}</span>
        <span className="text-muted-foreground mt-1 block text-xs leading-relaxed">{description}</span>
      </span>
      <button
        aria-checked={checked}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${checked ? "bg-primary" : "bg-border"}`}
        onClick={() => onChange(!checked)}
        role="switch"
        type="button"
      >
        <span className={`absolute top-1 size-4 rounded-full bg-white shadow-sm transition-transform ${checked ? "left-6" : "left-1"}`} />
      </button>
    </label>
  );
}

function SectionCard({ icon, title, description, children }: { icon: string; title: string; description: string; children: React.ReactNode }) {
  return (
    <section className="surface-card p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <span className="bg-primary/10 text-primary grid size-10 shrink-0 place-items-center rounded-xl text-lg">{icon}</span>
        <div><h2 className="text-base font-bold">{title}</h2><p className="text-muted-foreground mt-1 text-xs leading-relaxed">{description}</p></div>
      </div>
      <div className="mt-5 divide-border divide-y">{children}</div>
    </section>
  );
}

export default function SettingsPage() {
  const [saved, setSaved] = useState(false);
  const [maintenance, setMaintenance] = useState(false);
  const [aiQuestions, setAiQuestions] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [walletAlerts, setWalletAlerts] = useState(true);
  const [leaderboardAlerts, setLeaderboardAlerts] = useState(false);
  const [twoFactor, setTwoFactor] = useState(true);

  function saveSettings() {
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2500);
  }

  return (
    <AdminShell>
      <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div><span className="eyebrow">Admin workspace</span><h1 className="mt-4 text-2xl font-bold sm:text-3xl">Settings</h1><p className="text-muted-foreground mt-2 max-w-2xl text-sm">Manage how Preppal learns, rewards, communicates, and protects its community.</p></div>
        <Button className="inline-flex items-center justify-center gap-2 rounded-xl px-5" onClick={saveSettings}>{saved ? "✓ Changes saved" : "Save changes"}</Button>
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <div className="surface-card flex items-center gap-3 p-4"><span className="bg-success/10 text-success grid size-9 place-items-center rounded-lg">✓</span><div><p className="text-xs font-semibold">Platform status</p><p className="text-success text-sm font-bold">All systems operational</p></div></div>
        <div className="surface-card flex items-center gap-3 p-4"><span className="bg-primary/10 text-primary grid size-9 place-items-center rounded-lg">◎</span><div><p className="text-xs font-semibold">Reward conversion</p><p className="text-sm font-bold">10 XP = 1 coin</p></div></div>
        <div className="surface-card flex items-center gap-3 p-4"><span className="bg-amber-500/10 text-amber-600 grid size-9 place-items-center rounded-lg">₵</span><div><p className="text-xs font-semibold">Coin value</p><p className="text-sm font-bold">₦1,300 / coin</p></div></div>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <SectionCard icon="⚙" title="Platform preferences" description="Set the defaults used throughout the learner experience.">
          <div className="grid gap-4 py-3 sm:grid-cols-2"><label className="text-xs font-semibold">Platform name<input className="border-border bg-background mt-2 h-10 w-full rounded-xl border px-3 text-sm" defaultValue="Preppal" /></label><label className="text-xs font-semibold">Timezone<select className="border-border bg-background mt-2 h-10 w-full rounded-xl border px-3 text-sm" defaultValue="Africa/Lagos"><option>Africa/Lagos (WAT)</option><option>UTC</option></select></label></div>
          <Toggle checked={maintenance} description="Temporarily prevent learner actions while keeping the admin available." label="Maintenance mode" onChange={setMaintenance} />
        </SectionCard>

        <SectionCard icon="▤" title="Learning defaults" description="Control the structure and quality of practice sessions.">
          <div className="grid gap-4 py-3 sm:grid-cols-2"><label className="text-xs font-semibold">Default questions<input className="border-border bg-background mt-2 h-10 w-full rounded-xl border px-3 text-sm" defaultValue="20" min="5" type="number" /></label><label className="text-xs font-semibold">Quiz duration (minutes)<input className="border-border bg-background mt-2 h-10 w-full rounded-xl border px-3 text-sm" defaultValue="30" min="1" type="number" /></label></div>
          <Toggle checked={aiQuestions} description="Mix professionally authored questions with AI-generated practice questions." label="AI-assisted question generation" onChange={setAiQuestions} />
        </SectionCard>

        <SectionCard icon="◎" title="Rewards & finance" description="Keep XP, withdrawable Preppal Coins, and wallet rules clear and consistent.">
          <div className="grid gap-4 py-3 sm:grid-cols-2"><label className="text-xs font-semibold">XP per correct answer<input className="border-border bg-background mt-2 h-10 w-full rounded-xl border px-3 text-sm" defaultValue="10" type="number" /></label><label className="text-xs font-semibold">Check-in XP<input className="border-border bg-background mt-2 h-10 w-full rounded-xl border px-3 text-sm" defaultValue="25" type="number" /></label><label className="text-xs font-semibold">XP per coin<input className="border-border bg-background mt-2 h-10 w-full rounded-xl border px-3 text-sm" defaultValue="10" type="number" /></label><label className="text-xs font-semibold">Coin value (NGN)<input className="border-border bg-background mt-2 h-10 w-full rounded-xl border px-3 text-sm" defaultValue="1300" type="number" /></label></div>
          <div className="bg-surface-subtle text-muted-foreground rounded-xl p-3 text-xs leading-relaxed">Deposited funds are spend-only. Only coins converted from earned XP can be withdrawn.</div>
        </SectionCard>

        <SectionCard icon="◔" title="Notifications" description="Choose which product events should reach learners and admins.">
          <Toggle checked={emailAlerts} description="Account, quiz and security updates by email." label="Email notifications" onChange={setEmailAlerts} /><Toggle checked={walletAlerts} description="Conversion, withdrawal and redemption activity." label="Wallet activity alerts" onChange={setWalletAlerts} /><Toggle checked={leaderboardAlerts} description="Weekly rank and leaderboard milestone updates." label="Leaderboard updates" onChange={setLeaderboardAlerts} />
        </SectionCard>

        <SectionCard icon="◇" title="Admin access & security" description="Protect sensitive learner, content, and finance operations.">
          <Toggle checked={twoFactor} description="Require a second factor for every admin account." label="Require two-factor authentication" onChange={setTwoFactor} />
          <div className="grid gap-4 py-3 sm:grid-cols-2"><label className="text-xs font-semibold">Session timeout<select className="border-border bg-background mt-2 h-10 w-full rounded-xl border px-3 text-sm" defaultValue="8"><option value="1">1 hour</option><option value="8">8 hours</option><option value="24">24 hours</option></select></label><label className="text-xs font-semibold">Default admin role<select className="border-border bg-background mt-2 h-10 w-full rounded-xl border px-3 text-sm" defaultValue="editor"><option value="admin">Administrator</option><option value="editor">Content editor</option><option value="support">Support</option></select></label></div>
          <button className="text-primary inline-flex items-center gap-2 py-3 text-xs font-semibold" type="button">⌑ Manage roles and permissions</button>
        </SectionCard>

        <SectionCard icon="≡" title="Data & audit" description="Keep an accountable record of changes made in the admin workspace.">
          <div className="flex items-center justify-between gap-4 py-3"><div><p className="text-sm font-semibold">Audit log retention</p><p className="text-muted-foreground mt-1 text-xs">Keep activity history for compliance and troubleshooting.</p></div><select className="border-border bg-background h-10 rounded-xl border px-3 text-sm" defaultValue="365"><option value="90">90 days</option><option value="365">1 year</option><option value="forever">Indefinitely</option></select></div>
          <div className="flex flex-wrap gap-3 pt-3"><Button className="bg-surface-subtle text-foreground hover:bg-border rounded-xl" type="button">Export settings</Button><Button className="bg-surface-subtle text-foreground hover:bg-border rounded-xl" type="button">View audit log</Button></div>
        </SectionCard>
      </div>
    </AdminShell>
  );
}
