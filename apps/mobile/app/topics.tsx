import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { useQuery } from "@tanstack/react-query";

import { api } from "../lib/api";
import { useSelectedTopics, useToggleTopic } from "../lib/topicSelection";

export default function Topics() {
  const { data: topics, isPending } = useQuery({
    queryKey: ["topics"],
    queryFn: () => api.getTopics(),
  });
  const selected = useSelectedTopics();
  const toggle = useToggleTopic();

  return (
    <View className="flex-1 bg-bg pt-6">
      <Text className="font-headline text-2xl text-ink px-5 mb-1">Topics</Text>
      <Text className="text-sm text-muted px-5 mb-4">
        Pick what you want to follow. Leave everything off to see it all.
      </Text>

      {isPending ? (
        <ActivityIndicator color="#E4A069" style={{ marginTop: 24 }} />
      ) : (
        <ScrollView contentContainerClassName="px-5 pb-10">
          {topics?.map((topic) => {
            const isOn = selected.includes(topic.slug);
            return (
              <Pressable
                key={topic.id}
                onPress={() => toggle(topic.slug)}
                className="flex-row items-center justify-between py-4 border-b border-hairline"
              >
                <View className="flex-1 pr-4">
                  <Text className="text-base text-ink font-body">{topic.title}</Text>
                  {topic.shortDescription ? (
                    <Text className="text-xs text-muted font-body mt-0.5">
                      {topic.shortDescription}
                    </Text>
                  ) : null}
                </View>
                <View
                  className={`h-6 w-6 rounded-full border items-center justify-center ${
                    isOn ? "bg-gold border-gold" : "border-hairline"
                  }`}
                >
                  {isOn ? <Text className="text-bg text-xs">✓</Text> : null}
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}
