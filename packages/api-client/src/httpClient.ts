import type { Card, CardDetail, Topic } from "./types";

/**
 * The one HTTP client, used by apps/mobile (talking to apps/web's API
 * routes over the network) and by apps/web's own admin UI client
 * components (talking to the same API routes, same-origin). apps/web's
 * Server Components skip this entirely and call lib/db/queries.ts
 * directly — no reason for the web app to round-trip through its own HTTP
 * API during server-side rendering.
 */
export function createApiClient(baseUrl: string) {
  const base = baseUrl.replace(/\/$/, "");

  async function request<T>(path: string, options?: { notFoundAsNull?: boolean }): Promise<T> {
    const res = await fetch(`${base}${path}`);
    if (res.status === 404 && options?.notFoundAsNull) {
      return null as T;
    }
    if (!res.ok) {
      throw new Error(`API request failed (${res.status}): ${path}`);
    }
    return (await res.json()) as T;
  }

  return {
    getFeed(options?: { topicSlugs?: string[] }): Promise<Card[]> {
      const qs = options?.topicSlugs?.length
        ? `?topics=${options.topicSlugs.map(encodeURIComponent).join(",")}`
        : "";
      return request<Card[]>(`/api/feed${qs}`);
    },
    getCardBySlug(slug: string): Promise<CardDetail | null> {
      return request<CardDetail | null>(`/api/cards/${encodeURIComponent(slug)}`, {
        notFoundAsNull: true,
      });
    },
    getTopics(): Promise<Topic[]> {
      return request<Topic[]>(`/api/topics`);
    },
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;
