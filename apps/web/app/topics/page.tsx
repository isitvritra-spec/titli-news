import Link from "next/link";
import { getTopics } from "../../lib/db/queries";
import { BrandMark } from "../../components/BrandMark";

export const revalidate = 3600;

export default async function TopicsPage() {
  const topics = await getTopics();

  return (
    <main className="min-h-dvh px-6 py-10 md:mx-auto md:max-w-xl">
      <Link href="/" className="inline-flex">
        <BrandMark />
      </Link>
      <h1 className="font-headline text-3xl text-ink mt-4 mb-1">Topics</h1>
      <p className="text-sm text-muted mb-8">Follow what you care about.</p>

      <ul className="flex flex-col">
        {topics.map((topic) => (
          <li key={topic.id} className="border-b border-hairline py-4">
            <Link href={`/topic/${topic.slug}`} className="block">
              <span className="text-base text-ink">{topic.title}</span>
              {topic.shortDescription ? (
                <span className="block text-xs text-muted mt-0.5">{topic.shortDescription}</span>
              ) : null}
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
