import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { isDataCard } from "@repo/api-client";
import { computeTrend, formatAsOf, formatCardDate } from "@repo/utils";
import { colors, derived } from "@repo/tokens";

import { api } from "../../lib/api";
import { useSavedCardIds, useToggleSaved } from "../../lib/savedCards";
import { ContestedBadge } from "../../components/ContestedBadge";
import { ChevronLeftIcon, BookmarkIcon } from "../../components/icons";
import { trackEvent } from "../../lib/analytics";
import { getCardSignalTopics } from "../../lib/personalization";
import { recordReaderSignal } from "../../lib/readerProfile";
import { openExternalUrl } from "../../lib/openExternalUrl";
import { Symbol } from "../../components/ui/Symbol";
import { editorial as e, type } from "../../components/ui/theme";

export function ErrorBoundary({
  error,
  retry,
}: {
  error: Error;
  retry: () => void;
}) {
  return (
    <View className="flex-1 items-center justify-center gap-3 bg-bg px-8">
      <Text className="text-center font-headline text-title text-ink">
        Something went wrong.
      </Text>
      <Text className="text-center font-body text-caption text-muted">
        {error.message}
      </Text>
      <Pressable
        onPress={retry}
        className="min-h-11 justify-center rounded-full bg-red px-5"
      >
        <Text className="font-label text-surface">Try again</Text>
      </Pressable>
    </View>
  );
}

export default function CardDetail() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const [scrolled, setScrolled] = useState(false);
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
        <Text className="text-center font-headline text-title text-ink">
          Card not found.
        </Text>
      </View>
    );
  }

  const isData = isDataCard(card);
  const trend = isData ? computeTrend(card.readings) : null;
  const isSaved = savedIds.includes(card.id);
  const source = isData ? card.surveySource : card.source;
  const deepDiveParagraphs = card.deepDiveBody
    ? card.deepDiveBody
        .split(/\n{2,}/)
        .map((paragraph) => paragraph.trim())
        .filter(Boolean)
    : [];

  return (
    <View style={{ flex: 1, backgroundColor: e.paper }}>
      <StatusBar style={scrolled || isData ? "dark" : "light"} />
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 20,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 22,
          paddingTop: insets.top + 8,
          paddingBottom: 10,
          backgroundColor: scrolled ? e.paper : "transparent",
        }}
      >
        <Pressable
          onPress={() =>
            router.canGoBack() ? router.back() : router.replace("/(tabs)")
          }
          aria-label="Back"
          accessibilityRole="button"
          style={detailStyle.roundButton}
        >
          <ChevronLeftIcon size={19} color={colors.ink} />
        </Pressable>
        {scrolled ? (
          <Text
            numberOfLines={1}
            style={[
              type.label,
              { flex: 1, textAlign: "center", paddingHorizontal: 16 },
            ]}
          >
            {source.name}
          </Text>
        ) : null}
        <Pressable
          onPress={() => router.push("/(tabs)/topics?search=1")}
          accessibilityRole="button"
          accessibilityLabel="Search stories"
          style={detailStyle.roundButton}
        >
          <Symbol name="search" size={20} />
        </Pressable>
      </View>

      <ScrollView
        onScroll={(event) =>
          setScrolled(
            event.nativeEvent.contentOffset.y >
              Math.min(height * 0.46, 410) - insets.top - 65,
          )
        }
        scrollEventThrottle={32}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 50 }}
      >
        <View style={{ height: Math.min(height * 0.46, 410), minHeight: 290 }}>
          <Image
            source={{ uri: card.image.url }}
            placeholder={{ uri: card.image.blurDataURL }}
            contentFit="cover"
            style={{ width: "100%", height: "100%" }}
            accessibilityLabel={card.image.alt}
          />
          {card.image.credit ? (
            <Text style={detailStyle.imageCredit}>{card.image.credit}</Text>
          ) : null}
          {isData && card.metric ? (
            <LinearGradient
              colors={["#11121010", "#111210E8"]}
              locations={[0.12, 1]}
              style={StyleSheet.absoluteFill}
            >
              <View style={detailStyle.metricHero}>
              <Text style={[type.label, { color: e.white }]}>
                Behind the number
              </Text>
              <Text
                className="font-headline text-[78px] leading-[102px] text-white"
                style={{ fontVariant: ["tabular-nums"], marginTop: 2 }}
              >
                {card.metric.value}
                {card.metric.unit}
              </Text>
              <Text style={[type.body, { color: e.white }]}>
                {source.name} ·{" "}
                {card.primaryGenre?.title ?? "The bigger picture"}
              </Text>
              </View>
            </LinearGradient>
          ) : (
            <LinearGradient
              pointerEvents="none"
              colors={["#11121060", "transparent", "#11121050"]}
              style={StyleSheet.absoluteFill}
            />
          )}
        </View>

        <View
          style={{
            backgroundColor: e.paper,
            marginTop: -26,
            borderTopLeftRadius: 30,
            borderTopRightRadius: 30,
            paddingHorizontal: 24,
            paddingTop: 24,
            paddingBottom: 20,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 18,
              gap: 12,
            }}
          >
            <View
              style={{
                width: 42,
                height: 42,
                borderRadius: 14,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: e.ink,
              }}
            >
              <Text style={[type.button, { color: e.paper }]}>
                {source.name.slice(0, 2).toUpperCase()}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={type.button}>{source.name}</Text>
              <Text style={[type.body, { fontSize: 12, lineHeight: 17 }]}>
                {card.primaryGenre?.title ?? "News, with perspective"}
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={isSaved ? "Remove from saved" : "Save story"}
              accessibilityState={{ selected: isSaved }}
              onPress={() => {
                toggleSaved(card.id);
                trackEvent(isSaved ? "card_unsave" : "card_save", {
                  cardId: card.id,
                });
                if (!isSaved)
                  void recordReaderSignal("save", getCardSignalTopics(card));
              }}
              style={[detailStyle.roundButton, { backgroundColor: e.lilac }]}
            >
              <BookmarkIcon color={e.ink} size={21} active={isSaved} />
            </Pressable>
          </View>
          <View className="mb-2 flex-row flex-wrap items-center gap-2">
            {card.isContested ? <ContestedBadge /> : null}
            <View className="rounded-full bg-peach px-3 py-1.5">
              <Text className="font-label text-[11px] text-red">
                {isData ? "Data / context" : "Read deeper"}
              </Text>
            </View>
          </View>

          <Text style={[type.title, { fontSize: 31, lineHeight: 39 }]}>
            {card.headline}
          </Text>

          <Text className="mt-2 font-body text-[11px] uppercase tracking-[1.2px] text-muted">
            {isData && trend?.latest
              ? formatAsOf(trend.latest.year, source.name)
              : !isData
                ? `${source.name} / ${formatCardDate(card.sourceDate)}`
                : source.name}
          </Text>
        </View>

        <View style={{ paddingHorizontal: 24, paddingTop: 4 }}>
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

          <Text
            style={{
              fontFamily: e.serif,
              fontSize: 21,
              lineHeight: 32,
              color: e.ink,
            }}
          >
            {card.body}
          </Text>

          {deepDiveParagraphs.map((paragraph, index) => (
            <Text
              key={index}
              className="mt-5 font-body text-[17px] leading-[28px] text-ink"
            >
              {paragraph}
            </Text>
          ))}

          {deepDiveParagraphs.length === 0 ? (
            <Pressable
              onPress={() => {
                trackEvent("source_open", { cardId: card.id });
                void recordReaderSignal(
                  "source_open",
                  getCardSignalTopics(card),
                );
                void openExternalUrl(source.url);
              }}
              className="mt-7 items-center rounded-full bg-red px-5 py-3.5"
            >
              <Text className="font-label text-label text-surface">
                Read at {source.name}
              </Text>
            </Pressable>
          ) : null}

          {deepDiveParagraphs.length > 0 ? (
            <Pressable
              onPress={() => {
                trackEvent("source_open", { cardId: card.id });
                void recordReaderSignal(
                  "source_open",
                  getCardSignalTopics(card),
                );
                void openExternalUrl(source.url);
              }}
              className="mt-8 flex-row items-center justify-center rounded-full bg-red px-5 py-3.5"
            >
              <Text className="font-label text-label text-surface">
                Open original source
              </Text>
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
              <Text className="font-label text-caption uppercase tracking-wider text-red">
                Method note
              </Text>
              <Text className="mt-2 font-body text-caption leading-5 text-muted">
                {card.methodologyNote}
              </Text>
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
    <View
      className="mt-6 overflow-hidden rounded-[22px] p-4"
      style={{ backgroundColor: canvas }}
    >
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

const detailStyle = StyleSheet.create({
  metricHero: {
    flex: 1,
    justifyContent: "flex-end",
    padding: 28,
    paddingBottom: 50,
  },
  imageCredit: {
    position: "absolute",
    right: 0,
    bottom: 0,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 11,
    color: e.white,
    backgroundColor: derived.scrim,
  },
  roundButton: {
    width: 46,
    height: 46,
    borderRadius: 24,
    backgroundColor: e.paper,
    alignItems: "center",
    justifyContent: "center",
  },
});
