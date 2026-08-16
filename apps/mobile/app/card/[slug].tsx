import { ActivityIndicator, Linking, Pressable, ScrollView, Text, View } from "react-native";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { isDataCard } from "@repo/api-client";
import { computeTrend, formatAsOf, formatCardDate } from "@repo/utils";
import { colors } from "@repo/tokens";

import { api } from "../../lib/api";
import { useSavedCardIds, useToggleSaved } from "../../lib/savedCards";
import { ContestedBadge } from "../../components/ContestedBadge";
import { ChevronLeftIcon, BookmarkIcon } from "../../components/icons";

/**
 * Expo Router's per-route error boundary convention. Defense-in-depth: if
 * anything on this screen throws during render, the reader sees a legible
 * fallback instead of a blank/crashed screen.
 */
export function ErrorBoundary({ error, retry }: { error: Error; retry: () => void }) {
  return (
    <View className="flex-1 items-center justify-center bg-surface2 px-8 gap-3">
      <Text className="font-headline text-title text-ink text-center">Something went wrong.</Text>
      <Text className="text-caption text-muted text-center font-body">{error.message}</Text>
      <Pressable onPress={retry} className="rounded-full border border-gold px-4 py-2">
        <Text className="text-gold font-body">Try again</Text>
      </Pressable>
    </View>
  );
}

export default function CardDetail() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const savedIds = useSavedCardIds();
  const toggleSaved = useToggleSaved();

  const { data: card, isPending } = useQuery({
    queryKey: ["card", slug],
    queryFn: () => api.getCardBySlug(slug),
    enabled: Boolean(slug),
  });

  if (isPending) {
    return (
      <View className="flex-1 items-center justify-center bg-surface2">
        <ActivityIndicator color={colors.gold} />
      </View>
    );
  }

  if (!card) {
    return (
      <View className="flex-1 items-center justify-center bg-surface2 px-8">
        <Text className="font-headline text-title text-ink text-center">Card not found.</Text>
      </View>
    );
  }

  const isData = isDataCard(card);
  const trend = isData ? computeTrend(card.readings) : null;
  const isSaved = savedIds.includes(card.id);
  const deepDiveParagraphs = card.deepDiveBody
    ? card.deepDiveBody.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean)
    : [];

  return (
    <View className="flex-1 bg-surface2">
      <ScrollView contentContainerClassName="pb-16">
        <Image
          source={{ uri: card.image.url }}
          placeholder={{ uri: card.image.blurDataURL }}
          contentFit="cover"
          style={{ width: "100%", height: 260 }}
          accessibilityLabel={card.image.alt}
        />

        <View className="px-5 pt-5">
          {card.isContested ? (
            <View className="mb-3">
              <ContestedBadge />
            </View>
          ) : null}

          <Text className="font-headline text-title text-ink">{card.headline}</Text>

          {isData && card.metric ? (
            <Text
              className="mt-1 font-headline text-hero text-ink"
              style={{ fontVariant: ["tabular-nums"] }}
            >
              {card.metric.value}
              {card.metric.unit}
            </Text>
          ) : null}

          {isData && trend?.latest ? (
            <Text className="mt-2 text-caption text-muted font-body">
              {formatAsOf(trend.latest.year, card.surveySource.name)}
            </Text>
          ) : !isData ? (
            <Text className="mt-2 text-caption text-muted font-body uppercase tracking-wide">
              {card.source.name} · {formatCardDate(card.sourceDate)}
            </Text>
          ) : null}

          <Text className="mt-4 text-body leading-relaxed text-ink font-body">{card.body}</Text>

          {deepDiveParagraphs.length > 0 ? (
            deepDiveParagraphs.map((paragraph, i) => (
              <Text key={i} className="mt-3 text-body leading-relaxed text-ink font-body">
                {paragraph}
              </Text>
            ))
          ) : (
            <Pressable
              onPress={() =>
                Linking.openURL(isData ? card.surveySource.url : card.source.url)
              }
              className="mt-6 self-start rounded-full border border-gold px-4 py-2"
            >
              <Text className="text-gold font-body">
                Read the full story at {isData ? card.surveySource.name : card.source.name}
              </Text>
            </Pressable>
          )}

          {isData && card.stateBreakdown && card.stateBreakdown.length > 0 ? (
            <View className="mt-6">
              <Text className="font-headline text-title text-ink mb-2">By state</Text>
              {[...card.stateBreakdown]
                .sort((a, b) => b.value - a.value)
                .map((row, i) => (
                  <View
                    key={`${row.state}-${i}`}
                    className="flex-row items-center justify-between py-2 border-b border-hairline"
                  >
                    <Text className="text-body text-ink font-body">{row.state}</Text>
                    <Text className="text-body text-muted font-body">
                      {row.value.toLocaleString("en-IN")}
                      {row.year ? ` (${row.year})` : ""}
                    </Text>
                  </View>
                ))}
            </View>
          ) : null}

          {isData && card.readings.length > 1 ? (
            <View className="mt-6">
              <Text className="font-headline text-title text-ink mb-2">Over time</Text>
              {[...card.readings]
                .sort((a, b) => a.year - b.year)
                .map((reading) => (
                  <View key={reading.year} className="flex-row items-center justify-between py-1">
                    <Text className="text-body text-muted font-body">{reading.year}</Text>
                    <Text className="text-body text-ink font-body">
                      {reading.value.toLocaleString("en-IN")}
                    </Text>
                  </View>
                ))}
            </View>
          ) : null}

          {isData && card.methodologyNote ? (
            <Text className="mt-6 text-caption text-muted font-body leading-relaxed">
              {card.methodologyNote}
            </Text>
          ) : null}
        </View>
      </ScrollView>

      <Pressable
        onPress={() => router.back()}
        aria-label="Back"
        className="absolute top-14 left-5 h-9 w-9 items-center justify-center rounded-full bg-pressed"
      >
        <ChevronLeftIcon size={22} color={colors.ink} />
      </Pressable>

      <Pressable
        onPress={() => toggleSaved(card.id)}
        aria-label={isSaved ? "Remove from saved" : "Save"}
        className="absolute top-14 right-5 h-9 w-9 items-center justify-center rounded-full bg-pressed"
      >
        <BookmarkIcon size={18} color={isSaved ? colors.gold : colors.muted} active={isSaved} />
      </Pressable>
    </View>
  );
}
