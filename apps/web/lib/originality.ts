/**
 * Originality checks for the publish gate. Titli's one non-negotiable is that a
 * human writes the card fresh — never a copy of the source's sentences. When a
 * draft is machine-written, these functions catch a headline that still matches
 * the source and any verbatim run of the source's wording that survived into the
 * body.
 *
 * The design deliberately never stores the source article. At draft time we run
 * `findVerbatimRuns` against the fetched text (in memory) and keep only the
 * overlapping fragments it found — short runs that are the very thing to remove.
 * At publish time `remainingSpans` re-checks the current body against those
 * stored fragments, so an editor who rewrote them passes and one who didn't is
 * blocked, all without retaining the publisher's prose.
 *
 * Pure and dependency-free so the gate is fully unit-tested.
 */

/** The default verbatim run length, in words, that counts as copied. */
export const ORIGINALITY_MIN_RUN = 8;

/** Lowercase, strip punctuation, split into words — the comparison unit throughout. */
export function normalizeWords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean);
}

/** A headline is "copied" if it is word-for-word the source headline after normalization. */
export function normalizedHeadlinesMatch(a: string, b: string): boolean {
  const wa = normalizeWords(a);
  const wb = normalizeWords(b);
  if (wa.length === 0 || wb.length === 0) return false;
  return wa.join(" ") === wb.join(" ");
}

export type VerbatimResult = {
  /** Longest shared verbatim run found, in words (0 if none reach the threshold). */
  maxRun: number;
  /** The overlapping fragments themselves, normalized — what the editor must rewrite. */
  spans: string[];
};

/**
 * Finds contiguous word runs of at least `minWords` that appear in both texts.
 * Works by matching the candidate's k-word shingles against the source's, then
 * merging adjacent hits into maximal spans — an approximation that is more than
 * strong enough to flag copied sentences while staying O(n).
 */
export function findVerbatimRuns(
  candidate: string,
  source: string,
  minWords: number = ORIGINALITY_MIN_RUN,
): VerbatimResult {
  const cw = normalizeWords(candidate);
  const sw = normalizeWords(source);
  if (cw.length < minWords || sw.length < minWords) return { maxRun: 0, spans: [] };

  const sourceGrams = new Set<string>();
  for (let i = 0; i + minWords <= sw.length; i += 1) {
    sourceGrams.add(sw.slice(i, i + minWords).join(" "));
  }

  const hits: number[] = [];
  for (let i = 0; i + minWords <= cw.length; i += 1) {
    if (sourceGrams.has(cw.slice(i, i + minWords).join(" "))) hits.push(i);
  }
  if (hits.length === 0) return { maxRun: 0, spans: [] };

  // Merge consecutive hit-starts into maximal runs.
  const spans: string[] = [];
  let maxRun = 0;
  let runStart = hits[0]!;
  let prev = hits[0]!;
  const flush = (lastStart: number) => {
    const end = lastStart + minWords; // exclusive
    const words = cw.slice(runStart, end);
    spans.push(words.join(" "));
    if (words.length > maxRun) maxRun = words.length;
  };
  for (let k = 1; k < hits.length; k += 1) {
    if (hits[k] === prev + 1) {
      prev = hits[k]!;
      continue;
    }
    flush(prev);
    runStart = hits[k]!;
    prev = hits[k]!;
  }
  flush(prev);

  return { maxRun, spans };
}

/**
 * Which of the previously-flagged spans still appear verbatim in the current
 * body. Empty means the editor rewrote every copied fragment — the gate passes.
 */
export function remainingSpans(body: string, spans: string[]): string[] {
  if (spans.length === 0) return [];
  const haystack = normalizeWords(body).join(" ");
  return spans.filter((span) => span.length > 0 && haystack.includes(span));
}
