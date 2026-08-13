/** Card footer date, e.g. "12 Aug 2026". */
export function formatCardDate(isoDate: string): string {
  const date = new Date(isoDate);
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** Data-card provenance line, e.g. "as of 2021 · NFHS-5". */
export function formatAsOf(year: number, surveyName: string): string {
  return `as of ${year} · ${surveyName}`;
}
