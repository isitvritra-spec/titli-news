import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { isAdminAuthenticated } from "../../../../../../lib/adminAuth";
import { db } from "../../../../../../lib/db/client";
import { sources } from "../../../../../../lib/db/schema";
import { getInboxCandidateById, markCandidateDrafted, prepareDraft } from "../../../../../../lib/db/inboxQueries";
import { createCard, type CardInput } from "../../../../../../lib/db/adminQueries";
import { getTopics } from "../../../../../../lib/db/queries";
import { fetchArticleText } from "../../../../../../lib/articleText";
import { draftCardFromSource, isGeminiConfigured } from "../../../../../../lib/ai/draft";
import { findVerbatimRuns } from "../../../../../../lib/originality";

function slugify(headline: string, salt: string): string {
  const base = headline
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 88);
  return `${base}-${salt.slice(0, 6)}`;
}

export async function POST(_request: Request, context: RouteContext<"/api/admin/inbox/[id]/ai-draft">) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isGeminiConfigured()) {
    return NextResponse.json(
      { error: "AI drafting is not configured. Set GEMINI_API_KEY, or draft manually." },
      { status: 501 },
    );
  }

  const { id } = await context.params;
  const candidate = await getInboxCandidateById(id);
  if (!candidate) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Resolve the source (prepareDraft guarantees the row exists and applies the
  // image policy) and enforce the text-fetch policy before reading the article.
  const prepared = await prepareDraft(id);
  if (!prepared) {
    return NextResponse.json({ error: "Could not prepare this candidate" }, { status: 500 });
  }
  const [source] = await db.select().from(sources).where(eq(sources.id, prepared.sourceId)).limit(1);
  if (!source?.allowsTextFetch) {
    return NextResponse.json(
      { error: "This source does not permit article-text fetching. Draft manually instead." },
      { status: 409 },
    );
  }

  const articleText = await fetchArticleText(candidate.link);
  if (!articleText) {
    return NextResponse.json(
      { error: "Could not read the article text. Draft manually instead." },
      { status: 422 },
    );
  }

  const topics = await getTopics();
  const allowedSlugs = topics.map((topic) => topic.slug);

  let draft;
  try {
    draft = await draftCardFromSource({
      sourceTitle: candidate.title,
      sourceText: articleText,
      allowedTopicSlugs: allowedSlugs,
    });
  } catch (error) {
    return NextResponse.json(
      { error: `The model could not draft this one: ${(error as Error).message}` },
      { status: 502 },
    );
  }

  // Originality is measured now, against the in-memory article; only the
  // overlapping fragments are kept, never the article.
  const originality = findVerbatimRuns(draft.body, articleText);

  // Map the model's topic slugs to ids; fall back to the first topic so the
  // draft always has a valid primary genre for the editor to adjust.
  const matched = topics.filter((topic) => draft.topicSlugs.includes(topic.slug));
  const topicIds = (matched.length > 0 ? matched : topics.slice(0, 1)).map((t) => t.id);
  const primaryTopicId = topicIds[0] ?? "";
  if (!primaryTopicId) {
    return NextResponse.json({ error: "No topics exist to assign" }, { status: 500 });
  }

  const refreshed = await getInboxCandidateById(id);
  const input: CardInput = {
    cardType: "news",
    status: "draft",
    headline: draft.headline,
    slug: slugify(draft.headline, candidate.id),
    body: draft.body,
    deepDiveBody: draft.deepDiveBody,
    imagePath: refreshed?.draftImagePath ?? "",
    imageAlt: refreshed?.draftImageAlt ?? draft.headline,
    imageWidth: refreshed?.draftImageWidth ?? 0,
    imageHeight: refreshed?.draftImageHeight ?? 0,
    imageBlurDataUrl: refreshed?.draftImageBlurDataUrl ?? "",
    imageOrigin: refreshed?.draftImageOrigin ?? "generated",
    imageCredit: refreshed?.draftImageCredit ?? undefined,
    imageSourceUrl: refreshed?.draftImageOrigin === "source_permitted" ? candidate.link : undefined,
    publishedAt: new Date().toISOString(),
    isContested: false,
    topicIds,
    primaryTopicId,
    sourceId: prepared.sourceId,
    sourceDate: candidate.pubDate ? candidate.pubDate.slice(0, 10) : undefined,
    sourceHeadline: candidate.title,
    aiGenerated: true,
    aiReviewed: false,
    originalityMaxRun: originality.maxRun,
    originalitySpans: originality.spans,
  };

  const cardId = await createCard(input);
  await markCandidateDrafted(candidate.id, cardId);

  return NextResponse.json({ cardId }, { status: 201 });
}
