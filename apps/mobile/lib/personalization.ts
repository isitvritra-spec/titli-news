import type { Card, EditionCard, TodayEdition, TopicRef } from "@repo/api-client";

const DAY_MS = 24 * 60 * 60 * 1_000;
export const BEHAVIOR_HALF_LIFE_MS = 21 * DAY_MS;
export const MAX_TOPIC_AFFINITY = 10;

export const READER_SIGNAL_WEIGHTS = {
  save: 4,
  source_open: 3,
  share: 3,
  detail_open: 2,
  healthy_dwell: 1,
  fast_skip: -1,
  repeated_fast_skip: -2,
  less_like_this: -5,
} as const;

export type ReaderSignal = Exclude<keyof typeof READER_SIGNAL_WEIGHTS, "repeated_fast_skip">;

export type TopicPreference = {
  behaviorWeight: number;
  updatedAt: number;
  fastSkipStreak: number;
  interactions: number;
};

export type ReaderProfile = {
  version: 1;
  topics: Record<string, TopicPreference>;
};

export function createReaderProfile(): ReaderProfile {
  return { version: 1, topics: {} };
}

export function parseReaderProfile(value: unknown): ReaderProfile {
  if (!isRecord(value) || value.version !== 1 || !isRecord(value.topics)) {
    return createReaderProfile();
  }

  const topics: Record<string, TopicPreference> = {};
  for (const [slug, preference] of Object.entries(value.topics)) {
    if (!isRecord(preference)) continue;

    const behaviorWeight = finiteNumber(preference.behaviorWeight);
    const updatedAt = finiteNumber(preference.updatedAt);
    const fastSkipStreak = finiteNumber(preference.fastSkipStreak);
    const interactions = finiteNumber(preference.interactions);
    if (behaviorWeight == null || updatedAt == null || updatedAt < 0) continue;

    topics[slug] = {
      behaviorWeight: clamp(behaviorWeight, -MAX_TOPIC_AFFINITY, MAX_TOPIC_AFFINITY),
      updatedAt,
      fastSkipStreak: Math.max(0, Math.floor(fastSkipStreak ?? 0)),
      interactions: Math.max(0, Math.floor(interactions ?? 0)),
    };
  }

  return { version: 1, topics };
}

export function applyReaderSignal(
  profile: ReaderProfile,
  signal: ReaderSignal,
  topicSlugs: readonly string[],
  occurredAt = Date.now(),
): ReaderProfile {
  const uniqueSlugs = [...new Set(topicSlugs.filter(Boolean))];
  if (uniqueSlugs.length === 0) return profile;

  const topics = { ...profile.topics };
  for (const slug of uniqueSlugs) {
    const current = topics[slug];
    const decayedWeight = current
      ? decayBehaviorWeight(current.behaviorWeight, current.updatedAt, occurredAt)
      : 0;
    const repeatedSkip = signal === "fast_skip" && (current?.fastSkipStreak ?? 0) > 0;
    const delta = repeatedSkip
      ? READER_SIGNAL_WEIGHTS.repeated_fast_skip
      : READER_SIGNAL_WEIGHTS[signal];

    topics[slug] = {
      behaviorWeight: clamp(
        decayedWeight + delta,
        -MAX_TOPIC_AFFINITY,
        MAX_TOPIC_AFFINITY,
      ),
      updatedAt: occurredAt,
      fastSkipStreak: signal === "fast_skip" ? (current?.fastSkipStreak ?? 0) + 1 : 0,
      interactions: (current?.interactions ?? 0) + 1,
    };
  }

  return { version: 1, topics };
}

export function decayBehaviorWeight(weight: number, from: number, to: number): number {
  const elapsed = Math.max(0, to - from);
  return weight * Math.pow(0.5, elapsed / BEHAVIOR_HALF_LIFE_MS);
}

export function getTopicAffinity(
  profile: ReaderProfile,
  selectedTopicSlugs: ReadonlySet<string>,
  topicSlug: string,
  now = Date.now(),
): number {
  const preference = profile.topics[topicSlug];
  const behaviorWeight = preference
    ? decayBehaviorWeight(preference.behaviorWeight, preference.updatedAt, now)
    : 0;
  const explicitWeight = selectedTopicSlugs.has(topicSlug) ? 5 : 0;
  return clamp(behaviorWeight + explicitWeight, -MAX_TOPIC_AFFINITY, MAX_TOPIC_AFFINITY);
}

export function getCardSignalTopics(card: Card): string[] {
  const primarySlug = card.primaryGenre?.slug ?? card.topics[0]?.slug;
  return primarySlug ? [primarySlug] : [];
}

export function personalizeEdition(
  edition: TodayEdition,
  selectedTopicSlugs: readonly string[],
  profile: ReaderProfile,
  now = Date.now(),
): TodayEdition {
  const selectedTopics = new Set(selectedTopicSlugs);
  const editorialOrder = [...edition.cards].sort((a, b) => a.position - b.position);
  const protectFirstThree = !Object.values(profile.topics).some(
    (preference) => preference.interactions > 0,
  );
  const rankedMovableCards = editorialOrder
    .filter((item) => !isPositionProtected(item, protectFirstThree))
    .sort((a, b) => {
      const scoreDifference = scoreEditionCard(b, selectedTopics, profile, now)
        - scoreEditionCard(a, selectedTopics, profile, now);
      return scoreDifference || a.position - b.position;
    });

  let movableIndex = 0;
  const cards = editorialOrder.map((slot, position) => {
    const item = isPositionProtected(slot, protectFirstThree)
      ? slot
      : rankedMovableCards[movableIndex++]!;
    return {
      ...item,
      position,
      recommendationReason: recommendationReason(item, selectedTopics, profile, now),
    };
  });

  return { ...edition, cards };
}

export function restoreEditionOrder(
  edition: TodayEdition,
  orderedCardIds: readonly string[],
): TodayEdition | null {
  if (orderedCardIds.length !== edition.cards.length) return null;

  const byId = new Map(edition.cards.map((item) => [item.card.id, item]));
  if (byId.size !== edition.cards.length || new Set(orderedCardIds).size !== byId.size) return null;

  const orderedCards = orderedCardIds.flatMap((id) => {
    const item = byId.get(id);
    return item ? [item] : [];
  });
  if (orderedCards.length !== edition.cards.length) return null;

  return {
    ...edition,
    cards: orderedCards.map((item, position) => ({ ...item, position })),
  };
}

function scoreEditionCard(
  item: EditionCard,
  selectedTopics: ReadonlySet<string>,
  profile: ReaderProfile,
  now: number,
): number {
  const affinities = item.card.topics.map((topic) =>
    getTopicAffinity(profile, selectedTopics, topic.slug, now),
  );
  const strongestAffinity = affinities.length > 0 ? Math.max(...affinities) : 0;
  const readerRelevance = (strongestAffinity + MAX_TOPIC_AFFINITY) / (2 * MAX_TOPIC_AFFINITY);
  const preferences = item.card.topics.flatMap((topic) => {
    const preference = profile.topics[topic.slug];
    return preference ? [preference] : [];
  });
  const novelty = preferences.length === 0
    ? 1
    : Math.max(...preferences.map((preference) => 1 / (1 + preference.interactions / 3)));
  const fatigue = preferences.length === 0
    ? 0
    : Math.max(...preferences.map((preference) => {
        const decayedWeight = decayBehaviorWeight(
          preference.behaviorWeight,
          preference.updatedAt,
          now,
        );
        return Math.max(
          Math.max(0, -decayedWeight) / MAX_TOPIC_AFFINITY,
          Math.min(preference.fastSkipStreak / 3, 1),
        );
      }));

  return 0.30 * normalizePercent(item.editorialImportance)
    + 0.20 * readerRelevance
    + 0.15 * freshness(item.card, now)
    + 0.15 * normalizePercent(item.practicalUtility)
    + 0.10 * sourceQuality(item.card)
    + 0.10 * novelty
    - 0.15 * fatigue;
}

function recommendationReason(
  item: EditionCard,
  selectedTopics: ReadonlySet<string>,
  profile: ReaderProfile,
  now: number,
): string {
  if (item.role === "anchor" || item.role === "another_lens" || item.role === "lift") {
    return item.recommendationReason;
  }

  const followedTopic = item.card.topics.find((topic) => selectedTopics.has(topic.slug));
  if (followedTopic) return `Because you follow ${followedTopic.title}`;

  const learnedTopic = strongestLearnedTopic(item.card.topics, profile, now);
  if (learnedTopic && learnedTopic.affinity >= 2) {
    return `More on ${learnedTopic.topic.title}, shaped by your reading`;
  }

  return item.recommendationReason;
}

function strongestLearnedTopic(
  topics: readonly TopicRef[],
  profile: ReaderProfile,
  now: number,
): { topic: TopicRef; affinity: number } | null {
  let strongest: { topic: TopicRef; affinity: number } | null = null;
  for (const topic of topics) {
    const preference = profile.topics[topic.slug];
    if (!preference) continue;
    const affinity = decayBehaviorWeight(preference.behaviorWeight, preference.updatedAt, now);
    if (!strongest || affinity > strongest.affinity) strongest = { topic, affinity };
  }
  return strongest;
}

function isPositionProtected(item: EditionCard, protectFirstThree: boolean): boolean {
  return item.isMandatory
    || item.distressLevel === "high"
    || (protectFirstThree && item.position < 3)
    || item.role === "anchor"
    || item.role === "another_lens"
    || item.role === "lift";
}

function freshness(card: Card, now: number): number {
  const publishedAt = Date.parse(card.publishedAt);
  if (!Number.isFinite(publishedAt)) return 0.5;
  const age = Math.max(0, now - publishedAt);
  const halfLife = card.cardType === "data" ? 365 * DAY_MS : 3 * DAY_MS;
  return Math.pow(0.5, age / halfLife);
}

function sourceQuality(card: Card): number {
  const trustTier = card.cardType === "data" ? card.surveySource.trustTier : card.source.trustTier;
  if (trustTier === "primary") return 1;
  if (trustTier === "discovery") return 0.4;
  return 0.8;
}

function normalizePercent(value: number): number {
  return clamp(value / 100, 0, 1);
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(Math.max(value, minimum), maximum);
}

function finiteNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
