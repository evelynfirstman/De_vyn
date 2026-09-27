import type { ReactNode } from "react";
import type { Metadata } from "next";
import "@vyn/tokens/tokens.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vyn Therapy — Design System (Phase 1)",
  description: "Single showcase page for Vyn Therapy design tokens and components.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
