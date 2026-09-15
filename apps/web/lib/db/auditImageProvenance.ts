import { eq } from "drizzle-orm";

import { db } from "./client";
import { cards, sources } from "./schema";

/**
 * Read-only audit. Every card that predates provenance tracking carries
 * `image_origin = "unknown"`, which means nobody has confirmed we are
 * allowed to host its image. This lists them, worst first, so they can be
 * re-imaged deliberately — it deliberately changes nothing, because the
 * right fix per card (re-image, add a credit, mark as our own) is an
 * editorial judgement, not something a script should guess.
 */
async function main() {
  const rows = await db
    .select({
      id: cards.id,
      headline: cards.headline,
      slug: cards.slug,
      status: cards.status,
      imageOrigin: cards.imageOrigin,
      sourceName: sources.name,
      imagePolicy: sources.imagePolicy,
    })
    .from(cards)
    .leftJoin(sources, eq(cards.sourceId, sources.id));

  const unresolved = rows.filter((row) => row.imageOrigin === "unknown");
  const published = unresolved.filter((row) => row.status === "published");
  const fromDeniedSource = published.filter((row) => row.imagePolicy !== "allow");

  console.log(`Cards total:                    ${rows.length}`);
  console.log(`Unrecorded image provenance:    ${unresolved.length}`);
  console.log(`  ...of which published:        ${published.length}`);
  console.log(`  ...from a non-permitted source: ${fromDeniedSource.length}`);

  if (fromDeniedSource.length > 0) {
    console.log("\nPublished cards whose source does not permit image reuse:");
    for (const row of fromDeniedSource) {
      console.log(`  ${row.slug}`);
      console.log(`    "${row.headline}"`);
      console.log(`    source: ${row.sourceName ?? "(none)"} · policy: ${row.imagePolicy ?? "n/a"}`);
    }
    console.log(
      "\nRe-image these or confirm the source's licence, then set the image origin on each card.",
    );
  }

  const remainder = published.filter((row) => row.imagePolicy === "allow");
  if (remainder.length > 0) {
    console.log(`\n${remainder.length} published card(s) come from a permitted source but still`);
    console.log("need an origin and credit recorded on the card itself.");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
