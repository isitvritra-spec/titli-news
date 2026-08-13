import type { Metadata } from "next";
import type { ReactNode } from "react";
import localFont from "next/font/local";
import "./globals.css";

// Self-hosted (not next/font/google) — no runtime dependency on Google's
// CDN, consistent with the rest of this app's self-hosted, no-external-
// account architecture. Both are variable fonts, so one file covers the
// whole weight range.
const fraunces = localFont({
  src: "../public/fonts/Fraunces-Variable.woff2",
  variable: "--font-fraunces",
  weight: "500 600",
  display: "swap",
});

const inter = localFont({
  src: "../public/fonts/Inter-Variable.woff2",
  variable: "--font-inter",
  weight: "400 600",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: {
    default: "Titli — bite-size feminism & gender data",
    template: "%s — Titli",
  },
  description:
    "A swipe-through feed of real Indian gender data and feminism news, written fresh from real sources.",
};

export default function RootLayout({
  children,
  modal,
}: {
  children: ReactNode;
  modal: ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-bg text-ink font-body">
        {children}
        {modal}
      </body>
    </html>
  );
}
