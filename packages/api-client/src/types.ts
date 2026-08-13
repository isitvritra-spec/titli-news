export type ImageAsset = {
  /** Absolute or root-relative URL — mobile needs it absolute (see @repo/api-client's httpClient baseUrl handling); web can use it as-is via next/image. */
  url: string;
  alt: string;
  width: number;
  height: number;
  /** A small base64 data URI, generated at upload time, for blur-up placeholders. */
  blurDataURL: string;
};

export type TopicRef = {
  title: string;
  slug: string;
};

export type SourceRef = {
  name: string;
  url: string;
  publisher?: string;
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
  publishedAt: string;
  isContested?: boolean;
  contestedNote?: string;
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

export function isDataCard(card: Card): card is DataCard {
  return card.cardType === "data";
}

export function isNewsCard(card: Card): card is NewsCard {
  return card.cardType === "news";
}
