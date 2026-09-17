import { getModerationQueue, getTodayChosen, todayEditionProgress } from "../../../../lib/db/moderationQueries";
import { getTopics } from "../../../../lib/db/queries";
import { isGeminiConfigured } from "../../../../lib/ai/draft";
import { TodayModeration } from "../../../../components/admin/TodayModeration";

export const dynamic = "force-dynamic";

export default async function TodayPage() {
  const [stories, chosen, progress, topics] = await Promise.all([
    getModerationQueue(),
    getTodayChosen(),
    todayEditionProgress(),
    getTopics(),
  ]);

  const topicLabels = Object.fromEntries(topics.map((topic) => [topic.slug, topic.title]));

  return (
    <TodayModeration
      stories={stories}
      chosen={chosen.map((c) => ({ cardId: c.cardId, headline: c.headline, imagePath: c.imagePath, position: c.position }))}
      target={progress.target}
      editionDate={progress.editionDate}
      aiEnabled={isGeminiConfigured()}
      topicLabels={topicLabels}
    />
  );
}
