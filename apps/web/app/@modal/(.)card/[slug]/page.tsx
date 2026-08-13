import { notFound } from "next/navigation";
import { getCardBySlug } from "../../../../lib/db/queries";
import { CardDetailContent } from "../../../../components/CardDetailContent";
import { CardModalShell } from "../../../../components/CardModalShell";

export default async function CardModalPage(props: PageProps<"/card/[slug]">) {
  const { slug } = await props.params;
  const card = await getCardBySlug(slug);
  if (!card) notFound();

  return (
    <CardModalShell>
      <CardDetailContent card={card} />
    </CardModalShell>
  );
}
