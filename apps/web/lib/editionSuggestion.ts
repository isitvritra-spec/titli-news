/**
 * Proposes a starting seven-card edition that already respects the composer's
 * balance rules, so the editor tunes a coherent draft instead of filling seven
 * empty dropdowns. It optimizes only the constraints derivable from a card —
 * topic spread, a data card in the Number slot, and source concentration — and
 * leaves distress sequencing, importance, and the final say to the editor, whose
 * existing warnings still apply. Pure and unit-tested.
 */

export type SuggestCard = {
  id: string;
  cardType: "news" | "data";
  primaryTopicId: string | null;
  sourceKey: string | null;
};

const MAX_PER_SOURCE = 2;

/** Returns a role→cardId map. Partial if the pool is too small or too concentrated to fill every role. */
export function suggestEdition(cards: SuggestCard[], roles: string[]): Record<string, string> {
  const used = new Set<string>();
  const usedTopics = new Set<string>();
  const sourceCount = new Map<string, number>();
  const result: Record<string, string> = {};

  const available = (card: SuggestCard) =>
    !used.has(card.id) &&
    (!card.sourceKey || (sourceCount.get(card.sourceKey) ?? 0) < MAX_PER_SOURCE);

  // Assign the Number slot first — it should hold a verified data card if one exists.
  const order = [...roles].sort((a, b) => Number(b === "number") - Number(a === "number"));

  for (const role of order) {
    let pool = cards.filter(available);
    if (role === "number") {
      const data = pool.filter((card) => card.cardType === "data");
      if (data.length > 0) pool = data;
    }
    if (pool.length === 0) continue;

    // Prefer a card whose primary topic is not yet represented, to widen spread.
    const pick = [...pool].sort((a, b) => {
      const aFresh = a.primaryTopicId && !usedTopics.has(a.primaryTopicId) ? 0 : 1;
      const bFresh = b.primaryTopicId && !usedTopics.has(b.primaryTopicId) ? 0 : 1;
      return aFresh - bFresh;
    })[0]!;

    result[role] = pick.id;
    used.add(pick.id);
    if (pick.primaryTopicId) usedTopics.add(pick.primaryTopicId);
    if (pick.sourceKey) {
      sourceCount.set(pick.sourceKey, (sourceCount.get(pick.sourceKey) ?? 0) + 1);
    }
  }

  return result;
}
