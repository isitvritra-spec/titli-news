import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { useQuery } from "@tanstack/react-query";

import { colors } from "@repo/tokens";
import { api } from "../../lib/api";
import { useSelectedTopics, useToggleTopic } from "../../lib/topicSelection";
import { CheckIcon } from "../../components/icons";

export default function Topics() {
  const { data: topics, isPending } = useQuery({
    queryKey: ["topics"],
    queryFn: () => api.getTopics(),
  });
  const selected = useSelectedTopics();
  const toggle = useToggleTopic();

  return (
    <View className="flex-1 bg-bg pt-6">
      <Text className="font-headline text-title text-ink px-4 mb-1">Topics</Text>
      <Text className="text-caption text-muted font-body px-4 mb-4">
        Pick what you want to follow. Leave everything off to see it all.
      </Text>

      {isPending ? (
        <ActivityIndicator color={colors.gold} style={{ marginTop: 24 }} />
      ) : (
        <ScrollView contentContainerClassName="pb-10">
          {topics?.map((topic) => {
            const isOn = selected.includes(topic.slug);
            return (
              <Pressable
                key={topic.id}
                onPress={() => toggle(topic.slug)}
                aria-selected={isOn}
                className="flex-row items-center justify-between px-4 py-4 border-b border-hairline"
              >
                <View className="flex-1 pr-4">
                  <Text className={`font-label text-label ${isOn ? "text-gold" : "text-muted"}`}>
                    {topic.title}
                  </Text>
                  {topic.shortDescription ? (
                    <Text className="text-caption text-muted font-body mt-0.5">
                      {topic.shortDescription}
                    </Text>
                  ) : null}
                </View>
                {isOn ? <CheckIcon size={16} color={colors.gold} /> : null}
              </Pressable>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}
