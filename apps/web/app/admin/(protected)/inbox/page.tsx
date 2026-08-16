import { listInboxCandidates } from "../../../../lib/db/inboxQueries";
import { InboxList } from "../../../../components/admin/InboxList";

export default async function InboxPage() {
  const candidates = await listInboxCandidates();

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-headline text-title text-ink mb-1">Inbox</h1>
      <p className="text-caption text-muted mb-6">
        Real articles from the sources named in the brief — review each one and write a fresh
        60-word card. Nothing here reaches readers until you do.
      </p>
      <InboxList
        candidates={candidates.map((c) => ({
          id: c.id,
          sourceName: c.sourceName,
          title: c.title,
          link: c.link,
          imageUrl: c.imageUrl,
          pubDate: c.pubDate,
        }))}
      />
    </div>
  );
}
