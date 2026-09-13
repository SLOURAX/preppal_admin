import type { Metadata } from "next";

import { AppProviders } from "@/providers";

import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Preppal Admin", template: "%s | Preppal Admin" },
  description: "Operations workspace for the Preppal learning platform.",
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
