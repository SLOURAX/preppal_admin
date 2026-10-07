import type { AdminIconName } from "@/components/ui";

export const ADMIN_NAVIGATION: ReadonlyArray<{
  readonly group: "Finance" | "Management" | "Monitoring" | "System" | null;
  readonly href: string;
  readonly icon: AdminIconName;
  readonly label: string;
}> = [
  { label: "Overview", href: "/dashboard", icon: "dashboard", group: null },
  { label: "Users", href: "/users", icon: "users", group: "Management" },
  {
    label: "Quizzes & exams",
    href: "/quizzes",
    icon: "content",
    group: "Management",
  },
  {
    label: "Blog management",
    href: "/content",
    icon: "blog",
    group: "Management",
  },
  { label: "Rewards", href: "/rewards", icon: "rewards", group: "Management" },
  {
    label: "Wallet overview",
    href: "/finance",
    icon: "finance",
    group: "Finance",
  },
  {
    label: "Withdrawals",
    href: "/finance/withdrawals",
    icon: "withdrawals",
    group: "Finance",
  },
  {
    label: "Deposits",
    href: "/finance/deposits",
    icon: "deposits",
    group: "Finance",
  },
  {
    label: "Analytics",
    href: "/analytics",
    icon: "analytics",
    group: "Monitoring",
  },
  { label: "Settings", href: "/settings", icon: "settings", group: "System" },
];

export type NavItem = (typeof ADMIN_NAVIGATION)[number];
