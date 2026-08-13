import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Link } from "expo-router";
import { useQuery } from "@tanstack/react-query";

import { api } from "../lib/api";
import { useSelectedTopics } from "../lib/topicSelection";
import { CardStack } from "../components/CardStack";

export default function Feed() {
  const insets = useSafeAreaInsets();
  const selectedTopics = useSelectedTopics();
  const activeTopics = selectedTopics.length > 0 ? selectedTopics : undefined;

  const { data: cards, isPending, isError, refetch, isRefetching } = useQuery({
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
          <Text className="font-headline text-xl text-ink text-center">
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
          <Text className="font-headline text-xl text-ink text-center">
            No cards yet — check back soon.
          </Text>
        </View>
      )}

      <View
        style={{ top: insets.top + 8 }}
        className="absolute left-0 right-0 flex-row items-center justify-between px-5"
      >
        <Pressable
          onPress={() => refetch()}
          disabled={isRefetching}
          className="h-9 w-9 items-center justify-center rounded-full bg-pressed"
        >
          <Text className="text-ink">{isRefetching ? "…" : "↻"}</Text>
        </Pressable>

        <View className="flex-row items-center gap-1.5">
          <Text style={{ fontSize: 16 }}>🦋</Text>
          <Text className="font-headline text-base text-ink">Titli</Text>
        </View>

        <Link href="/topics" asChild>
          <Pressable className="h-9 px-4 items-center justify-center rounded-full border border-gold bg-pressed">
            <Text className="text-ink font-body text-sm">Topics</Text>
          </Pressable>
        </Link>
      </View>
    </View>
  );
}
