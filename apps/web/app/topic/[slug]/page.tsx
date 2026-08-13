import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getFeed, getTopicBySlug, getTopics } from "../../../lib/db/queries";
import { FeedScroll } from "../../../components/FeedScroll";
import { FeedHeader } from "../../../components/FeedHeader";

export const revalidate = 3600;

export async function generateStaticParams() {
  const topics = await getTopics();
  return topics.map((topic) => ({ slug: topic.slug }));
}

export async function generateMetadata(props: PageProps<"/topic/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const topic = await getTopicBySlug(slug);
  if (!topic) return {};
  return {
    title: topic.title,
    description: topic.shortDescription,
  };
}

export default async function TopicPage(props: PageProps<"/topic/[slug]">) {
  const { slug } = await props.params;
  const topic = await getTopicBySlug(slug);
  if (!topic) notFound();

  const cards = await getFeed({ topicSlugs: [slug] });

  return (
    <main className="relative">
      <FeedHeader title={topic.title} />
      {cards.length === 0 ? (
        <div className="flex min-h-dvh flex-col items-center justify-center gap-3 px-6 text-center">
          <p className="font-headline text-2xl text-ink">No cards on {topic.title} yet.</p>
        </div>
      ) : (
        <FeedScroll cards={cards} />
      )}
    </main>
  );
}
