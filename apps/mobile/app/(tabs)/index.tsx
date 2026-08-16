import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { useQuery } from "@tanstack/react-query";

import { api } from "../../lib/api";
import { useSelectedTopics } from "../../lib/topicSelection";
import { CardStack } from "../../components/CardStack";

/**
 * Edge-to-edge, no header chrome — "Feed" is now a persistent tab label
 * (see (tabs)/_layout.tsx), and foreground-refetch (lib/useRefetchOnForeground.ts)
 * is the sole refresh mechanism now that there's no floating refresh button.
 */
export default function Feed() {
  const selectedTopics = useSelectedTopics();
  const activeTopics = selectedTopics.length > 0 ? selectedTopics : undefined;

  const { data: cards, isPending, isError, refetch } = useQuery({
    queryKey: ["feed", activeTopics ?? "all"],
    queryFn: () => api.getFeed({ topicSlugs: activeTopics }),
  });

  return (
    <View className="flex-1 bg-bg">
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
        <CardStack cards={cards} />
      ) : (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="font-headline text-title text-ink text-center">
            No cards yet — check back soon.
          </Text>
        </View>
      )}
    </View>
  );
}
