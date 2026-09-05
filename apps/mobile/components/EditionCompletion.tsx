import { useEffect } from "react";
import { Pressable, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import type { TodayEdition } from "@repo/api-client";
import { colors } from "@repo/tokens";

import { ButterflyMark } from "./icons";

const threadColors = [colors.peach, colors.lime, colors.lilac, colors.red, colors.sky, colors.jade, colors.sage];

export function EditionCompletion({
  edition,
  height,
  width,
  bottomInset,
  onStayCurious,
  onExplore,
}: {
  edition: TodayEdition;
  height: number;
  width: number;
  bottomInset: number;
  onStayCurious: () => void;
  onExplore: () => void;
}) {
  const reducedMotion = useReducedMotion();
  const drift = useSharedValue(0);
  const usableHeight = height - bottomInset;
  const cardWidth = Math.min(270, width * 0.69);
  const cardHeight = Math.min(340, Math.max(276, usableHeight * 0.54));
  const sideWidth = cardWidth * 0.9;
  const sideHeight = cardHeight * 0.9;
  const centerLeft = (width - cardWidth) / 2;
  const leftEdge = (width - sideWidth) / 2 - cardWidth * 0.34;
  const rightEdge = (width - sideWidth) / 2 + cardWidth * 0.34;

  useEffect(() => {
    if (reducedMotion) {
      drift.value = 0.5;
      return;
    }

    drift.value = withRepeat(
      withTiming(1, { duration: 4_200, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
    return () => cancelAnimation(drift);
  }, [drift, reducedMotion]);

  const leftStyle = useAnimatedStyle(() => ({
    opacity: 0.62 + drift.value * 0.12,
    transform: [
      { perspective: 900 },
      { translateY: 15 - drift.value * 9 },
      { rotateY: `${14 - drift.value * 5}deg` },
      { rotateZ: "-7deg" },
    ],
  }));
  const rightStyle = useAnimatedStyle(() => ({
    opacity: 0.74 - drift.value * 0.12,
    transform: [
      { perspective: 900 },
      { translateY: 6 + drift.value * 9 },
      { rotateY: `${-9 - drift.value * 5}deg` },
      { rotateZ: "7deg" },
    ],
  }));
  const centerStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 1_000 },
      { translateY: -4 + drift.value * 8 },
      { rotateZ: `${-0.6 + drift.value * 1.2}deg` },
    ],
  }));

  return (
    <View style={{ width, height, paddingBottom: bottomInset, backgroundColor: colors.ink }}>
      <View className="flex-1 items-center justify-center overflow-hidden bg-ink">
        <Animated.View entering={FadeIn.duration(700)} className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-plum opacity-20" />
        <Animated.View entering={FadeIn.delay(180).duration(700)} className="absolute -bottom-24 -right-20 h-64 w-64 rounded-full bg-red opacity-20" />

        <Animated.View entering={FadeInDown.duration(420)} className="absolute top-5 items-center">
          <Text className="font-label text-[11px] uppercase tracking-[1.8px] text-peach">
            Today&apos;s edition
          </Text>
          <View className="mt-2 flex-row gap-1.5">
            {threadColors.map((color) => (
              <View key={color} className="h-1.5 w-5 rounded-full" style={{ backgroundColor: color }} />
            ))}
          </View>
        </Animated.View>

        <View style={{ width, height: cardHeight + 50, marginTop: 24 }}>
          <Animated.View
            style={[
              {
                position: "absolute",
                left: leftEdge,
                top: 38,
                width: sideWidth,
                height: sideHeight,
                borderRadius: 28,
                overflow: "hidden",
                zIndex: 1,
              },
              leftStyle,
            ]}
          >
            <LinearGradient colors={[colors.sky, colors.jade]} className="justify-between p-5" style={{ flex: 1 }}>
              <Text className="font-label text-[11px] uppercase tracking-[1.4px] text-ink">01 / Anchor</Text>
              <View>
                <View className="mb-3 h-px w-16 bg-ink opacity-40" />
                <Text className="font-headline text-[24px] leading-7 text-ink">You showed up.</Text>
              </View>
            </LinearGradient>
          </Animated.View>

          <Animated.View
            style={[
              {
                position: "absolute",
                left: rightEdge,
                top: 38,
                width: sideWidth,
                height: sideHeight,
                borderRadius: 28,
                overflow: "hidden",
                zIndex: 1,
              },
              rightStyle,
            ]}
          >
            <LinearGradient colors={[colors.peach, colors.red]} className="justify-between p-5" style={{ flex: 1 }}>
              <Text className="text-right font-label text-[11px] uppercase tracking-[1.4px] text-ink">07 / Lift</Text>
              <View className="items-end">
                <View className="mb-3 h-px w-16 bg-ink opacity-40" />
                <Text className="text-right font-headline text-[24px] leading-7 text-ink">Now breathe.</Text>
              </View>
            </LinearGradient>
          </Animated.View>

          <Animated.View
            style={[
              {
                position: "absolute",
                left: centerLeft,
                top: 20,
                width: cardWidth,
                height: cardHeight,
                borderRadius: 30,
                overflow: "hidden",
                zIndex: 3,
                shadowColor: colors.ink,
                shadowOpacity: 0.38,
                shadowRadius: 28,
                shadowOffset: { width: 0, height: 18 },
                elevation: 14,
              },
              centerStyle,
            ]}
          >
            <LinearGradient
              colors={[colors.surface, colors.lilac]}
              start={{ x: 0.1, y: 0 }}
              end={{ x: 1, y: 1 }}
              className="items-center p-6"
              style={{ flex: 1 }}
            >
              <View className="w-full flex-row items-center justify-between">
                <Text className="font-label text-[11px] uppercase tracking-[1.4px] text-red">Edition complete</Text>
                <Text className="font-label text-[11px] tabular-nums text-muted">
                  {edition.cards.length}/{edition.cards.length}
                </Text>
              </View>
              <View className="mt-auto h-16 w-16 -rotate-3 items-center justify-center rounded-[22px] bg-red">
                <ButterflyMark size={34} color={colors.surface} />
              </View>
              <Text className="mt-5 text-center font-headline text-[36px] leading-[42px] text-ink">
                You did it.
              </Text>
              <Text className="mt-2 text-center font-body text-[16px] leading-[22px] text-muted">
                Seven stories. You&apos;re caught up.
              </Text>
              <View className="mt-auto h-1 w-12 rounded-full bg-red" />
            </LinearGradient>
          </Animated.View>
        </View>

        <Animated.View
          entering={FadeInDown.delay(320).duration(440)}
          style={{ position: "absolute", left: 20, right: 20, bottom: 20, flexDirection: "row", gap: 8 }}
        >
          <Pressable
            onPress={onStayCurious}
            accessibilityRole="button"
            className="min-h-11 flex-1 items-center justify-center rounded-full bg-peach px-4"
          >
            <Text className="font-label text-[12px] text-ink">Stay curious</Text>
          </Pressable>
          <Pressable
            onPress={onExplore}
            accessibilityRole="button"
            className="min-h-11 flex-1 items-center justify-center rounded-full border border-surface/40 px-4"
          >
            <Text className="font-label text-[12px] text-surface">Explore your mix</Text>
          </Pressable>
        </Animated.View>
      </View>
    </View>
  );
}
