import { EDITION_ROLE_CONFIG } from "@repo/api-client";

import { EditionComposer } from "../../../../components/admin/EditionComposer";
import { getComposableCards } from "../../../../lib/db/adminQueries";
import {
  editionDateInIndia,
  getEditionForAdmin,
  sevenAmIndia,
} from "../../../../lib/db/editionQueries";

export const dynamic = "force-dynamic";

export default async function EditionsPage() {
  const date = editionDateInIndia();
  const edition = await getEditionForAdmin(date);
  const slottedIds = (edition?.slots ?? []).map((slot) => slot.cardId).filter(Boolean);
  const publishedCards = await getComposableCards(slottedIds);

  const initialSlots = EDITION_ROLE_CONFIG.map((config) => {
    const existing = edition?.slots.find((slot) => slot.role === config.role);
    return {
      cardId: existing?.cardId ?? "",
      role: config.role,
      recommendationReason: existing?.recommendationReason ?? config.defaultReason,
      isMandatory: existing?.isMandatory ?? config.mandatory,
      editorialImportance: existing?.editorialImportance ?? (config.role === "anchor" ? 100 : 50),
      practicalUtility: existing?.practicalUtility ?? (config.role === "useful_now" ? 100 : 50),
      distressLevel: existing?.distressLevel ?? ("low" as const),
    };
  });

  return (
    <EditionComposer
      date={date}
      status={edition?.status ?? "new"}
      version={edition?.version ?? 1}
      scheduledFor={edition?.scheduledFor ?? sevenAmIndia(date)}
      cards={publishedCards.map((card) => ({
        id: card.id,
        headline: card.headline,
        cardType: card.cardType,
        primaryTopicId: card.primaryTopicId,
        sourceKey: card.sourceId ?? card.surveySourceId,
      }))}
      initialSlots={initialSlots}
    />
  );
}
