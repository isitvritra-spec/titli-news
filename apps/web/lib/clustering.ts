/**
 * Groups feed candidates that cover the same underlying story, so the editor
 * triages one row per event instead of the same news from six outlets. This
 * is the object the product blueprint calls `story_cluster`.
 *
 * Deliberately deterministic and dependency-free — no LLM. Two headlines are
 * judged the same story from how much significant vocabulary they share
 * (overlap coefficient, which tolerates one outlet writing a much longer
 * headline than another) plus character-trigram similarity as a guard against
 * coincidental overlap on a couple of common words. The whole thing is pure
 * so it can be unit-tested against real duplicate headlines.
 */

export type TrustTier = "primary" | "trusted" | "discovery";

export type ClusterableCandidate = {
  id: string;
  title: string;
  sourceName: string;
  trustTier: TrustTier;
  /** RSS publication date if present, else the fetch time — both ISO strings. */
  pubDate: string | null;
  fetchedAt: string;
};

export type CandidateCluster = {
  candidateIds: string[];
  canonicalCandidateId: string;
  canonicalTitle: string;
  /** Distinct outlets, not distinct items — two items from one outlet count once. */
  outletCount: number;
  firstSeenAt: string;
};

export type ClusterOptions = {
  /** Minimum combined similarity for two headlines to be the same story. */
  threshold?: number;
  /** How far apart in time two items can be and still join the same cluster. */
  windowMs?: number;
};

// Tuned against real duplicate headlines, where genuine same-story coverage
// scores ~0.4–0.6 and unrelated stories sit near 0 — a wide gap, so the
// threshold sits low enough to catch rewording ("workforce" vs "labour force")
// without risking coincidental merges. Revisit against live inbox data.
const DEFAULT_THRESHOLD = 0.4;
const DEFAULT_WINDOW_MS = 48 * 60 * 60 * 1000;

const TRUST_RANK: Record<TrustTier, number> = { primary: 0, trusted: 1, discovery: 2 };

// Function words plus the handful of editorial filler words that show up in
// almost every Indian news headline and would otherwise inflate similarity.
const STOPWORDS = new Set([
  "the", "a", "an", "and", "or", "but", "of", "to", "in", "on", "for", "with",
  "at", "by", "from", "as", "is", "are", "was", "were", "be", "been", "being",
  "it", "its", "this", "that", "these", "those", "has", "have", "had", "will",
  "would", "can", "could", "may", "might", "over", "after", "amid", "into",
  "up", "down", "out", "new", "says", "say", "said", "report", "reports",
  "india", "indian", "s",
]);

export function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    // Keep numbers whole — "41.7%" becomes "417", a strong shared signal
    // for data stories, instead of splitting into throwaway "41" and "7".
    .replace(/(\d)[.,](\d)/g, "$1$2")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function titleTokens(title: string): Set<string> {
  const tokens = normalizeTitle(title)
    .split(" ")
    // Content words (3+ letters) and any number — a shared statistic is one of
    // the most reliable signs two headlines are the same story.
    .filter((token) => (token.length > 2 || /\d/.test(token)) && !STOPWORDS.has(token));
  return new Set(tokens);
}

export function charTrigrams(title: string): Set<string> {
  const compact = normalizeTitle(title).replace(/ /g, "");
  const grams = new Set<string>();
  for (let i = 0; i + 3 <= compact.length; i += 1) {
    grams.add(compact.slice(i, i + 3));
  }
  return grams;
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 0;
  let intersection = 0;
  for (const value of a) if (b.has(value)) intersection += 1;
  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

function overlapCoefficient(a: Set<string>, b: Set<string>): number {
  const smaller = Math.min(a.size, b.size);
  if (smaller === 0) return 0;
  let intersection = 0;
  for (const value of a) if (b.has(value)) intersection += 1;
  return intersection / smaller;
}

type Prepared = {
  candidate: ClusterableCandidate;
  tokens: Set<string>;
  trigrams: Set<string>;
  timeMs: number;
};

function candidateTimeMs(candidate: ClusterableCandidate): number {
  const primary = candidate.pubDate ? Date.parse(candidate.pubDate) : NaN;
  if (!Number.isNaN(primary)) return primary;
  const fallback = Date.parse(candidate.fetchedAt);
  return Number.isNaN(fallback) ? 0 : fallback;
}

/** Combined headline similarity in [0, 1]. Exported for tuning and tests. */
export function titleSimilarity(a: string, b: string): number {
  const tokenScore = overlapCoefficient(titleTokens(a), titleTokens(b));
  const trigramScore = jaccard(charTrigrams(a), charTrigrams(b));
  return 0.7 * tokenScore + 0.3 * trigramScore;
}

/**
 * Greedy single-link clustering in time order. Each candidate joins the first
 * existing cluster it is similar enough to and close enough in time to;
 * otherwise it starts a new cluster. O(n·k) over candidates and clusters,
 * which is fine for an inbox of hundreds.
 */
export function clusterCandidates(
  candidates: ClusterableCandidate[],
  options: ClusterOptions = {},
): CandidateCluster[] {
  const threshold = options.threshold ?? DEFAULT_THRESHOLD;
  const windowMs = options.windowMs ?? DEFAULT_WINDOW_MS;

  const prepared: Prepared[] = candidates
    .map((candidate) => ({
      candidate,
      tokens: titleTokens(candidate.title),
      trigrams: charTrigrams(candidate.title),
      timeMs: candidateTimeMs(candidate),
    }))
    .sort((a, b) => a.timeMs - b.timeMs);

  const groups: Prepared[][] = [];

  for (const item of prepared) {
    let best: { group: Prepared[]; score: number } | null = null;

    for (const group of groups) {
      const latest = group[group.length - 1]!;
      if (item.timeMs - latest.timeMs > windowMs) continue;

      let bestInGroup = 0;
      for (const member of group) {
        const tokenScore = overlapCoefficient(item.tokens, member.tokens);
        const trigramScore = jaccard(item.trigrams, member.trigrams);
        const score = 0.7 * tokenScore + 0.3 * trigramScore;
        if (score > bestInGroup) bestInGroup = score;
      }

      if (bestInGroup >= threshold && (best === null || bestInGroup > best.score)) {
        best = { group, score: bestInGroup };
      }
    }

    if (best) best.group.push(item);
    else groups.push([item]);
  }

  return groups.map(summarizeGroup);
}

function summarizeGroup(group: Prepared[]): CandidateCluster {
  const canonical = [...group].sort((a, b) => {
    const rank = TRUST_RANK[a.candidate.trustTier] - TRUST_RANK[b.candidate.trustTier];
    if (rank !== 0) return rank;
    if (a.timeMs !== b.timeMs) return a.timeMs - b.timeMs;
    return a.candidate.title.length - b.candidate.title.length;
  })[0]!;

  const outlets = new Set(group.map((item) => item.candidate.sourceName));
  const firstSeenMs = Math.min(...group.map((item) => item.timeMs));

  return {
    candidateIds: group.map((item) => item.candidate.id),
    canonicalCandidateId: canonical.candidate.id,
    canonicalTitle: canonical.candidate.title,
    outletCount: outlets.size,
    firstSeenAt: new Date(firstSeenMs).toISOString(),
  };
}
