export type ImageAsset = {
  /** Absolute or root-relative URL — mobile needs it absolute (see @repo/api-client's httpClient baseUrl handling); web can use it as-is via next/image. */
  url: string;
  alt: string;
  width: number;
  height: number;
  /** A small base64 data URI, generated at upload time, for blur-up placeholders. */
  blurDataURL: string;
  /** Shown beside the image when the licence requires attribution. Absent for our own and generated art. */
  credit?: string;
};

export type TopicRef = {
  title: string;
  slug: string;
};

export type SourceRef = {
  name: string;
  url: string;
  publisher?: string;
  trustTier?: "primary" | "trusted" | "discovery";
};

export type Reading = {
  year: number;
  value: number;
};

export type StateReading = {
  state: string;
  value: number;
  year?: number;
};

type CardBase = {
  id: string;
  headline: string;
  slug: string;
  body: string;
  image: ImageAsset;
  topics: TopicRef[];
  /** Exactly one canonical genre for analytics and future recommendations. */
  primaryGenre?: TopicRef;
  publishedAt: string;
  isContested?: boolean;
  contestedNote?: string;
  correctionNote?: string;
  correctedAt?: string;
};

export type NewsCard = CardBase & {
  cardType: "news";
  source: SourceRef;
  sourceDate: string;
};

export type DataCard = CardBase & {
  cardType: "data";
  metric?: { value: number; unit: string };
  readings: Reading[];
  surveySource: SourceRef;
};

/** Discriminated on `cardType` — narrow on it before reading news/data-only fields. */
export type Card = NewsCard | DataCard;

export type CardDetail = Card & {
  /** Plain text, one paragraph per blank-line-separated block — no rich-text editor in the self-hosted admin. */
  deepDiveBody?: string;
  stateBreakdown?: StateReading[];
  methodologyNote?: string;
};

export type Topic = {
  id: string;
  title: string;
  slug: string;
  shortDescription?: string;
  sortOrder: number;
};

export type PulseMetric = {
  key: string;
  kind: "safety" | "progress";
  label: string;
  value: number;
  unit: string;
  periodLabel: string;
  sourceName: string;
  sourceUrl: string;
  methodology: string;
  updatedAt: string;
};

export type HotStory = {
  card: Card;
  reason: "Most read" | "Most opened" | "Sources checked" | "Fresh from Titli";
  averageDwellSeconds: number;
  readerCount: number;
};

export type EditionRole =
  | "anchor"
  | "for_you"
  | "number"
  | "useful_now"
  | "beyond_metro"
  | "another_lens"
  | "lift";

export const EDITION_ROLE_CONFIG: ReadonlyArray<{
  role: EditionRole;
  label: string;
  defaultReason: string;
  mandatory: boolean;
}> = [
  {
    role: "anchor",
    label: "The Anchor",
    defaultReason: "In today's essential seven",
    mandatory: true,
  },
  {
    role: "for_you",
    label: "For You",
    defaultReason: "Selected for the interests you follow",
    mandatory: false,
  },
  {
    role: "number",
    label: "The Number",
    defaultReason: "A verified number that adds context",
    mandatory: false,
  },
  {
    role: "useful_now",
    label: "Useful Now",
    defaultReason: "Something practical for today",
    mandatory: false,
  },
  {
    role: "beyond_metro",
    label: "Beyond the Metro",
    defaultReason: "A grounded story beyond metro headlines",
    mandatory: false,
  },
  {
    role: "another_lens",
    label: "Another Lens",
    defaultReason: "A different lens for balance",
    mandatory: false,
  },
  {
    role: "lift",
    label: "The Lift",
    defaultReason: "Ending today's edition with agency",
    mandatory: false,
  },
];

export type EditionCard = {
  card: Card;
  position: number;
  role: EditionRole;
  recommendationReason: string;
  isMandatory: boolean;
  editorialImportance: number;
  practicalUtility: number;
  distressLevel: "low" | "medium" | "high";
};

export type TodayEdition = {
  id: string;
  editionDate: string;
  timezone: string;
  version: number;
  publishedAt: string;
  cards: EditionCard[];
};

export type AnalyticsEventType =
  | "app_open"
  | "edition_start"
  | "edition_complete"
  | "card_view"
  | "card_dwell"
  | "card_detail_open"
  | "card_save"
  | "card_unsave"
  | "card_share"
  | "source_open"
  | "genre_follow"
  | "genre_unfollow"
  | "pulse_open"
  | "why_this_open"
  | "less_like_this";

export type AnalyticsEventInput = {
  installationId: string;
  sessionId: string;
  eventType: AnalyticsEventType;
  editionId?: string;
  cardId?: string;
  topicSlug?: string;
  durationMs?: number;
  position?: number;
  occurredAt: string;
};

export function isDataCard(card: Card): card is DataCard {
  return card.cardType === "data";
}

export function isNewsCard(card: Card): card is NewsCard {
  return card.cardType === "news";
}
