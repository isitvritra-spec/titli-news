import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { useQuery } from "@tanstack/react-query";

import { api } from "../../lib/api";
import { useSelectedTopics } from "../../lib/topicSelection";
import { CardStack } from "../../components/CardStack";
import { WomenPulse } from "../../components/WomenPulse";
import { trackEvent } from "../../lib/analytics";

/**
 * Edge-to-edge, no header chrome — "Feed" is now a persistent tab label
 * (see (tabs)/_layout.tsx), and foreground-refetch (lib/useRefetchOnForeground.ts)
 * is the sole refresh mechanism now that there's no floating refresh button.
 */
export default function Feed() {
  const selectedTopics = useSelectedTopics();
  const [activeIndex, setActiveIndex] = useState(0);
  const [feedHeight, setFeedHeight] = useState(0);
  const activeTopics = selectedTopics.length > 0 ? selectedTopics : undefined;

  const { data: cards, isPending, isError, refetch } = useQuery({
    queryKey: ["feed", activeTopics ?? "all"],
    queryFn: () => api.getFeed({ topicSlugs: activeTopics }),
  });

  useEffect(() => {
    const card = cards?.[activeIndex];
    if (!card) return;

    const startedAt = Date.now();
    let viewRecorded = false;
    const timer = setTimeout(() => {
      viewRecorded = true;
      trackEvent("card_view", { cardId: card.id, position: activeIndex });
    }, 2_000);

    return () => {
      clearTimeout(timer);
      const durationMs = Date.now() - startedAt;
      if (durationMs < 2_000) return;
      if (!viewRecorded) {
        trackEvent("card_view", { cardId: card.id, position: activeIndex });
      }
      trackEvent("card_dwell", {
        cardId: card.id,
        position: activeIndex,
        durationMs: Math.min(durationMs, 300_000),
      });
    };
  }, [activeIndex, cards]);

  return (
    <View className="flex-1 bg-bg">
      <WomenPulse />
      <View
        className="flex-1"
        onLayout={(event) => setFeedHeight(Math.round(event.nativeEvent.layout.height))}
      >
        {isPending ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator color="#E4A069" />
          </View>
        ) : isError ? (
          <View className="flex-1 items-center justify-center px-8 gap-3">
            <Text className="font-headline text-title text-ink text-center">
              Couldn't load the feed.
            </Text>
            <Pressable onPress={() => refetch()} className="rounded-full border border-gold px-4 py-2">
              <Text className="text-gold font-body">Try again</Text>
            </Pressable>
          </View>
        ) : cards && cards.length > 0 ? (
          <CardStack
            cards={cards}
            onIndexChange={setActiveIndex}
            height={feedHeight || undefined}
          />
        ) : (
          <View className="flex-1 items-center justify-center px-8">
            <Text className="font-headline text-title text-ink text-center">
              No cards yet — check back soon.
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}
