import type { Metadata } from "next";

import { AppProviders } from "@/providers";

import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Preppal Admin", template: "%s | Preppal Admin" },
  description: "Operations workspace for the Preppal learning platform.",
  icons: {
    icon: "/assets/brand/preppal-mark.svg",
    apple: "/assets/brand/preppal-mark.svg",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-full antialiased">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
