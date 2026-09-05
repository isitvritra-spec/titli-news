import { eq } from "drizzle-orm";

import { db } from "./client";
import { getDemoDeepDive } from "./demoDeepDives";
import { cards } from "./schema";

async function main() {
  let updated = 0;
  const existingCards = await db
    .select({ id: cards.id, headline: cards.headline })
    .from(cards);

  for (const card of existingCards) {
    const deepDiveBody = getDemoDeepDive(card.headline);
    if (!deepDiveBody) continue;
    const rows = await db
      .update(cards)
      .set({ deepDiveBody, updatedAt: new Date().toISOString() })
      .where(eq(cards.id, card.id))
      .returning({ id: cards.id });
    updated += rows.length;
  }

  console.log(`Backfilled full-story copy for ${updated} cards.`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
