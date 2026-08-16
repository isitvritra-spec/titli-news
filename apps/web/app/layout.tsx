import type { Metadata } from "next";
import type { ReactNode } from "react";
import localFont from "next/font/local";
import "./globals.css";

// Self-hosted (not next/font/google) — no runtime dependency on Google's
// CDN, consistent with the rest of this app's self-hosted, no-external-
// account architecture. Both cover Devanagari + Latin in one family, since
// the content is Indian-language-capable. Anek Devanagari is a variable
// font (one file covers the weight range); Mukta only ships static weight
// cuts, so it's loaded as two separate files instead.
const anekDevanagari = localFont({
  src: "../public/fonts/AnekDevanagari-Variable.woff2",
  variable: "--font-anek-devanagari",
  weight: "500 600",
  display: "swap",
});

const mukta = localFont({
  src: [
    { path: "../public/fonts/Mukta-Regular.woff2", weight: "400", style: "normal" },
    { path: "../public/fonts/Mukta-Medium.woff2", weight: "500", style: "normal" },
  ],
  variable: "--font-mukta",
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
      className={`${anekDevanagari.variable} ${mukta.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-bg text-ink font-body">
        {children}
        {modal}
      </body>
    </html>
  );
}
