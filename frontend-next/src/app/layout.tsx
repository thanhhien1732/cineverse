import type { Metadata } from "next";
import "./globals.css";
import { FeedbackProvider } from "@/components/feedback/feedback-provider";
import { AppShell } from "@/components/layout/app-shell";

export const metadata: Metadata = {
  title: {
    default: "CINEVERSE",
    template: "%s | CINEVERSE",
  },
  description: "A cinematic movie booking experience.",
  icons: {
    icon: "/assets/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body className="flex min-h-screen flex-col">
        <FeedbackProvider>
          <AppShell>{children}</AppShell>
        </FeedbackProvider>
      </body>
    </html>
  );
}
