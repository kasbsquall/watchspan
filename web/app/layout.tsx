import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Watchspan",
  description:
    "The human attention budget for agent fleets. Everyone sells human in the loop; Watchspan measures whether that human is still there.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
