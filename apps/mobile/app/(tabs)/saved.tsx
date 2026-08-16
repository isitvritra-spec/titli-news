import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { isDataCard, type Card } from "@repo/api-client";
import { computeTrend, formatAsOf, formatCardDate } from "@repo/utils";
import { colors } from "@repo/tokens";

import { api } from "../../lib/api";
import { useSavedCardIds, useToggleSaved } from "../../lib/savedCards";
import { BookmarkIcon } from "../../components/icons";

function savedSubtitle(card: Card) {
  if (isDataCard(card)) {
    const trend = computeTrend(card.readings);
    const asOf = trend?.latest ? formatAsOf(trend.latest.year, card.surveySource.name) : card.surveySource.name;
    return card.metric ? `${card.metric.value}${card.metric.unit} · ${asOf}` : asOf;
  }
  return `${card.source.name} · ${formatCardDate(card.sourceDate)}`;
}

/**
 * Reads the same feed data the Feed tab does (no batch-by-id endpoint
 * exists in @repo/api-client) and filters to bookmarked ids client-side —
 * unfiltered by topic, so a saved card stays visible here even if its
 * topic gets turned off later.
 */
export default function Saved() {
  const router = useRouter();
  const savedIds = useSavedCardIds();
  const toggleSaved = useToggleSaved();

  const { data: cards, isPending } = useQuery({
    queryKey: ["feed", "all"],
    queryFn: () => api.getFeed({}),
  });

  const savedCards = (cards ?? []).filter((card) => savedIds.includes(card.id));

  return (
    <View className="flex-1 bg-bg">
      <View className="pt-6 px-4 pb-2">
        <Text className="font-headline text-title text-ink">Saved</Text>
      </View>

      {isPending ? (
        <ActivityIndicator color={colors.gold} style={{ marginTop: 24 }} />
      ) : savedCards.length === 0 ? (
        <View className="px-7 py-10">
          <Text className="font-body text-body text-muted text-center leading-relaxed">
            Nothing saved yet — tap the bookmark on any card to keep it here.
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerClassName="pb-10">
          {savedCards.map((card) => (
            <Pressable
              key={card.id}
              onPress={() => router.push(`/card/${card.slug}`)}
              className="flex-row items-center justify-between gap-3 px-4 py-4 border-b border-hairline"
            >
              <View className="flex-1 gap-1">
                <Text className="font-headline text-body text-ink" numberOfLines={1}>
                  {card.headline}
                </Text>
                <Text
                  className="font-body text-caption text-muted"
                  style={{ fontVariant: ["tabular-nums"] }}
                >
                  {savedSubtitle(card)}
                </Text>
              </View>
              <Pressable onPress={() => toggleSaved(card.id)} hitSlop={8}>
                <BookmarkIcon size={18} color={colors.gold} active />
              </Pressable>
            </Pressable>
          ))}
        </ScrollView>
      )}
    </View>
  );
}
