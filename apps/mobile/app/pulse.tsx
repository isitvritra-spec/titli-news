import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View, useWindowDimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import Animated, { FadeInDown } from "react-native-reanimated";
import { colors, derived } from "@repo/tokens";

import { api } from "../lib/api";
import { trackEvent } from "../lib/analytics";
import { openExternalUrl } from "../lib/openExternalUrl";
import { ChevronLeftIcon, PulseIcon } from "../components/icons";

const pulseCanvases = [
  [colors.lime, colors.sage],
  [colors.lilac, colors.peach],
  [colors.sky, colors.sage],
] as const;

export default function Pulse() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const [activeIndex, setActiveIndex] = useState(0);
  const pulseRail = useRef<ScrollView>(null);
  const { data: metrics = [], isPending } = useQuery({
    queryKey: ["pulse"],
    queryFn: () => api.getPulse(),
  });
  const posterWidth = width - 36;
  const posterHeight = Math.min(500, Math.max(420, height - insets.top - 250));

  function settlePulse(offset: number) {
    const next = Math.min(Math.max(Math.round(offset / (posterWidth + 12)), 0), Math.max(metrics.length - 1, 0));
    setActiveIndex(next);
    pulseRail.current?.scrollTo({ x: next * (posterWidth + 12), animated: true });
  }

  useEffect(() => {
    trackEvent("pulse_open");
  }, []);

  return (
    <View className="flex-1 bg-bg">
      <View
        className="flex-row items-center border-b bg-surface px-[18px] pb-3"
        style={{ paddingTop: insets.top + 10, borderBottomColor: derived.hairline }}
      >
        <Pressable
          onPress={() => router.back()}
          className="h-11 w-11 items-center justify-center rounded-full bg-surface2"
          aria-label="Close Pulse"
        >
          <ChevronLeftIcon size={20} color={colors.ink} />
        </Pressable>
        <View className="ml-3 min-w-0 flex-1">
        <Text className="font-label text-[11px] uppercase tracking-[1.6px] text-red">Women&apos;s Pulse</Text>
          <Text className="font-headline text-[25px] leading-8 text-ink">One signal at a time</Text>
        </View>
        <View className="h-11 w-11 items-center justify-center rounded-[15px] bg-lime">
          <PulseIcon size={23} color={colors.ink} />
        </View>
      </View>

      <View className="px-[18px] pb-3 pt-5">
        <Text className="font-headline text-[22px] leading-7 text-ink">Progress, context, and what still needs attention.</Text>
        <Text className="mt-1 font-body text-[13px] leading-5 text-muted">One sourced signal at a time. Swipe sideways for the next.</Text>
      </View>

      {isPending ? (
        <ActivityIndicator color={colors.red} style={{ marginTop: 64 }} />
      ) : (
        <>
          <ScrollView
            ref={pulseRail}
            horizontal
            nestedScrollEnabled
            directionalLockEnabled
            showsHorizontalScrollIndicator={false}
            decelerationRate="fast"
            disableIntervalMomentum
            snapToInterval={posterWidth + 12}
            contentContainerStyle={{ paddingHorizontal: 18, gap: 12, paddingBottom: 12 }}
            onScrollEndDrag={(event) => settlePulse(event.nativeEvent.contentOffset.x)}
            onMomentumScrollEnd={(event) => {
              settlePulse(event.nativeEvent.contentOffset.x);
            }}
          >
            {metrics.map((metric, index) => {
              const canvas = pulseCanvases[index % pulseCanvases.length]!;
              return (
                <Animated.View
                  key={metric.key}
                  entering={FadeInDown.delay(index * 70).duration(380)}
                  style={{ width: posterWidth, height: posterHeight, borderRadius: 30, overflow: "hidden" }}
                >
                  <LinearGradient
                    colors={canvas}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{ flex: 1, padding: 24 }}
                  >
                    <View className="flex-row items-center justify-between">
                      <Text className="font-label text-[11px] uppercase tracking-[1.5px] text-red">
                        {metric.kind === "safety" ? "Safety signal" : "Progress signal"}
                      </Text>
                      <Text className="font-label text-[11px] text-muted">{metric.periodLabel}</Text>
                    </View>

                    <View className="mt-auto">
                      <Text className="font-headline text-[64px] leading-[72px] text-ink" style={{ fontVariant: ["tabular-nums"] }}>
                        {metric.value.toLocaleString("en-IN")}
                      </Text>
                      <Text className="font-label text-[12px] text-ink">{metric.unit}</Text>
                      <View className="my-5 h-px bg-ink opacity-30" />
                      <Text className="font-headline text-[27px] leading-[34px] text-ink">{metric.label}</Text>
                      <Text className="mt-2 font-body text-[13px] leading-5 text-muted" numberOfLines={3}>
                        {metric.methodology}
                      </Text>
                      <Pressable
                        onPress={() => void openExternalUrl(metric.sourceUrl)}
                        className="mt-5 min-h-11 self-start justify-center border-b border-ink"
                      >
                        <Text className="font-label text-[11px] text-ink">Source / {metric.sourceName}</Text>
                      </Pressable>
                    </View>
                  </LinearGradient>
                </Animated.View>
              );
            })}
          </ScrollView>

          <View className="mt-1 flex-row items-center justify-center gap-1.5">
            {metrics.map((metric, index) => (
              <View
                key={metric.key}
                className="h-1.5 rounded-full"
                style={{ width: index === activeIndex ? 24 : 6, backgroundColor: index === activeIndex ? colors.red : derived.hairline }}
              />
            ))}
          </View>
        </>
      )}
    </View>
  );
}
