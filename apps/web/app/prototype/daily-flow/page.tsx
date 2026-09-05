import type { Metadata } from "next";
import { Suspense } from "react";

import { DailyFlowPrototype } from "./DailyFlowPrototype";

export const metadata: Metadata = {
  title: "Daily flow prototype",
  robots: { index: false, follow: false },
};

// Three views of Titli's proposed daily ritual, switchable via ?variant=.
export default function DailyFlowPrototypePage() {
  return (
    <Suspense fallback={<main className="min-h-dvh bg-bg" />}>
      <DailyFlowPrototype />
    </Suspense>
  );
}
