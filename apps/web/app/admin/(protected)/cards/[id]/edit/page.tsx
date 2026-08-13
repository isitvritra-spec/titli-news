import { notFound } from "next/navigation";
import { getAllSources, getTopics } from "../../../../../../lib/db/queries";
import { getCardForEdit } from "../../../../../../lib/db/adminQueries";
import { CardForm } from "../../../../../../components/admin/CardForm";

export default async function EditCardPage(props: PageProps<"/admin/cards/[id]/edit">) {
  const { id } = await props.params;
  const [card, topics, sources] = await Promise.all([getCardForEdit(id), getTopics(), getAllSources()]);

  if (!card) notFound();

  return (
    <CardForm
      mode="edit"
      cardId={card.id}
      topics={topics.map((t) => ({ id: t.id, title: t.title }))}
      sources={sources.map((s) => ({ id: s.id, name: s.name, kind: s.kind }))}
      initialData={card}
    />
  );
}
