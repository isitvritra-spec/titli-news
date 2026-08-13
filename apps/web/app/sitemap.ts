import type { MetadataRoute } from "next";
import { getAllCardSlugs, getTopics } from "../lib/db/queries";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [slugs, topics] = await Promise.all([getAllCardSlugs(), getTopics()]);

  return [
    { url: SITE_URL, changeFrequency: "hourly" },
    ...slugs.map((slug) => ({ url: `${SITE_URL}/card/${slug}` })),
    ...topics.map((topic) => ({ url: `${SITE_URL}/topic/${topic.slug}` })),
  ];
}
