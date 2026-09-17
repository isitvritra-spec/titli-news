import Link from "next/link";

const TOOLS: { href: string; label: string; note: string }[] = [
  { href: "/admin/inbox", label: "Story triage", note: "The full clustered inbox with scores and filters" },
  { href: "/admin/editions", label: "Edition composer", note: "Hand-arrange the seven cards for a day" },
  { href: "/admin/library", label: "Card library", note: "Every card, searchable and filterable" },
  { href: "/admin/sources", label: "Sources & policy", note: "Add sources, set image/text licence policy" },
  { href: "/admin/topics", label: "Topics", note: "Manage the topic list" },
  { href: "/admin/pulse", label: "Pulse metrics", note: "The women's data numbers shown to readers" },
  { href: "/admin/analytics", label: "Analytics", note: "Detailed reader analytics" },
  { href: "/admin/activity", label: "Activity log", note: "Audit trail of publishes and dismissals" },
];

export default function ToolsPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-headline text-title text-ink mb-1">Tools</h1>
      <p className="mb-6 text-caption text-muted">
        Advanced controls for the team. Day-to-day moderation lives on <Link href="/admin/today" className="text-gold">Today</Link> —
        you don&apos;t need anything here for the morning publish.
      </p>
      <ul className="grid gap-2">
        {TOOLS.map((tool) => (
          <li key={tool.href}>
            <Link
              href={tool.href}
              className="block rounded-card border border-hairline bg-surface p-4 hover:border-gold"
            >
              <span className="font-headline font-medium text-label text-ink">{tool.label}</span>
              <span className="mt-0.5 block text-caption text-muted">{tool.note}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
