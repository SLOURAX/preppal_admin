import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Bot,
  ChartNoAxesCombined,
  FileQuestion,
  Gift,
  LayoutDashboard,
  Newspaper,
  Settings,
  Users,
  WalletCards,
  type LucideIcon,
  type LucideProps,
} from "lucide-react";

export type AdminIconName =
  | "analytics"
  | "blog"
  | "ai"
  | "content"
  | "dashboard"
  | "deposits"
  | "finance"
  | "rewards"
  | "settings"
  | "users"
  | "withdrawals";

interface AdminIconProps extends LucideProps {
  readonly name: AdminIconName;
}

const ADMIN_ICONS: Record<AdminIconName, LucideIcon> = {
  ai: Bot,
  analytics: ChartNoAxesCombined,
  blog: Newspaper,
  content: FileQuestion,
  dashboard: LayoutDashboard,
  deposits: ArrowUpFromLine,
  finance: WalletCards,
  rewards: Gift,
  settings: Settings,
  users: Users,
  withdrawals: ArrowDownToLine,
};

export function AdminIcon({ name, ...props }: AdminIconProps) {
  const Icon = ADMIN_ICONS[name];
  return <Icon aria-hidden="true" strokeWidth={1.9} {...props} />;
}
