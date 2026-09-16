import { formatCardDate } from "@repo/utils";
import { listAdminActions } from "../../../../lib/db/auditQueries";

export const dynamic = "force-dynamic";

const LABEL: Record<string, string> = {
  card_draft: "Drafted card",
  card_publish: "Published card",
  card_update: "Updated card",
  cluster_dismiss: "Dismissed cluster",
  edition_publish: "Published edition",
};

export default async function ActivityPage() {
  const actions = await listAdminActions();

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-headline text-title text-ink mb-1">Activity</h1>
      <p className="mb-6 text-caption text-muted">
        An append-only log of consequential editor actions. Attributed to the single editor today;
        the record is here so real accounts can be added later without losing history.
      </p>

      {actions.length === 0 ? (
        <p className="text-muted">No activity yet.</p>
      ) : (
        <ul>
          {actions.map((action) => (
            <li key={action.id} className="flex items-baseline justify-between gap-4 border-b border-hairline py-3">
              <div>
                <span className="text-ink">{LABEL[action.action] ?? action.action}</span>
                {action.detail ? (
                  <span className="block text-caption text-muted">{action.detail}</span>
                ) : null}
              </div>
              <span className="shrink-0 text-caption text-muted">
                {action.actor} · {formatCardDate(action.createdAt)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
