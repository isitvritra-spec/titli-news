import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { isAdminAuthenticated } from "../../../../../lib/adminAuth";
import { db } from "../../../../../lib/db/client";
import { sources, storyClusters } from "../../../../../lib/db/schema";
import { getInboxCandidateById } from "../../../../../lib/db/inboxQueries";
import { getTopics } from "../../../../../lib/db/queries";
import { fetchArticleText } from "../../../../../lib/articleText";
import { draftCardFromSource, isGeminiConfigured } from "../../../../../lib/ai/draft";

const bodySchema = z.object({ clusterId: z.string().min(1) });

/**
 * Optional AI pre-fill for the moderator's publish sheet. Returns a suggested
 * headline and summary when a key is configured and the source permits text
 * fetching; otherwise reports that the moderator should write it. Never blocks
 * the flow — the moderator can always type a short summary himself.
 */
export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isGeminiConfigured()) {
    return NextResponse.json({ enabled: false });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Missing story" }, { status: 400 });
  }

  const [cluster] = await db.select().from(storyClusters).where(eq(storyClusters.id, parsed.data.clusterId)).limit(1);
  if (!cluster?.canonicalCandidateId) {
    return NextResponse.json({ error: "Story not found" }, { status: 404 });
  }
  const candidate = await getInboxCandidateById(cluster.canonicalCandidateId);
  if (!candidate) return NextResponse.json({ error: "Story not found" }, { status: 404 });

  const [source] = await db.select().from(sources).where(eq(sources.name, candidate.sourceName)).limit(1);

  // Prefer the full article when the source permits fetching it; otherwise fall
  // back to the feed's own snippet, which we already ingest under syndication.
  // Either way Gemini writes an original summary — never a copy.
  const articleText = source?.allowsTextFetch ? await fetchArticleText(candidate.link) : null;
  const sourceText = articleText ?? candidate.summary ?? null;
  if (!sourceText || sourceText.trim().length < 40) {
    return NextResponse.json({ enabled: false });
  }

  try {
    const topics = await getTopics();
    const draft = await draftCardFromSource({
      sourceTitle: candidate.title,
      sourceText,
      allowedTopicSlugs: topics.map((topic) => topic.slug),
    });
    return NextResponse.json({
      enabled: true,
      headline: draft.headline,
      summary: draft.body,
      deepDive: draft.deepDiveBody,
    });
  } catch {
    return NextResponse.json({ enabled: false });
  }
}
