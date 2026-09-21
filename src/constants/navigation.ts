export const ADMIN_NAVIGATION = [
  { label: "Overview", href: "/dashboard", icon: "⌂", group: null },
  { label: "Users", href: "/users", icon: "♙", group: null },
  { label: "Quizzes & exams", href: "/quizzes", icon: "▤", group: null },
  { label: "Content editor", href: "/content", icon: "✎", group: null },
  { label: "Rewards", href: "/rewards", icon: "✦", group: null },
  { label: "Wallet overview", href: "/finance", icon: "◈", group: "Finance" },
  { label: "Withdrawals", href: "/finance/withdrawals", icon: "↗", group: "Finance" },
  { label: "Deposits", href: "/finance/deposits", icon: "↙", group: "Finance" },
  { label: "Analytics", href: "/analytics", icon: "▥", group: null },
  { label: "Settings", href: "/settings", icon: "⚙", group: null },
] as const;

export type NavItem = (typeof ADMIN_NAVIGATION)[number];
