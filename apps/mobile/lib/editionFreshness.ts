const EDITION_TIMEZONE = "Asia/Kolkata";

export function dateInIndia(now = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: EDITION_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export function editionDateLabel(value?: string, now = new Date()): string {
  if (!value) return "Your daily edition";

  const date = new Date(`${value}T12:00:00+05:30`);
  const formatted = new Intl.DateTimeFormat("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: EDITION_TIMEZONE,
  }).format(date);

  return value === dateInIndia(now) ? formatted : `Latest edition · ${formatted}`;
}
