/**
 * Rule-based relevance prefilter. Its one job is to keep the Google News
 * firehose from drowning the inbox: an item is only worth an editor's time if
 * it is about women in India, and this decides that cheaply and deterministically
 * before anything more expensive runs.
 *
 * The score here also gives the triage board a first ordering. A future pass
 * (Phase 4, once the model client is wired up) can refine the kept items' scores
 * and topic guesses with Claude — this file is the seam it plugs into, and the
 * `relevance_score` column already exists for it. Everything here stays pure and
 * unit-tested so that refinement is an enhancement, not a dependency.
 */

export type RelevanceInput = {
  title: string;
  sourceTrustTier: "primary" | "trusted" | "discovery";
  sourceType: "official" | "specialist" | "mainstream" | "data" | "aggregator";
};

export type RelevanceResult = {
  /** False means auto_rejected — not about women in India, don't show the editor. */
  keep: boolean;
  /** 0–100, for ranking kept items on the triage board. */
  score: number;
  /** Best-guess topic slug, or null when nothing matches. */
  topicGuess: string | null;
};

// The domain gate. Presence of any of these (or a women-focused specialist
// source) is what makes an item in-scope for Titli.
const WOMEN_TERMS = [
  "women", "woman", "womens", "girl", "girls", "female", "gender", "maternal",
  "maternity", "menstrual", "menstruation", "mother", "widow", "dowry", "bride",
  "wife", "feminist", "feminism", "sexual", "daughter", "mahila", "nari", "beti",
  "she ", "her ",
];

// Ordered by priority — when two buckets tie on keyword hits, the earlier one wins.
const TOPIC_KEYWORDS: { slug: string; terms: string[] }[] = [
  { slug: "safety-justice", terms: ["rape", "assault", "violence", "harassment", "dowry", "trafficking", "acid attack", "molest", "abuse", "domestic", "posh", "crime", "verdict", "court", "police", "fir", "justice"] },
  { slug: "health-wellness", terms: ["maternal", "maternity", "menstrual", "health", "pregnan", "nutrition", "anaemia", "anemia", "sanitation", "reproductive", "mortality", "hospital", "mental health"] },
  { slug: "work-money", terms: ["labour", "labor", "workforce", "employ", "wage", "salary", " pay ", "entrepreneur", "economic", "income", "msme", "loan", "gig", "worker", "job"] },
  { slug: "education-skills", terms: ["education", "school", "student", "literacy", "scholarship", "stem", "skill", "training", "college", "university", "dropout"] },
  { slug: "rural-grassroots", terms: ["rural", "village", "anganwadi", "asha worker", "self-help", "shg", "panchayat", "farmer", "agricultur", "lakhpati", "grassroots"] },
  { slug: "sports-science-culture", terms: ["cricket", "athlete", "olympic", "sport", "science", "research", "scientist", "film", "music", "medal", "culture", "award"] },
  { slug: "rights-policy", terms: ["policy", " law ", " act ", " bill ", "reservation", "parliament", "constitution", "rights", "scheme", "ministry", "welfare", "quota"] },
  { slug: "womens-wins", terms: ["first woman", "breaks barrier", "pioneer", "record", "appointed", "wins"] },
];

const TRUST_BONUS = { primary: 20, trusted: 12, discovery: 0 } as const;

function guessTopic(lowerTitle: string): string | null {
  const padded = ` ${lowerTitle} `;
  let best: { slug: string; hits: number } | null = null;
  for (const bucket of TOPIC_KEYWORDS) {
    const hits = bucket.terms.filter((term) => padded.includes(term)).length;
    if (hits > 0 && (best === null || hits > best.hits)) {
      best = { slug: bucket.slug, hits };
    }
  }
  return best?.slug ?? null;
}

export function scoreRelevance(input: RelevanceInput): RelevanceResult {
  const lower = input.title.toLowerCase();
  const padded = ` ${lower} `;

  const womenHits = WOMEN_TERMS.filter((term) => padded.includes(term)).length;
  const isSpecialist = input.sourceType === "specialist";
  const keep = womenHits > 0 || isSpecialist;

  const topicGuess = guessTopic(lower);

  let score = Math.min(womenHits, 3) * 12; // up to 36 for on-topic vocabulary
  if (isSpecialist) score += 25;
  score += TRUST_BONUS[input.sourceTrustTier];
  if (topicGuess) score += 10;
  score = Math.max(0, Math.min(100, score));

  return {
    keep,
    // A rejected item's score is meaningless; pin it low so nothing surfaces it.
    score: keep ? score : 0,
    topicGuess: keep ? topicGuess : null,
  };
}
