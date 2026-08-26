import { Linking, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";

import { api } from "../lib/api";
import { trackEvent } from "../lib/analytics";

export function WomenPulse() {
  const insets = useSafeAreaInsets();
  const { data: metrics } = useQuery({
    queryKey: ["pulse"],
    queryFn: () => api.getPulse(),
    staleTime: 60 * 60 * 1000,
  });

  if (!metrics || metrics.length === 0) return null;

  return (
    <View
      className="shrink-0 border-b border-hairline bg-surface pb-3"
      style={{ paddingTop: insets.top + 8 }}
    >
      <View className="mb-2 flex-row items-baseline justify-between px-4">
        <Text className="font-headline text-label text-ink">Women&apos;s Pulse</Text>
        <Text className="font-body text-caption text-muted">Reality and progress</Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="gap-2 px-4"
      >
        {metrics.map((metric) => (
          <Pressable
            key={metric.key}
            onPress={() => {
              trackEvent("pulse_open", { topicSlug: metric.kind });
              if (metric.sourceUrl.startsWith("http")) void Linking.openURL(metric.sourceUrl);
            }}
            className="w-52 rounded-xl border border-hairline bg-bg px-3 py-2"
            accessibilityRole="button"
            accessibilityLabel={`${metric.label}: ${metric.value} ${metric.unit}, ${metric.periodLabel}`}
          >
            <Text
              className={`font-body text-caption ${
                metric.kind === "safety" ? "text-muted" : "text-gold"
              }`}
            >
              {metric.label}
            </Text>
            <Text className="mt-0.5 font-headline text-title text-ink">
              {metric.value.toLocaleString("en-IN")}
            </Text>
            <Text className="font-body text-caption text-muted" numberOfLines={1}>
              {metric.unit} · {metric.periodLabel}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}
