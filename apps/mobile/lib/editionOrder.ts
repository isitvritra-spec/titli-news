import AsyncStorage from "@react-native-async-storage/async-storage";
import type { TodayEdition } from "@repo/api-client";

import { restoreEditionOrder } from "./personalization";

const EDITION_ORDER_KEY = "titli-current-edition-order:v1";

type StoredEditionOrder = {
  editionId: string;
  version: number;
  cardIds: string[];
};

export async function readEditionOrder(edition: TodayEdition): Promise<TodayEdition | null> {
  const raw = await AsyncStorage.getItem(EDITION_ORDER_KEY);
  if (!raw) return null;

  try {
    const stored = JSON.parse(raw) as Partial<StoredEditionOrder>;
    if (
      stored.editionId !== edition.id
      || stored.version !== edition.version
      || !Array.isArray(stored.cardIds)
      || !stored.cardIds.every((id) => typeof id === "string")
    ) {
      return null;
    }
    return restoreEditionOrder(edition, stored.cardIds);
  } catch {
    return null;
  }
}

export async function writeEditionOrder(edition: TodayEdition): Promise<void> {
  const stored: StoredEditionOrder = {
    editionId: edition.id,
    version: edition.version,
    cardIds: edition.cards.map((item) => item.card.id),
  };
  await AsyncStorage.setItem(EDITION_ORDER_KEY, JSON.stringify(stored));
}
