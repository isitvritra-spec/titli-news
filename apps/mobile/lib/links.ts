const publicSiteUrl = (
  process.env.EXPO_PUBLIC_SITE_URL ||
  process.env.EXPO_PUBLIC_API_URL ||
  ""
).replace(/\/$/, "");

export function cardShareUrl(slug: string) {
  return `${publicSiteUrl}/card/${encodeURIComponent(slug)}`;
}
