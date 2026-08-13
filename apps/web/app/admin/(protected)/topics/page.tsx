import { getTopics } from "../../../../lib/db/queries";
import { TopicManager } from "../../../../components/admin/TopicManager";

export default async function AdminTopicsPage() {
  const topics = await getTopics();
  return <TopicManager topics={topics} />;
}
