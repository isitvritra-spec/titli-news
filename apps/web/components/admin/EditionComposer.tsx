"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { EDITION_ROLE_CONFIG, type EditionRole } from "@repo/api-client";

type DistressLevel = "low" | "medium" | "high";

type Slot = {
  cardId: string;
  role: EditionRole;
  recommendationReason: string;
  isMandatory: boolean;
  editorialImportance: number;
  practicalUtility: number;
  distressLevel: DistressLevel;
};

type CardOption = {
  id: string;
  headline: string;
  cardType: "news" | "data";
  primaryTopicId: string | null;
  sourceKey: string | null;
};

function toDatetimeLocal(iso: string) {
  const date = new Date(iso);
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function EditionComposer({
  date,
  status,
  version,
  scheduledFor,
  cards,
  initialSlots,
}: {
  date: string;
  status: "new" | "draft" | "scheduled" | "published" | "archived";
  version: number;
  scheduledFor: string;
  cards: CardOption[];
  initialSlots: Slot[];
}) {
  const router = useRouter();
  const [slots, setSlots] = useState(initialSlots);
  const [schedule, setSchedule] = useState(toDatetimeLocal(scheduledFor));
  const [busy, setBusy] = useState<"save" | "schedule" | "publish" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectedIds = slots.map((slot) => slot.cardId).filter(Boolean);
  const duplicates = selectedIds.filter((id, index) => selectedIds.indexOf(id) !== index);
  const highDistressPair = slots.some(
    (slot, index) => slot.distressLevel === "high" && slots[index + 1]?.distressLevel === "high"
  );
  const numberSlot = slots.find((slot) => slot.role === "number");
  const numberCard = cards.find((card) => card.id === numberSlot?.cardId);
  const selectedCards = slots.flatMap((slot) => {
    const card = cards.find((option) => option.id === slot.cardId);
    return card ? [card] : [];
  });
  const topicCount = new Set(selectedCards.map((card) => card.primaryTopicId).filter(Boolean)).size;
  const sourceCounts = selectedCards.reduce((counts, card) => {
    if (card.sourceKey) counts.set(card.sourceKey, (counts.get(card.sourceKey) ?? 0) + 1);
    return counts;
  }, new Map<string, number>());
  const sourceOverload = [...sourceCounts.values()].some((count) => count > 2);

  const warnings = [
    selectedIds.length !== 7 ? "Choose one published card for every role." : null,
    duplicates.length > 0 ? "A card can appear only once in an edition." : null,
    highDistressPair ? "Two high-distress cards are adjacent. Break the sequence with context or agency." : null,
    numberCard && numberCard.cardType !== "data" ? "The Number slot is strongest with a verified data card." : null,
    selectedIds.length === 7 && topicCount < 4 ? "Aim for at least four primary topics in the edition." : null,
    sourceOverload ? "One source appears more than twice." : null,
  ].filter((warning): warning is string => Boolean(warning));
  const blocking = selectedIds.length !== 7 || duplicates.length > 0;

  function updateSlot(index: number, patch: Partial<Slot>) {
    setSlots((current) => current.map((slot, slotIndex) => slotIndex === index ? { ...slot, ...patch } : slot));
  }

  async function save() {
    setError(null);
    setBusy("save");
    const response = await fetch(`/api/admin/editions/${date}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slots,
        scheduledFor: new Date(schedule).toISOString(),
      }),
    });
    setBusy(null);
    if (!response.ok) {
      const data = await response.json().catch(() => null);
      setError(data?.issues?.[0]?.message ?? data?.error ?? "Could not save the edition.");
      return false;
    }
    router.refresh();
    return true;
  }

  async function publish() {
    if (blocking) return;
    const saved = await save();
    if (!saved) return;
    setBusy("publish");
    const response = await fetch(`/api/admin/editions/${date}/publish`, { method: "POST" });
    setBusy(null);
    if (!response.ok) {
      const data = await response.json().catch(() => null);
      setError(data?.error ?? "Could not publish the edition.");
      return;
    }
    router.refresh();
  }

  async function scheduleEdition() {
    if (blocking) return;
    const saved = await save();
    if (!saved) return;
    setBusy("schedule");
    const response = await fetch(`/api/admin/editions/${date}/schedule`, { method: "POST" });
    setBusy(null);
    if (!response.ok) {
      const data = await response.json().catch(() => null);
      setError(data?.error ?? "Could not schedule the edition.");
      return;
    }
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-5xl pb-20">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-hairline pb-6">
        <div>
          <p className="mb-2 text-caption uppercase tracking-[0.16em] text-gold">Today in India</p>
          <h1 className="font-headline text-[34px] leading-none text-ink">Compose {date}</h1>
          <p className="mt-2 text-caption text-muted">Seven roles, one calm daily arc.</p>
        </div>
        <div className="text-right">
          <span className="rounded-full border border-hairline px-3 py-1 text-caption uppercase text-muted">
            {status} · v{version}
          </span>
        </div>
      </div>

      {cards.length < 7 ? (
        <div className="mb-6 rounded-lg border border-maroon bg-maroon/20 p-4 text-ink">
          At least seven published cards are required. There are currently {cards.length}.
        </div>
      ) : null}

      <div className="grid gap-4">
        {EDITION_ROLE_CONFIG.map((config, index) => {
          const slot = slots[index]!;
          return (
            <section key={config.role} className="grid gap-4 rounded-card border border-hairline bg-surface p-5 md:grid-cols-[150px_1fr_170px]">
              <div>
                <span className="text-caption text-gold">{String(index + 1).padStart(2, "0")}</span>
                <h2 className="mt-2 font-headline text-title text-ink">{config.label}</h2>
                <p className="mt-1 text-caption leading-relaxed text-muted">{config.defaultReason}</p>
              </div>

              <div className="grid gap-3">
                <select
                  value={slot.cardId}
                  onChange={(event) => updateSlot(index, { cardId: event.target.value })}
                  className="w-full rounded-md border border-hairline bg-bg px-3 py-2 text-ink"
                >
                  <option value="">Choose a published card...</option>
                  {cards.map((card) => (
                    <option key={card.id} value={card.id} disabled={selectedIds.includes(card.id) && slot.cardId !== card.id}>
                      {card.cardType === "data" ? "DATA · " : ""}{card.headline}
                    </option>
                  ))}
                </select>
                <input
                  value={slot.recommendationReason}
                  onChange={(event) => updateSlot(index, { recommendationReason: event.target.value })}
                  maxLength={160}
                  className="w-full rounded-md border border-hairline bg-transparent px-3 py-2 text-caption text-ink"
                  aria-label={`${config.label} recommendation reason`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3 text-caption">
                <label className="text-muted">
                  Importance
                  <input type="number" min={0} max={100} value={slot.editorialImportance} onChange={(event) => updateSlot(index, { editorialImportance: Number(event.target.value) })} className="mt-1 w-full rounded-md border border-hairline bg-bg px-2 py-1 text-ink" />
                </label>
                <label className="text-muted">
                  Utility
                  <input type="number" min={0} max={100} value={slot.practicalUtility} onChange={(event) => updateSlot(index, { practicalUtility: Number(event.target.value) })} className="mt-1 w-full rounded-md border border-hairline bg-bg px-2 py-1 text-ink" />
                </label>
                <label className="col-span-2 text-muted">
                  Emotional weight
                  <select value={slot.distressLevel} onChange={(event) => updateSlot(index, { distressLevel: event.target.value as DistressLevel })} className="mt-1 w-full rounded-md border border-hairline bg-bg px-2 py-1 text-ink">
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </label>
              </div>
            </section>
          );
        })}
      </div>

      <div className="mt-6 grid gap-5 rounded-card border border-hairline bg-surface2 p-5 md:grid-cols-[1fr_260px]">
        <div>
          <h2 className="font-headline text-title text-ink">Balance check</h2>
          {warnings.length === 0 ? (
            <p className="mt-2 text-body text-gold">The edition is balanced and ready for editorial sign-off.</p>
          ) : (
            <ul className="mt-3 grid gap-2 text-caption text-muted">
              {warnings.map((warning) => <li key={warning}>→ {warning}</li>)}
            </ul>
          )}
        </div>
        <label className="text-caption text-muted">
          Target publication
          <input type="datetime-local" value={schedule} onChange={(event) => setSchedule(event.target.value)} className="mt-2 w-full rounded-md border border-hairline bg-bg px-3 py-2 text-ink" />
        </label>
      </div>

      {error ? <p className="mt-4 text-caption text-red">{error}</p> : null}

      <div className="mt-6 flex flex-wrap gap-3">
        <button type="button" onClick={save} disabled={Boolean(busy) || blocking} className="rounded-full border border-gold px-5 py-2 font-headline text-label text-gold disabled:opacity-40">
          {busy === "save" ? "Saving..." : "Save draft"}
        </button>
        <button type="button" onClick={scheduleEdition} disabled={Boolean(busy) || blocking} className="rounded-full border border-jade px-5 py-2 font-headline text-label text-jade disabled:opacity-40">
          {busy === "schedule" ? "Scheduling..." : "Approve for 07:00 IST"}
        </button>
        <button type="button" onClick={publish} disabled={Boolean(busy) || blocking} className="rounded-full bg-gold px-5 py-2 font-headline text-label text-bg disabled:opacity-40">
          {busy === "publish" ? "Publishing..." : status === "published" ? "Publish update" : "Publish today's edition"}
        </button>
      </div>
    </div>
  );
}
