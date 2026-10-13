import type { AdminIconName } from "@/components/ui";

export const ADMIN_NAVIGATION: ReadonlyArray<{
  readonly group:
    "Commerce" | "Content" | "Insights" | "Learners" | "System" | null;
  readonly href: string;
  readonly icon: AdminIconName;
  readonly label: string;
}> = [
  { label: "Overview", href: "/dashboard", icon: "dashboard", group: null },
  { label: "Learners", href: "/users", icon: "users", group: "Learners" },
  {
    label: "Questions & exams",
    href: "/quizzes",
    icon: "content",
    group: "Content",
  },
  {
    label: "Blog management",
    href: "/content",
    icon: "blog",
    group: "Content",
  },
  {
    label: "Rewards & goals",
    href: "/rewards",
    icon: "rewards",
    group: "Learners",
  },
  {
    label: "Wallets",
    href: "/finance",
    icon: "finance",
    group: "Commerce",
  },
  {
    label: "Withdrawals",
    href: "/finance/withdrawals",
    icon: "withdrawals",
    group: "Commerce",
  },
  {
    label: "Payments",
    href: "/finance/deposits",
    icon: "deposits",
    group: "Commerce",
  },
  {
    label: "Analytics",
    href: "/analytics",
    icon: "analytics",
    group: "Insights",
  },
  { label: "Settings", href: "/settings", icon: "settings", group: "System" },
];

export type NavItem = (typeof ADMIN_NAVIGATION)[number];
