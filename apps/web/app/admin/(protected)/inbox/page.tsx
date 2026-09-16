import { listTriageClusters } from "../../../../lib/db/clusterQueries";
import { getTopics } from "../../../../lib/db/queries";
import { TriageBoard } from "../../../../components/admin/TriageBoard";

export default async function InboxPage() {
  const [clusters, topics] = await Promise.all([listTriageClusters(), getTopics()]);

  return (
    <TriageBoard
      clusters={clusters}
      topics={topics.map((topic) => ({ slug: topic.slug, title: topic.title }))}
    />
  );
}
