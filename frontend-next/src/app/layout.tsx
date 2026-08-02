import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "@/components/layout/app-shell";

export const metadata: Metadata = {
  title: {
    default: "Cineverse",
    template: "%s | Cineverse",
  },
  description: "A cinematic movie booking experience.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body className="flex min-h-screen flex-col">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
