import { getAllSources, getTopics } from "../../../../../lib/db/queries";
import { getInboxCandidateById } from "../../../../../lib/db/inboxQueries";
import { CardForm, type CardFormInitialData } from "../../../../../components/admin/CardForm";

export default async function NewCardPage(props: PageProps<"/admin/cards/new">) {
  const searchParams = await props.searchParams;
  const fromId = typeof searchParams.from === "string" ? searchParams.from : undefined;

  const [topics, sources, candidate] = await Promise.all([
    getTopics(),
    getAllSources(),
    fromId ? getInboxCandidateById(fromId) : Promise.resolve(null),
  ]);

  // Prefilled from an RSS inbox candidate — headline/source/image only.
  // Body is deliberately left for the editor to write fresh (see the
  // brief's non-negotiable: never copy the source's sentences).
  // prepareDraft() (called when "Draft from this" was clicked) already
  // ensured a matching `source` row exists — find it here by name rather
  // than storing its id separately on the candidate row.
  const matchingSource = candidate ? sources.find((s) => s.name === candidate.sourceName) : undefined;

  const prefill: Partial<CardFormInitialData> | undefined = candidate
    ? {
        cardType: "news",
        headline: candidate.title,
        sourceId: matchingSource?.id,
        sourceDate: candidate.pubDate ? candidate.pubDate.slice(0, 10) : undefined,
        imagePath: candidate.draftImagePath ?? undefined,
        imageAlt: candidate.draftImageAlt ?? undefined,
        imageWidth: candidate.draftImageWidth ?? undefined,
        imageHeight: candidate.draftImageHeight ?? undefined,
        imageBlurDataUrl: candidate.draftImageBlurDataUrl ?? undefined,
      }
    : undefined;

  return (
    <CardForm
      mode="create"
      topics={topics.map((t) => ({ id: t.id, title: t.title }))}
      sources={sources.map((s) => ({ id: s.id, name: s.name, kind: s.kind }))}
      initialData={prefill}
      fromCandidateId={candidate ? candidate.id : undefined}
    />
  );
}
