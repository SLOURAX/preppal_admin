import type { SVGProps } from "react";

export type AdminIconName =
  | "analytics"
  | "blog"
  | "content"
  | "dashboard"
  | "deposits"
  | "finance"
  | "rewards"
  | "settings"
  | "users"
  | "withdrawals";

interface AdminIconProps extends SVGProps<SVGSVGElement> {
  readonly name: AdminIconName;
}

export function AdminIcon({ name, ...props }: AdminIconProps) {
  const common = {
    fill: "none",
    stroke: "currentColor",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    strokeWidth: 1.9,
  };

  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" {...props}>
      {name === "dashboard" ? (
        <>
          <rect {...common} height="7" rx="1.5" width="7" x="3" y="3" />
          <rect {...common} height="7" rx="1.5" width="7" x="14" y="3" />
          <rect {...common} height="7" rx="1.5" width="7" x="3" y="14" />
          <rect {...common} height="7" rx="1.5" width="7" x="14" y="14" />
        </>
      ) : null}
      {name === "users" ? (
        <>
          <circle {...common} cx="9" cy="8" r="3" />
          <path {...common} d="M3.5 20c.5-3.3 2.4-5 5.5-5s5 1.7 5.5 5" />
          <path
            {...common}
            d="M16 5.5a3 3 0 0 1 0 5M16.5 15.2c2.2.3 3.5 1.9 4 4.8"
          />
        </>
      ) : null}
      {name === "content" ? (
        <>
          <rect {...common} height="17" rx="2" width="14" x="5" y="3.5" />
          <path {...common} d="M8.5 8h7M8.5 12h7M8.5 16H13" />
        </>
      ) : null}
      {name === "blog" ? (
        <>
          <path
            {...common}
            d="M5 4.5h10a2 2 0 0 1 2 2v13H7a2 2 0 0 1-2-2v-13Z"
          />
          <path
            {...common}
            d="M17 8.5h2a2 2 0 0 1 2 2v9h-4M8.5 9h5M8.5 12.5h5M8.5 16h3"
          />
        </>
      ) : null}
      {name === "rewards" ? (
        <>
          <path {...common} d="M12 3v18M4 9h16M5 9l1 11h12l1-11M6 5h12v4H6z" />
          <path
            {...common}
            d="M12 9c-2.8 0-4.5-1.2-4.5-3.1C7.5 4.7 8.3 4 9.4 4c1.2 0 2.1.9 2.6 2.1C12.5 4.9 13.4 4 14.6 4c1.1 0 1.9.7 1.9 1.9C16.5 7.8 14.8 9 12 9Z"
          />
        </>
      ) : null}
      {name === "finance" ? (
        <>
          <rect {...common} height="13" rx="2" width="18" x="3" y="6" />
          <path {...common} d="M3 10h18M16 15h2" />
        </>
      ) : null}
      {name === "withdrawals" ? (
        <>
          <path {...common} d="M4 18.5h16M12 4v11M7.5 10.5 12 15l4.5-4.5" />
          <path {...common} d="M5 4h14" />
        </>
      ) : null}
      {name === "deposits" ? (
        <>
          <path {...common} d="M4 18.5h16M12 15V4M7.5 8.5 12 4l4.5 4.5" />
          <path {...common} d="M5 20h14" />
        </>
      ) : null}
      {name === "analytics" ? (
        <>
          <path {...common} d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
          <path {...common} d="m4 8 5-4 5 5 6-6" />
        </>
      ) : null}
      {name === "settings" ? (
        <>
          <circle {...common} cx="12" cy="12" r="3" />
          <path
            {...common}
            d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.1 2.1-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-3v-.2a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1-2.1-2.1.1-.1A1.7 1.7 0 0 0 7 15a1.7 1.7 0 0 0-1.6-1H5.2v-3h.2A1.7 1.7 0 0 0 7 10a1.7 1.7 0 0 0-.3-1.9l-.1-.1 2.1-2.1.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.6v-.2h3v.2a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1 2.1 2.1-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v3h-.2a1.7 1.7 0 0 0-1.6 1Z"
          />
        </>
      ) : null}
    </svg>
  );
}
