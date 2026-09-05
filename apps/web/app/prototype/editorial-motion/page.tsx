import type { Metadata } from "next";

import { EditorialMotionPrototype } from "./EditorialMotionPrototype";

export const metadata: Metadata = {
  title: "Editorial Motion prototype",
  robots: { index: false, follow: false },
};

export default async function EditorialMotionPrototypePage({
  searchParams,
}: {
  searchParams: Promise<{ scene?: string | string[] }>;
}) {
  const requestedScene = (await searchParams).scene;
  return <EditorialMotionPrototype initialScene={typeof requestedScene === "string" ? requestedScene : undefined} />;
}
