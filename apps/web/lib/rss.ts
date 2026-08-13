import Parser from "rss-parser";

/**
 * These are the news sources named in the product brief's own "News pipe"
 * section — an editor reading them in an RSS reader was always the
 * intended source list; this just pulls the same feeds into the admin
 * instead of a separate app. Deliberately NOT a NewsAPI/GNews-style paid
 * service: RSS needs no account or API key, matching every other
 * self-hosted choice in this stack.
 *
 * IMPORTANT: this only ever produces *candidates* for an editor to review
 * in /admin/inbox — never a published card directly. The brief's one
 * non-negotiable still applies here: a human writes the card's 60-word
 * body fresh. See app/api/admin/inbox/[id]/draft/route.ts, which
 * deliberately leaves body empty when pre-filling a new card from a
 * candidate.
 *
 * Feed URLs verified working at the time this was written; RSS feeds do
 * occasionally move (IndiaSpend rebranded to "ISignal" and moved its feed
 * in 2026 — the URL below already reflects that). fetchOneSource() tries
 * each source's fallback (if any) and never lets one broken feed stop the
 * others from loading.
 */
export type FeedSource = {
  name: string;
  siteUrl: string;
  feedUrl: string;
  fallbackFeedUrl?: string;
};

export const SOURCES: FeedSource[] = [
  {
    name: "Feminism in India",
    siteUrl: "https://feminisminindia.com",
    feedUrl: "https://feminisminindia.com/feed/",
  },
  {
    name: "Scroll.in",
    siteUrl: "https://scroll.in",
    // scroll.in/feed is bot-blocked for server-side fetches; this FeedBurner mirror is the real working feed.
    feedUrl: "https://feeds.feedburner.com/ScrollinArticles.rss",
  },
  {
    name: "IndiaSpend (ISignal)",
    siteUrl: "https://www.isignal.in",
    feedUrl: "https://www.isignal.in/feeds.xml",
  },
  {
    name: "Behanbox",
    siteUrl: "https://behanbox.com",
    feedUrl: "https://behanbox.com/feed/",
  },
  {
    name: "PIB",
    siteUrl: "https://pib.gov.in",
    feedUrl: "https://www.pib.gov.in/ViewRss.aspx?reg=1&lang=1",
    fallbackFeedUrl: "https://archive.pib.gov.in/newsite/rssenglish.aspx",
  },
  {
    name: "The Hindu",
    siteUrl: "https://www.thehindu.com",
    // No dedicated gender/women feed exists — Society is the closest section.
    feedUrl: "https://www.thehindu.com/society/feeder/default.rss",
  },
];

const GOOGLE_NEWS_QUERY = "women India";
const GOOGLE_NEWS_URL = `https://news.google.com/rss/search?q=${encodeURIComponent(GOOGLE_NEWS_QUERY)}&hl=en-IN&gl=IN&ceid=IN:en`;

export type FeedCandidateInput = {
  sourceName: string;
  sourceSiteUrl: string;
  title: string;
  link: string;
  imageUrl: string | null;
  pubDate: string | null;
};

type RawItem = Parser.Item & {
  "content:encoded"?: string;
  mediaThumbnail?: { $?: { url?: string } };
  mediaContent?: { $?: { url?: string } } | { $?: { url?: string } }[];
};

const parser = new Parser<Record<string, unknown>, RawItem>({
  timeout: 10_000,
  // A bot-identifying UA gets a hard 403 from at least one source's WAF
  // (confirmed against ISignal/IndiaSpend) — a plain browser UA is what
  // actually works reliably across all of these sources.
  headers: {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  },
  customFields: {
    item: [
      ["media:content", "mediaContent", { keepArray: true }],
      ["media:thumbnail", "mediaThumbnail"],
      ["content:encoded", "content:encoded"],
    ],
  },
});

/** Best-effort image extraction — most of these sources use plain <enclosure>; a couple need fallbacks. */
function extractImage(item: RawItem): string | null {
  if (item.enclosure?.url) return item.enclosure.url;

  const thumbnailUrl = item.mediaThumbnail?.$?.url;
  if (thumbnailUrl) return thumbnailUrl;

  const mediaContent = Array.isArray(item.mediaContent) ? item.mediaContent[0] : item.mediaContent;
  if (mediaContent?.$?.url) return mediaContent.$.url;

  // Behanbox-style: an <img> embedded in the HTML content, not a clean media field.
  const html = item["content:encoded"] ?? item.content ?? "";
  const match = /<img[^>]+src="([^"]+)"/i.exec(html);
  return match ? match[1] : null;
}

function toCandidate(item: RawItem, source: { name: string; siteUrl: string }): FeedCandidateInput | null {
  if (!item.title || !item.link) return null;
  return {
    sourceName: source.name,
    sourceSiteUrl: source.siteUrl,
    title: item.title.trim(),
    link: item.link,
    imageUrl: extractImage(item),
    pubDate: item.isoDate ?? item.pubDate ?? null,
  };
}

/** Never throws — a broken/moved feed just contributes zero items instead of failing the whole batch. */
async function fetchOneSource(source: FeedSource): Promise<FeedCandidateInput[]> {
  const urls = [source.feedUrl, source.fallbackFeedUrl].filter((u): u is string => Boolean(u));

  for (const url of urls) {
    try {
      const feed = await parser.parseURL(url);
      const items = (feed.items ?? [])
        .map((item) => toCandidate(item, source))
        .filter((c): c is FeedCandidateInput => c !== null);
      if (items.length > 0) return items;
    } catch {
      // try the fallback URL, if any; otherwise fall through to an empty result below
    }
  }
  return [];
}

async function fetchGoogleNews(): Promise<FeedCandidateInput[]> {
  try {
    const feed = await parser.parseURL(GOOGLE_NEWS_URL);
    return (feed.items ?? [])
      .map((item) => toCandidate(item, { name: "Google News", siteUrl: "https://news.google.com" }))
      .filter((c): c is FeedCandidateInput => c !== null);
  } catch {
    return [];
  }
}

export async function fetchAllCandidates(): Promise<FeedCandidateInput[]> {
  const results = await Promise.all([...SOURCES.map(fetchOneSource), fetchGoogleNews()]);
  return results.flat();
}
