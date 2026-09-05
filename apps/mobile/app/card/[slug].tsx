import { useEffect, useRef, type ReactNode } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { isDataCard } from "@repo/api-client";
import { computeTrend, formatAsOf, formatCardDate } from "@repo/utils";
import { colors } from "@repo/tokens";

import { api } from "../../lib/api";
import { useSavedCardIds, useToggleSaved } from "../../lib/savedCards";
import { ContestedBadge } from "../../components/ContestedBadge";
import { ChevronLeftIcon, BookmarkIcon } from "../../components/icons";
import { trackEvent } from "../../lib/analytics";
import { getCardSignalTopics } from "../../lib/personalization";
import { recordReaderSignal } from "../../lib/readerProfile";
import { openExternalUrl } from "../../lib/openExternalUrl";

export function ErrorBoundary({ error, retry }: { error: Error; retry: () => void }) {
  return (
    <View className="flex-1 items-center justify-center gap-3 bg-bg px-8">
      <Text className="text-center font-headline text-title text-ink">Something went wrong.</Text>
      <Text className="text-center font-body text-caption text-muted">{error.message}</Text>
      <Pressable onPress={retry} className="min-h-11 justify-center rounded-full bg-red px-5">
        <Text className="font-label text-surface">Try again</Text>
      </Pressable>
    </View>
  );
}

export default function CardDetail() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const savedIds = useSavedCardIds();
  const toggleSaved = useToggleSaved();
  const trackedDetailCard = useRef<string | null>(null);
  const { data: card, isPending } = useQuery({
    queryKey: ["card", slug],
    queryFn: () => api.getCardBySlug(slug),
    enabled: Boolean(slug),
  });

  useEffect(() => {
    if (!card || trackedDetailCard.current === card.id) return;
    trackedDetailCard.current = card.id;
    trackEvent("card_detail_open", { cardId: card.id });
    void recordReaderSignal("detail_open", getCardSignalTopics(card));
  }, [card]);

  if (isPending) {
    return (
      <View className="flex-1 items-center justify-center bg-bg">
        <ActivityIndicator color={colors.red} />
      </View>
    );
  }

  if (!card) {
    return (
      <View className="flex-1 items-center justify-center bg-bg px-8">
        <Text className="text-center font-headline text-title text-ink">Card not found.</Text>
      </View>
    );
  }

  const isData = isDataCard(card);
  const trend = isData ? computeTrend(card.readings) : null;
  const isSaved = savedIds.includes(card.id);
  const source = isData ? card.surveySource : card.source;
  const deepDiveParagraphs = card.deepDiveBody
    ? card.deepDiveBody.split(/\n{2,}/).map((paragraph) => paragraph.trim()).filter(Boolean)
    : [];

  return (
    <View className="flex-1 bg-surface">
      <View
        className="z-20 flex-row items-end border-b border-hairline bg-surface px-5 pb-3"
        style={{ paddingTop: insets.top + 10 }}
      >
        <Pressable
          onPress={() => router.back()}
          aria-label="Back"
          className="h-11 flex-row items-center gap-1.5 rounded-full bg-surface2 px-3"
        >
          <ChevronLeftIcon size={19} color={colors.ink} />
          <Text className="font-label text-[11px] text-ink">Today</Text>
        </Pressable>
        <View className="mx-3 min-w-0 flex-1">
          <Text className="text-center font-label text-[11px] uppercase tracking-[1.5px] text-red">
            Read deeper
          </Text>
        </View>
        <Pressable
          onPress={() => {
            toggleSaved(card.id);
            trackEvent(isSaved ? "card_unsave" : "card_save", { cardId: card.id });
            if (!isSaved) void recordReaderSignal("save", getCardSignalTopics(card));
          }}
          aria-label={isSaved ? "Remove from saved" : "Save"}
          className="h-11 w-11 items-center justify-center rounded-full bg-surface2"
        >
          <BookmarkIcon size={17} color={isSaved ? colors.red : colors.ink} active={isSaved} />
        </Pressable>
      </View>

      <ScrollView
        stickyHeaderIndices={[1]}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 72 }}
      >
        {isData && card.metric ? (
          <View className="h-72 items-center justify-center overflow-hidden bg-lime px-6">
            <View className="absolute -right-7 -top-10 h-36 w-36 rotate-12 rounded-[40px] border-[3px] border-ink opacity-15" />
            <Text className="font-headline text-[78px] leading-[102px] text-ink" style={{ fontVariant: ["tabular-nums"] }}>
              {card.metric.value}{card.metric.unit}
            </Text>
            <Text className="font-label text-caption uppercase tracking-[2px] text-ink">The number / verified</Text>
          </View>
        ) : (
          <Image
            source={{ uri: card.image.url }}
            placeholder={{ uri: card.image.blurDataURL }}
            contentFit="cover"
            style={{ width: "100%", height: 310 }}
            accessibilityLabel={card.image.alt}
          />
        )}

        <View
          className="border-b border-hairline bg-surface px-5 pb-4 pt-4"
          style={{ shadowColor: colors.ink, shadowOpacity: 0.08, shadowRadius: 14, elevation: 5 }}
        >
          <View className="mb-2 flex-row flex-wrap items-center gap-2">
            {card.isContested ? <ContestedBadge /> : null}
            <View className="rounded-full bg-peach px-3 py-1.5">
              <Text className="font-label text-[11px] text-red">
                {isData ? "Data / context" : "Read deeper"}
              </Text>
            </View>
          </View>

          <Text className="font-headline text-[28px] leading-[38px] text-ink">{card.headline}</Text>

          <Text className="mt-2 font-body text-[11px] uppercase tracking-[1.2px] text-muted">
            {isData && trend?.latest
              ? formatAsOf(trend.latest.year, source.name)
              : !isData
                ? `${source.name} / ${formatCardDate(card.sourceDate)}`
                : source.name}
          </Text>
        </View>

        <View className="px-5 pt-5">

          {card.correctionNote && card.correctedAt ? (
            <View className="mb-5 rounded-[20px] border border-red bg-surface p-4">
              <Text className="font-label text-caption uppercase tracking-wider text-red">
                Correction / {formatCardDate(card.correctedAt)}
              </Text>
              <Text className="mt-2 font-body text-caption leading-5 text-ink">
                {card.correctionNote}
              </Text>
            </View>
          ) : null}

          <Text className="font-headline text-[21px] leading-[31px] text-ink">{card.body}</Text>

          {deepDiveParagraphs.map((paragraph, index) => (
            <Text key={index} className="mt-5 font-body text-[17px] leading-[28px] text-ink">
              {paragraph}
            </Text>
          ))}

          {deepDiveParagraphs.length === 0 ? (
            <Pressable
              onPress={() => {
                trackEvent("source_open", { cardId: card.id });
                void recordReaderSignal("source_open", getCardSignalTopics(card));
                void openExternalUrl(source.url);
              }}
              className="mt-7 items-center rounded-full bg-red px-5 py-3.5"
            >
              <Text className="font-label text-label text-surface">Read at {source.name}</Text>
            </Pressable>
          ) : null}

          {deepDiveParagraphs.length > 0 ? (
            <Pressable
              onPress={() => {
                trackEvent("source_open", { cardId: card.id });
                void recordReaderSignal("source_open", getCardSignalTopics(card));
                void openExternalUrl(source.url);
              }}
              className="mt-8 flex-row items-center justify-center rounded-full bg-red px-5 py-3.5"
            >
              <Text className="font-label text-label text-surface">Open original source</Text>
            </Pressable>
          ) : null}

          {isData && card.stateBreakdown && card.stateBreakdown.length > 0 ? (
            <DataSection title="By state">
              {[...card.stateBreakdown]
                .sort((a, b) => b.value - a.value)
                .map((row, index) => (
                  <DataRow
                    key={`${row.state}-${index}`}
                    label={row.state}
                    value={`${row.value.toLocaleString("en-IN")}${row.year ? ` / ${row.year}` : ""}`}
                  />
                ))}
            </DataSection>
          ) : null}

          {isData && card.readings.length > 1 ? (
            <DataSection title="Over time" canvas={colors.sky}>
              {[...card.readings]
                .sort((a, b) => a.year - b.year)
                .map((reading) => (
                  <DataRow
                    key={reading.year}
                    label={String(reading.year)}
                    value={reading.value.toLocaleString("en-IN")}
                  />
                ))}
            </DataSection>
          ) : null}

          {isData && card.methodologyNote ? (
            <View className="mt-5 rounded-[20px] bg-surface p-4">
              <Text className="font-label text-caption uppercase tracking-wider text-red">Method note</Text>
              <Text className="mt-2 font-body text-caption leading-5 text-muted">{card.methodologyNote}</Text>
            </View>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}

function DataSection({
  title,
  canvas = colors.lilac,
  children,
}: {
  title: string;
  canvas?: string;
  children: ReactNode;
}) {
  return (
    <View className="mt-6 overflow-hidden rounded-[22px] p-4" style={{ backgroundColor: canvas }}>
      <Text className="mb-2 font-headline text-[24px] text-ink">{title}</Text>
      {children}
    </View>
  );
}

function DataRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-center justify-between border-b border-hairline py-2.5 last:border-b-0">
      <Text className="font-body text-body text-ink">{label}</Text>
      <Text className="font-label text-label text-ink">{value}</Text>
    </View>
  );
}
