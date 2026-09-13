import type { ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export function Button({
  className,
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type={type}
      className={cn(
        "bg-primary text-primary-foreground hover:bg-primary-strong min-h-10 rounded-full px-4 text-sm font-semibold transition disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}
