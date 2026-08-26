import { getAllSources } from "../../../../lib/db/queries";
import { SourceManager } from "../../../../components/admin/SourceManager";

export default async function SourcesPage() {
  return <SourceManager sources={await getAllSources()} />;
}
