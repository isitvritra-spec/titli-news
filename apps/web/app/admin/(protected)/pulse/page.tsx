import { listPulseMetricsForAdmin } from "../../../../lib/db/adminQueries";
import { PulseManager } from "../../../../components/admin/PulseManager";

export default async function PulsePage() {
  return <PulseManager metrics={await listPulseMetricsForAdmin()} />;
}
