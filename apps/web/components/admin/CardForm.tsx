"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { countWords, WORD_COUNT_TARGET } from "@repo/utils";

export type SourceOption = { id: string; name: string; kind: "news" | "data" };
export type TopicOption = { id: string; title: string };

export type CardFormInitialData = {
  cardType: "news" | "data";
  headline: string;
  slug: string;
  body: string;
  imagePath: string;
  imageAlt: string;
  imageWidth: number;
  imageHeight: number;
  imageBlurDataUrl: string;
  publishedAt: string;
  isContested: boolean;
  contestedNote: string | null;
  deepDiveBody: string | null;
  topicIds: string[];
  sourceId: string | null;
  sourceDate: string | null;
  metricValue: number | null;
  metricUnit: string | null;
  surveySourceId: string | null;
  methodologyNote: string | null;
  readings: { year: number; value: number }[];
  stateBreakdown: { state: string; value: number; year?: number }[];
};

function toDatetimeLocal(iso: string): string {
  const d = iso ? new Date(iso) : new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function CardForm({
  mode,
  cardId,
  topics,
  sources,
  initialData,
  fromCandidateId,
}: {
  mode: "create" | "edit";
  cardId?: string;
  topics: TopicOption[];
  sources: SourceOption[];
  /**
   * Full data in edit mode. In create mode this can also be a *partial*
   * prefill (headline/source/image) from an RSS inbox candidate — body is
   * deliberately never prefilled from there, see app/api/admin/inbox/[id]/draft.
   */
  initialData?: Partial<CardFormInitialData>;
  /** The inbox candidate this draft started from, if any — threaded through to the create request so the candidate can be marked as used and drop out of /admin/inbox. */
  fromCandidateId?: string;
}) {
  const router = useRouter();
  const [sourceList, setSourceList] = useState(sources);

  const [cardType, setCardType] = useState<"news" | "data">(initialData?.cardType ?? "news");
  const [headline, setHeadline] = useState(initialData?.headline ?? "");
  const [slug, setSlug] = useState(initialData?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(mode === "edit");
  const [body, setBody] = useState(initialData?.body ?? "");
  const [imagePath, setImagePath] = useState(initialData?.imagePath ?? "");
  const [imageAlt, setImageAlt] = useState(initialData?.imageAlt ?? "");
  const [imageWidth, setImageWidth] = useState(initialData?.imageWidth ?? 0);
  const [imageHeight, setImageHeight] = useState(initialData?.imageHeight ?? 0);
  const [imageBlurDataUrl, setImageBlurDataUrl] = useState(initialData?.imageBlurDataUrl ?? "");
  const [uploading, setUploading] = useState(false);
  const [publishedAt, setPublishedAt] = useState(toDatetimeLocal(initialData?.publishedAt ?? ""));
  const [isContested, setIsContested] = useState(initialData?.isContested ?? false);
  const [contestedNote, setContestedNote] = useState(initialData?.contestedNote ?? "");
  const [deepDiveBody, setDeepDiveBody] = useState(initialData?.deepDiveBody ?? "");
  const [topicIds, setTopicIds] = useState<string[]>(initialData?.topicIds ?? []);

  const [sourceId, setSourceId] = useState(initialData?.sourceId ?? "");
  const [sourceDate, setSourceDate] = useState(initialData?.sourceDate ?? "");

  const [metricValue, setMetricValue] = useState(initialData?.metricValue?.toString() ?? "");
  const [metricUnit, setMetricUnit] = useState(initialData?.metricUnit ?? "");
  const [surveySourceId, setSurveySourceId] = useState(initialData?.surveySourceId ?? "");
  const [methodologyNote, setMethodologyNote] = useState(initialData?.methodologyNote ?? "");
  const [readings, setReadings] = useState(
    (initialData?.readings ?? [{ year: new Date().getFullYear(), value: 0 }]).map((r) => ({
      year: String(r.year),
      value: String(r.value),
    }))
  );
  const [stateBreakdown, setStateBreakdown] = useState(
    (initialData?.stateBreakdown ?? []).map((s) => ({
      state: s.state,
      value: String(s.value),
      year: s.year ? String(s.year) : "",
    }))
  );

  const [newSourceOpen, setNewSourceOpen] = useState(false);
  const [newSourceName, setNewSourceName] = useState("");
  const [newSourceUrl, setNewSourceUrl] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const wordCount = countWords(body);

  function onHeadlineChange(value: string) {
    setHeadline(value);
    if (!slugTouched) {
      setSlug(
        value
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9\s-]/g, "")
          .replace(/\s+/g, "-")
          .slice(0, 96)
      );
    }
  }

  async function onImageChange(file: File | null) {
    if (!file) return;
    setUploading(true);
    setError(null);
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/admin/upload", { method: "POST", body: formData });
    setUploading(false);
    if (!res.ok) {
      setError("Image upload failed.");
      return;
    }
    const saved = await res.json();
    setImagePath(saved.path);
    setImageWidth(saved.width);
    setImageHeight(saved.height);
    setImageBlurDataUrl(saved.blurDataURL);
  }

  async function onCreateSource() {
    if (!newSourceName.trim() || !newSourceUrl.trim()) return;
    const res = await fetch("/api/admin/sources", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newSourceName, kind: cardType, url: newSourceUrl }),
    });
    if (!res.ok) return;
    const { id } = await res.json();
    const created = { id, name: newSourceName, kind: cardType };
    setSourceList((prev) => [...prev, created]);
    if (cardType === "news") setSourceId(id);
    else setSurveySourceId(id);
    setNewSourceOpen(false);
    setNewSourceName("");
    setNewSourceUrl("");
  }

  function toggleTopic(id: string) {
    setTopicIds((prev) => (prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]));
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    const payload = {
      cardType,
      headline,
      slug,
      body,
      imagePath,
      imageAlt,
      imageWidth,
      imageHeight,
      imageBlurDataUrl,
      publishedAt: new Date(publishedAt).toISOString(),
      isContested,
      contestedNote: isContested ? contestedNote : undefined,
      deepDiveBody: deepDiveBody || undefined,
      topicIds,
      sourceId: cardType === "news" ? sourceId : undefined,
      sourceDate: cardType === "news" ? sourceDate : undefined,
      metricValue: cardType === "data" && metricValue ? Number(metricValue) : undefined,
      metricUnit: cardType === "data" ? metricUnit || undefined : undefined,
      surveySourceId: cardType === "data" ? surveySourceId : undefined,
      methodologyNote: cardType === "data" ? methodologyNote || undefined : undefined,
      readings:
        cardType === "data"
          ? readings
              .filter((r) => r.year && r.value)
              .map((r) => ({ year: Number(r.year), value: Number(r.value) }))
          : undefined,
      stateBreakdown:
        cardType === "data"
          ? stateBreakdown
              .filter((s) => s.state && s.value)
              .map((s) => ({ state: s.state, value: Number(s.value), year: s.year ? Number(s.year) : undefined }))
          : undefined,
    };

    const createUrl = fromCandidateId
      ? `/api/admin/cards?fromCandidate=${encodeURIComponent(fromCandidateId)}`
      : "/api/admin/cards";

    setSubmitting(true);
    const res = await fetch(mode === "create" ? createUrl : `/api/admin/cards/${cardId}`, {
      method: mode === "create" ? "POST" : "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setSubmitting(false);

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.issues?.[0]?.message || data?.error || "Something went wrong.");
      return;
    }

    router.push("/admin");
    router.refresh();
  }

  const filteredSources = sourceList.filter((s) => s.kind === cardType);

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-2xl pb-20">
      <h1 className="font-headline text-title text-ink mb-6">
        {mode === "create" ? "New card" : "Edit card"}
      </h1>

      <Field label="Card type">
        <div className="flex gap-4">
          {(["news", "data"] as const).map((t) => (
            <label key={t} className="flex items-center gap-2 text-ink">
              <input type="radio" checked={cardType === t} onChange={() => setCardType(t)} />
              {t === "news" ? "News" : "Data"}
            </label>
          ))}
        </div>
      </Field>

      <Field label="Headline">
        <TextInput value={headline} onChange={onHeadlineChange} />
      </Field>

      <Field label="Slug">
        <TextInput
          value={slug}
          onChange={(v) => {
            setSlugTouched(true);
            setSlug(v);
          }}
        />
      </Field>

      <Field label={`Body (${wordCount} / ${WORD_COUNT_TARGET} words)`}>
        <TextArea value={body} onChange={setBody} rows={4} />
      </Field>

      <Field label="Image">
        <input
          type="file"
          accept="image/*"
          onChange={(e) => onImageChange(e.target.files?.[0] ?? null)}
        />
        {uploading ? <p className="text-caption text-muted mt-1">Uploading…</p> : null}
        {imagePath ? (
          <div className="relative mt-2 h-40 w-full overflow-hidden rounded-md">
            <Image src={imagePath} alt={imageAlt || "preview"} fill className="object-cover" />
          </div>
        ) : null}
      </Field>

      <Field label="Image alt text">
        <TextInput value={imageAlt} onChange={setImageAlt} />
      </Field>

      <Field label="Topics">
        <div className="flex flex-wrap gap-2">
          {topics.map((topic) => (
            <label
              key={topic.id}
              className={`rounded-full border px-3 py-1 font-headline font-medium text-label cursor-pointer ${
                topicIds.includes(topic.id) ? "border-gold text-gold" : "border-hairline text-muted"
              }`}
            >
              <input
                type="checkbox"
                className="hidden"
                checked={topicIds.includes(topic.id)}
                onChange={() => toggleTopic(topic.id)}
              />
              {topic.title}
            </label>
          ))}
        </div>
      </Field>

      <Field label="Published at">
        <input
          type="datetime-local"
          value={publishedAt}
          onChange={(e) => setPublishedAt(e.target.value)}
          className={inputClass}
        />
      </Field>

      <Field label="Contested">
        <label className="flex items-center gap-2 text-ink">
          <input type="checkbox" checked={isContested} onChange={(e) => setIsContested(e.target.checked)} />
          Accounts differ on this — flag it
        </label>
        {isContested ? (
          <TextArea
            value={contestedNote}
            onChange={setContestedNote}
            rows={2}
            placeholder="State what happened, flag that there's a fight — never settle it."
          />
        ) : null}
      </Field>

      <Field label="Deep-dive (optional)">
        <TextArea
          value={deepDiveBody}
          onChange={setDeepDiveBody}
          rows={6}
          placeholder="Leave empty to fall back to a 'read the full story' link."
        />
      </Field>

      {cardType === "news" ? (
        <>
          <Field label="Source">
            <SourceSelect
              value={sourceId}
              onChange={setSourceId}
              options={filteredSources}
              onAddNew={() => setNewSourceOpen(true)}
            />
          </Field>
          <Field label="Source date">
            <input
              type="date"
              value={sourceDate}
              onChange={(e) => setSourceDate(e.target.value)}
              className={inputClass}
            />
          </Field>
        </>
      ) : (
        <>
          <Field label="Metric (optional, structured)">
            <div className="flex gap-2">
              <input
                type="number"
                value={metricValue}
                onChange={(e) => setMetricValue(e.target.value)}
                placeholder="Value"
                className={inputClass}
              />
              <input
                type="text"
                value={metricUnit}
                onChange={(e) => setMetricUnit(e.target.value)}
                placeholder="Unit, e.g. %"
                className={inputClass}
              />
            </div>
          </Field>

          <Field label="Survey source">
            <SourceSelect
              value={surveySourceId}
              onChange={setSurveySourceId}
              options={filteredSources}
              onAddNew={() => setNewSourceOpen(true)}
            />
          </Field>

          <Field label="Readings over time">
            <Repeater
              rows={readings}
              onChange={setReadings}
              empty={{ year: "", value: "" }}
              renderRow={(row, onRowChange) => (
                <>
                  <input
                    type="number"
                    value={row.year}
                    onChange={(e) => onRowChange({ ...row, year: e.target.value })}
                    placeholder="Year"
                    className={inputClass}
                  />
                  <input
                    type="number"
                    value={row.value}
                    onChange={(e) => onRowChange({ ...row, value: e.target.value })}
                    placeholder="Value"
                    className={inputClass}
                  />
                </>
              )}
            />
          </Field>

          <Field label="State breakdown (optional)">
            <Repeater
              rows={stateBreakdown}
              onChange={setStateBreakdown}
              empty={{ state: "", value: "", year: "" }}
              renderRow={(row, onRowChange) => (
                <>
                  <input
                    type="text"
                    value={row.state}
                    onChange={(e) => onRowChange({ ...row, state: e.target.value })}
                    placeholder="State"
                    className={inputClass}
                  />
                  <input
                    type="number"
                    value={row.value}
                    onChange={(e) => onRowChange({ ...row, value: e.target.value })}
                    placeholder="Value"
                    className={inputClass}
                  />
                  <input
                    type="number"
                    value={row.year}
                    onChange={(e) => onRowChange({ ...row, year: e.target.value })}
                    placeholder="Year (optional)"
                    className={inputClass}
                  />
                </>
              )}
            />
          </Field>

          <Field label="Methodology note (optional)">
            <TextArea value={methodologyNote} onChange={setMethodologyNote} rows={2} />
          </Field>
        </>
      )}

      {newSourceOpen ? (
        <div className="mb-4 rounded-md border border-hairline p-4">
          <p className="text-caption text-ink mb-2">New {cardType === "news" ? "news outlet" : "survey"} source</p>
          <input
            type="text"
            value={newSourceName}
            onChange={(e) => setNewSourceName(e.target.value)}
            placeholder="Name"
            className={`${inputClass} mb-2`}
          />
          <input
            type="url"
            value={newSourceUrl}
            onChange={(e) => setNewSourceUrl(e.target.value)}
            placeholder="URL"
            className={`${inputClass} mb-2`}
          />
          <div className="flex gap-2">
            <button type="button" onClick={onCreateSource} className="rounded-full bg-gold px-3 py-1 font-headline font-medium text-label text-bg">
              Add
            </button>
            <button type="button" onClick={() => setNewSourceOpen(false)} className="font-headline font-medium text-label text-muted">
              Cancel
            </button>
          </div>
        </div>
      ) : null}

      {error ? <p className="mb-4 text-caption text-gold">{error}</p> : null}

      <button
        type="submit"
        disabled={submitting}
        className="rounded-full bg-gold px-5 py-2 font-headline font-medium text-label text-bg disabled:opacity-50"
      >
        {submitting ? "Saving…" : mode === "create" ? "Publish card" : "Save changes"}
      </button>
    </form>
  );
}

const inputClass = "w-full rounded-md border border-hairline bg-transparent px-3 py-2 text-ink placeholder:text-muted";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <label className="mb-1 block font-headline font-medium text-label text-muted">{label}</label>
      {children}
    </div>
  );
}

function TextInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return <input type="text" value={value} onChange={(e) => onChange(e.target.value)} className={inputClass} />;
}

function TextArea({
  value,
  onChange,
  rows,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  rows: number;
  placeholder?: string;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={rows}
      placeholder={placeholder}
      className={inputClass}
    />
  );
}

function SourceSelect({
  value,
  onChange,
  options,
  onAddNew,
}: {
  value: string;
  onChange: (v: string) => void;
  options: SourceOption[];
  onAddNew: () => void;
}) {
  return (
    <div className="flex gap-2">
      <select value={value} onChange={(e) => onChange(e.target.value)} className={inputClass}>
        <option value="">Select a source…</option>
        {options.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </select>
      <button type="button" onClick={onAddNew} className="whitespace-nowrap font-headline font-medium text-label text-gold">
        + New
      </button>
    </div>
  );
}

function Repeater<T extends Record<string, string>>({
  rows,
  onChange,
  empty,
  renderRow,
}: {
  rows: T[];
  onChange: (rows: T[]) => void;
  empty: T;
  renderRow: (row: T, onRowChange: (row: T) => void) => React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      {rows.map((row, i) => (
        <div key={i} className="flex items-center gap-2">
          {renderRow(row, (next) => onChange(rows.map((r, j) => (j === i ? next : r))))}
          <button
            type="button"
            onClick={() => onChange(rows.filter((_, j) => j !== i))}
            className="text-muted hover:text-ink"
            aria-label="Remove row"
          >
            ✕
          </button>
        </div>
      ))}
      <button type="button" onClick={() => onChange([...rows, empty])} className="self-start font-headline font-medium text-label text-gold">
        + Add row
      </button>
    </div>
  );
}
