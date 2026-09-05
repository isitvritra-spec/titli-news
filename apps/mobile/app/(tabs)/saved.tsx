import { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { isDataCard, type Card } from "@repo/api-client";
import { computeTrend, formatAsOf, formatCardDate } from "@repo/utils";
import { colors, derived } from "@repo/tokens";

import { api } from "../../lib/api";
import { useSavedCardIds, useToggleSaved } from "../../lib/savedCards";
import { BookmarkIcon, ButterflyMark } from "../../components/icons";
import { EditorialHeader } from "../../components/EditorialHeader";
import { SwipeableTabScreen } from "../../components/SwipeableTabScreen";

const savedCanvases = [colors.lilac, colors.sky, colors.peach, colors.sage];

function savedSubtitle(card: Card) {
  if (isDataCard(card)) {
    const trend = computeTrend(card.readings);
    const asOf = trend?.latest ? formatAsOf(trend.latest.year, card.surveySource.name) : card.surveySource.name;
    return card.metric ? `${card.metric.value}${card.metric.unit} / ${asOf}` : asOf;
  }
  return `${card.source.name} / ${formatCardDate(card.sourceDate)}`;
}

export default function Saved() {
  const router = useRouter();
  const savedIds = useSavedCardIds();
  const toggleSaved = useToggleSaved();
  const [activeTopic, setActiveTopic] = useState<string | null>(null);
  const { data: cards, isPending } = useQuery({
    queryKey: ["feed", "all"],
    queryFn: () => api.getFeed({}),
  });
  const cardById = new Map((cards ?? []).map((card) => [card.id, card]));
  const savedCards = [...savedIds].reverse().flatMap((id) => {
    const card = cardById.get(id);
    return card ? [card] : [];
  });
  const topics = Array.from(new Map(savedCards.flatMap((card) => card.topics).map((topic) => [topic.slug, topic])).values());
  const filteredCards = activeTopic
    ? savedCards.filter((card) => card.topics.some((topic) => topic.slug === activeTopic))
    : savedCards;
  const featured = filteredCards[0];
  const remaining = filteredCards.slice(1);

  return (
    <SwipeableTabScreen current="saved">
      <View className="bg-bg" style={{ flex: 1, minHeight: 0, overflow: "hidden" }}>
        <EditorialHeader
          eyebrow="Your quiet corner"
          title="Saved"
          description={savedCards.length === 0
            ? "The stories you want to return to will wait here."
            : `${savedCards.length} ${savedCards.length === 1 ? "story" : "stories"}, ready when you are.`}
        />

        {isPending ? (
          <ActivityIndicator color={colors.red} style={{ marginTop: 24 }} />
        ) : savedCards.length === 0 ? (
          <View className="mx-4 mt-3 overflow-hidden rounded-card bg-ink px-7 py-8">
            <ButterflyMark size={36} color={colors.peach} />
            <Text className="mt-7 font-headline text-[30px] leading-[38px] text-surface">Nothing kept yet.</Text>
            <Text className="mt-2 font-body text-body leading-6 text-sage">Keep one useful story today. It will be waiting here without the noise.</Text>
            <Pressable
              onPress={() => router.push("/(tabs)/topics")}
              accessibilityRole="button"
              className="mt-6 min-h-11 items-center justify-center rounded-full bg-peach px-5"
            >
              <Text className="font-label text-[12px] text-ink">Find something worth keeping</Text>
            </Pressable>
          </View>
        ) : (
          <ScrollView style={{ flex: 1, minHeight: 0 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 130 }}>
            <View className="pb-5 pt-1">
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }}>
                <FilterChip label={`All ${savedCards.length}`} selected={activeTopic === null} onPress={() => setActiveTopic(null)} />
                {topics.map((topic) => (
                  <FilterChip key={topic.slug} label={topic.title} selected={activeTopic === topic.slug} onPress={() => setActiveTopic(topic.slug)} />
                ))}
              </ScrollView>
            </View>

            {featured ? (
              <View className="px-4">
                <View className="mb-3 flex-row items-center justify-between">
                  <Text className="font-label text-[11px] uppercase tracking-[1.6px] text-red">Pick up here</Text>
                  <Text className="font-body text-[12px] text-muted">Most recently kept</Text>
                </View>
                <Pressable
                  onPress={() => router.push(`/card/${featured.slug}`)}
                  accessibilityRole="button"
                  accessibilityLabel={`Continue reading ${featured.headline}`}
                  className="overflow-hidden rounded-[26px] bg-ink"
                  style={{ aspectRatio: 16 / 9 }}
                >
                  {isDataCard(featured) && featured.metric ? (
                    <LinearGradient colors={[colors.lime, colors.jade]} className="p-5" style={{ flex: 1 }}>
                      <Text className="font-headline text-[48px] leading-[56px] text-ink">{featured.metric.value}{featured.metric.unit}</Text>
                    </LinearGradient>
                  ) : (
                    <Image source={{ uri: featured.image.url }} placeholder={{ uri: featured.image.blurDataURL }} contentFit="cover" style={{ width: "100%", height: "100%" }} accessibilityLabel={featured.image.alt} />
                  )}
                  <LinearGradient pointerEvents="none" colors={["transparent", derived.scrim]} className="absolute inset-0 justify-end p-5">
                    <Text className="font-label text-[11px] uppercase tracking-[1.4px] text-peach">{featured.primaryGenre?.title ?? "Saved story"}</Text>
                    <Text className="mt-1 font-headline text-[22px] leading-[28px] text-surface" numberOfLines={2}>{featured.headline}</Text>
                  </LinearGradient>
                </Pressable>
              </View>
            ) : null}

            {remaining.length > 0 ? (
              <View className="mt-6 gap-3 px-4">
                <Text className="font-label text-[11px] uppercase tracking-[1.6px] text-red">Also on your shelf</Text>
                {remaining.map((card, index) => (
                  <Pressable
                    key={card.id}
                    onPress={() => router.push(`/card/${card.slug}`)}
                    accessibilityRole="button"
                    accessibilityLabel={`Read saved story ${card.headline}`}
                    className="min-h-36 flex-row overflow-hidden rounded-[22px] border border-hairline bg-surface p-3"
                    style={({ pressed }) => ({ opacity: pressed ? 0.75 : 1 })}
                  >
                    {isDataCard(card) && card.metric ? (
                      <View className="min-h-32 w-24 self-stretch items-center justify-center rounded-[16px] bg-lime px-2">
                        <Text className="font-headline text-[27px] leading-[38px] text-ink">{card.metric.value}{card.metric.unit}</Text>
                        <Text className="mt-1 font-label text-[11px] uppercase text-muted">The number</Text>
                      </View>
                    ) : (
                      <Image source={{ uri: card.image.url }} placeholder={{ uri: card.image.blurDataURL }} contentFit="cover" style={{ width: 96, minHeight: 128, alignSelf: "stretch", borderRadius: 16, backgroundColor: savedCanvases[index % savedCanvases.length] }} accessibilityLabel={card.image.alt} />
                    )}
                    <View className="min-w-0 flex-1 px-3 py-1">
                      <Text className="font-headline text-[19px] leading-[25px] text-ink" numberOfLines={3}>{card.headline}</Text>
                      <Text className="mt-auto font-body text-[11px] uppercase tracking-wider text-muted" numberOfLines={1}>{savedSubtitle(card)}</Text>
                    </View>
                    <Pressable
                      onPress={(event) => { event.stopPropagation(); toggleSaved(card.id); }}
                      className="h-11 w-11 items-center justify-center rounded-full bg-pressed"
                      aria-label="Remove from saved"
                    >
                      <BookmarkIcon size={17} color={colors.red} active />
                    </Pressable>
                  </Pressable>
                ))}
              </View>
            ) : null}
          </ScrollView>
        )}
      </View>
    </SwipeableTabScreen>
  );
}

function FilterChip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      className="min-h-11 items-center justify-center rounded-full border px-4"
      style={{ borderColor: selected ? colors.ink : derived.hairline, backgroundColor: selected ? colors.ink : colors.surface }}
    >
      <Text className="font-label text-[12px]" style={{ color: selected ? colors.surface : colors.ink }}>{label}</Text>
    </Pressable>
  );
}
