import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  Text,
  Vibration,
  View,
  useWindowDimensions,
} from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import Animated, { FadeIn, FadeInDown, SlideInDown, SlideOutDown } from "react-native-reanimated";
import { isDataCard, type Topic } from "@repo/api-client";
import { colors, derived } from "@repo/tokens";

import { api } from "../../lib/api";
import { trackEvent } from "../../lib/analytics";
import { getCheckInFeedback, pressureFromDuration } from "../../lib/checkIn";
import { type ExploreMode, useExploreMode, useSetExploreMode } from "../../lib/exploreMode";
import { useSelectedTopics, useToggleTopic } from "../../lib/topicSelection";
import { ButterflyMark, CheckIcon, PulseIcon, SparkIcon } from "../../components/icons";
import { SwipeableTabScreen } from "../../components/SwipeableTabScreen";

const exploreCanvases = [colors.peach, colors.sky, colors.lilac, colors.lime, colors.sage];
const modeOptions: Array<{ id: ExploreMode; label: string; canvas: string }> = [
  { id: "Surprise me", label: "Surprise", canvas: colors.lilac },
  { id: "Useful", label: "Useful", canvas: colors.sage },
  { id: "Hopeful", label: "Hopeful", canvas: colors.lime },
  { id: "Debatable", label: "Debatable", canvas: colors.peach },
];

function orderScore(value: string, salt: string) {
  return [...`${salt}:${value}`].reduce(
    (total, character) => ((total * 31) + character.charCodeAt(0)) % 10_007,
    7,
  );
}

function arrangeTopics(topics: Topic[], mode: ExploreMode, selected: readonly string[]) {
  const selectedSet = new Set(selected);
  return [...topics].sort((a, b) => {
    const selectionDifference = Number(selectedSet.has(b.slug)) - Number(selectedSet.has(a.slug));
    return selectionDifference || orderScore(a.slug, mode) - orderScore(b.slug, mode);
  });
}

export default function Topics() {
  const router = useRouter();
  const { checkin } = useLocalSearchParams<{ checkin?: string }>();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const mode = useExploreMode();
  const setMode = useSetExploreMode();
  const [storyIndex, setStoryIndex] = useState(0);
  const [showAllTopics, setShowAllTopics] = useState(false);
  const [checkInOpen, setCheckInOpen] = useState(checkin === "1");
  const page = useRef<ScrollView>(null);
  const storyRail = useRef<ScrollView>(null);
  const storyOffset = useRef(0);
  const { data: topics = [], isPending: topicsPending } = useQuery({
    queryKey: ["topics"],
    queryFn: () => api.getTopics(),
  });
  const { data: cards = [], isPending: cardsPending } = useQuery({
    queryKey: ["feed", "explore"],
    queryFn: () => api.getFeed({}),
  });
  const { data: pulse = [] } = useQuery({
    queryKey: ["pulse"],
    queryFn: () => api.getPulse(),
  });
  const selected = useSelectedTopics();
  const toggle = useToggleTopic();
  const storyWidth = width - 36;
  const orderedTopics = arrangeTopics(topics, mode, selected);
  const visibleTopics = showAllTopics ? orderedTopics : orderedTopics.slice(0, 4);
  const orderedCards = [...cards].sort((a, b) => orderScore(a.slug, mode) - orderScore(b.slug, mode));
  const activeMode = modeOptions.find((item) => item.id === mode) ?? modeOptions[0]!;
  const pulseMetric = pulse[0];

  function chooseMode(nextMode: ExploreMode) {
    setMode(nextMode);
    setStoryIndex(0);
    storyRail.current?.scrollTo({ x: 0, animated: true });
  }

  function settleStoryRail(offset: number) {
    const maxIndex = Math.max(orderedCards.slice(0, 7).length - 1, 0);
    const next = Math.min(Math.max(Math.round(offset / (storyWidth + 12)), 0), maxIndex);
    setStoryIndex(next);
    storyRail.current?.scrollTo({ x: next * (storyWidth + 12), animated: true });
  }

  function chooseSofterMix() {
    chooseMode("Hopeful");
    setCheckInOpen(false);
    page.current?.scrollTo({ y: 0, animated: true });
  }

  return (
    <SwipeableTabScreen current="explore">
      <View className="bg-bg" style={{ flex: 1, minHeight: 0, overflow: "hidden" }}>
        <View
          className="flex-row items-center border-b border-hairline bg-surface px-[18px] pb-3"
          style={{ paddingTop: insets.top + 9 }}
        >
          <ButterflyMark size={25} color={colors.red} />
          <Text className="ml-2 font-headline text-[22px] leading-[30px] text-ink">TITLI</Text>
          <Text className="ml-auto font-label text-[11px] uppercase tracking-[2.2px] text-red">Explore</Text>
        </View>

        <Animated.View key={mode} entering={FadeIn.duration(320)} className="absolute inset-x-0 top-16 h-[360px]">
          <LinearGradient colors={[activeMode.canvas, colors.bg]} style={{ flex: 1 }} />
        </Animated.View>

        <ScrollView
          ref={page}
          style={{ flex: 1, minHeight: 0 }}
          showsVerticalScrollIndicator={false}
          scrollEnabled={!checkInOpen}
          contentContainerStyle={{ paddingBottom: 120 }}
        >
          <View className="px-[18px] pb-7 pt-5">
            <Text className="font-label text-[11px] uppercase tracking-[1.8px] text-red">Choose the tone</Text>
            <Text className="mt-2 font-headline text-[29px] leading-[36px] text-ink">What do you need now?</Text>

            <View className="flex-row gap-1.5 pb-0.5 pt-3">
              {modeOptions.map((item) => {
                const isOn = item.id === mode;
                return (
                  <Pressable
                    key={item.id}
                    onPress={() => chooseMode(item.id)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isOn }}
                    className="min-h-11 flex-1 flex-row items-center justify-center rounded-full border px-1"
                    style={{
                      borderColor: isOn ? colors.ink : derived.hairline,
                      backgroundColor: isOn ? colors.ink : item.canvas,
                    }}
                  >
                    {isOn ? <CheckIcon size={14} color={colors.surface} /> : null}
                    <Text
                      className="font-label text-[12px]"
                      style={{ marginLeft: isOn ? 4 : 0, color: isOn ? colors.surface : colors.ink }}
                    >
                      {item.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View className="mb-3 mt-6 flex-row items-end justify-between">
              <View>
                <Text className="font-label text-[11px] uppercase tracking-[1.8px] text-red">For this mood</Text>
                <Text className="mt-1 font-headline text-[27px] leading-[34px] text-ink">Start with this.</Text>
              </View>
              <Text className="font-label text-[11px] tabular-nums text-muted">
                {String(orderedCards.length === 0 ? 0 : Math.min(storyIndex + 1, orderedCards.length)).padStart(2, "0")}/
                {String(Math.min(orderedCards.length, 7)).padStart(2, "0")}
              </Text>
            </View>

            {cardsPending ? (
              <View className="h-48 items-center justify-center"><ActivityIndicator color={colors.red} /></View>
            ) : (
              <Animated.View key={mode} entering={FadeIn.duration(300)}>
                <ScrollView
                  ref={storyRail}
                  horizontal
                  nestedScrollEnabled
                  directionalLockEnabled
                  showsHorizontalScrollIndicator={false}
                  snapToInterval={storyWidth + 12}
                  decelerationRate="fast"
                  disableIntervalMomentum
                  scrollEventThrottle={16}
                  onScroll={(event) => { storyOffset.current = event.nativeEvent.contentOffset.x; }}
                  onTouchEnd={() => settleStoryRail(storyOffset.current)}
                  onScrollEndDrag={(event) => settleStoryRail(event.nativeEvent.contentOffset.x)}
                  onMomentumScrollEnd={(event) => settleStoryRail(event.nativeEvent.contentOffset.x)}
                  contentContainerStyle={{ gap: 12 }}
                >
                  {orderedCards.slice(0, 7).map((card, index) => (
                    <View key={card.id} style={{ width: storyWidth, minWidth: storyWidth, flexShrink: 0, aspectRatio: 16 / 9 }}>
                      <Pressable
                        onPress={() => router.push(`/card/${card.slug}`)}
                        accessibilityRole="button"
                        accessibilityLabel={`Read ${card.headline}`}
                        className="overflow-hidden rounded-[24px] bg-ink"
                        style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0 }}
                      >
                        {isDataCard(card) && card.metric ? (
                          <LinearGradient
                            colors={[exploreCanvases[index % exploreCanvases.length]!, colors.plum]}
                            style={{ width: "100%", height: "100%", paddingHorizontal: 20, paddingTop: 16 }}
                          >
                            <Text className="font-headline text-[46px] leading-[56px] text-ink">{card.metric.value}{card.metric.unit}</Text>
                          </LinearGradient>
                        ) : (
                          <Image
                            source={{ uri: card.image.url }}
                            placeholder={{ uri: card.image.blurDataURL }}
                            contentFit="cover"
                            style={{ width: "100%", height: "100%" }}
                            accessibilityLabel={card.image.alt}
                          />
                        )}
                        <LinearGradient
                          pointerEvents="none"
                          colors={["transparent", derived.scrim]}
                          style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0, justifyContent: "flex-end", paddingHorizontal: 20, paddingBottom: 16 }}
                        >
                          <Text className="font-label text-[11px] uppercase tracking-[1.4px] text-peach">{card.primaryGenre?.title ?? "From Titli"}</Text>
                          <Text className="mt-1 font-headline text-[21px] leading-[27px] text-surface" numberOfLines={2}>{card.headline}</Text>
                        </LinearGradient>
                      </Pressable>
                    </View>
                  ))}
                </ScrollView>
              </Animated.View>
            )}
          </View>

          <View className="border-y border-hairline bg-surface px-[18px] py-6">
            <View className="flex-row items-end justify-between">
              <View className="max-w-[76%]">
                <Text className="font-label text-[11px] uppercase tracking-[1.8px] text-red">Make it yours</Text>
                <Text className="mt-1 font-headline text-[27px] leading-[34px] text-ink">Topics worth keeping close.</Text>
              </View>
              <Text className="pb-1 font-label text-[11px] text-muted">{selected.length} followed</Text>
            </View>

            {topicsPending ? (
              <ActivityIndicator color={colors.red} style={{ marginTop: 30 }} />
            ) : (
              <View className="mt-4 gap-2">
                {visibleTopics.map((topic, index) => {
                  const isOn = selected.includes(topic.slug);
                  return (
                    <Animated.View key={topic.id} entering={FadeInDown.delay(index * 35).duration(260)}>
                      <Pressable
                        onPress={() => {
                          toggle(topic.slug);
                          trackEvent(isOn ? "genre_unfollow" : "genre_follow", { topicSlug: topic.slug });
                        }}
                        accessibilityRole="button"
                        accessibilityState={{ selected: isOn }}
                        className="min-h-[64px] flex-row items-center overflow-hidden rounded-[18px] px-4 py-2.5"
                        style={({ pressed }) => ({
                          marginLeft: index % 3 === 1 ? 12 : 0,
                          marginRight: index % 3 === 2 ? 16 : 0,
                          backgroundColor: isOn ? colors.ink : exploreCanvases[index % exploreCanvases.length],
                          opacity: pressed ? 0.74 : 1,
                        })}
                      >
                        <View className="min-w-0 flex-1">
                          <Text className="font-headline text-[19px] leading-6" style={{ color: isOn ? colors.surface : colors.ink }}>{topic.title}</Text>
                          {topic.shortDescription ? (
                            <Text className="font-body text-[12px] leading-4" style={{ color: isOn ? colors.sage : colors.muted }} numberOfLines={1}>{topic.shortDescription}</Text>
                          ) : null}
                        </View>
                        <View className="ml-3 h-11 w-11 items-center justify-center rounded-full border" style={{ borderColor: isOn ? colors.surface : colors.ink }}>
                          {isOn ? <CheckIcon size={14} color={colors.surface} /> : <Text className="font-label text-[20px] text-ink">+</Text>}
                        </View>
                      </Pressable>
                    </Animated.View>
                  );
                })}
                {orderedTopics.length > 4 ? (
                  <Pressable onPress={() => setShowAllTopics((current) => !current)} className="mt-2 min-h-11 items-center justify-center rounded-full border border-hairline" accessibilityRole="button">
                    <Text className="font-label text-[12px] text-ink">{showAllTopics ? "Show fewer" : "See all topics"}</Text>
                  </Pressable>
                ) : null}
              </View>
            )}
          </View>

          <View className="bg-bg px-[18px] pb-7 pt-6">
            <Text className="font-label text-[11px] uppercase tracking-[1.8px] text-red">Live and private</Text>
            <Text className="mt-1 font-headline text-[27px] leading-[34px] text-ink">Check in, your way.</Text>

            <Pressable onPress={() => router.push("/pulse")} accessibilityRole="button" className="mt-4 min-h-[82px] flex-row items-center rounded-[22px] bg-lime px-4 py-3" style={({ pressed }) => ({ opacity: pressed ? 0.76 : 1 })}>
              <View className="h-11 w-11 items-center justify-center rounded-[15px] bg-surface/60"><PulseIcon size={23} color={colors.ink} /></View>
              <View className="ml-3 min-w-0 flex-1">
                <Text className="font-label text-[11px] uppercase tracking-[1.3px] text-red">Women&apos;s Pulse</Text>
                <Text className="font-headline text-[18px] leading-6 text-ink" numberOfLines={1}>{pulseMetric?.label ?? "See what is moving"}</Text>
              </View>
              {pulseMetric ? (
                <View className="ml-3 items-end">
                  <Text className="font-headline text-[23px] leading-7 text-ink">{pulseMetric.value.toLocaleString("en-IN")}</Text>
                  <Text className="font-body text-[10px] text-muted" numberOfLines={1}>{pulseMetric.unit}</Text>
                </View>
              ) : null}
            </Pressable>

            <Pressable onPress={() => setCheckInOpen(true)} accessibilityRole="button" className="mt-3 min-h-[82px] flex-row items-center overflow-hidden rounded-[22px] bg-ink px-4 py-3" style={({ pressed }) => ({ opacity: pressed ? 0.82 : 1 })}>
              <LinearGradient pointerEvents="none" colors={[colors.plum, colors.ink]} className="absolute inset-0 opacity-60" />
              <View className="h-11 w-11 items-center justify-center rounded-[15px] bg-surface/10"><SparkIcon size={22} color={colors.peach} /></View>
              <View className="ml-3 min-w-0 flex-1">
                <Text className="font-label text-[11px] uppercase tracking-[1.3px] text-peach">Shhh... / private</Text>
                <Text className="font-headline text-[19px] leading-6 text-surface">How heavy is today?</Text>
              </View>
              <Text className="font-label text-[12px] text-lilac">Open</Text>
            </Pressable>
          </View>
        </ScrollView>

        <PrivateCheckInSheet open={checkInOpen} onClose={() => setCheckInOpen(false)} onChooseSofter={chooseSofterMix} />
      </View>
    </SwipeableTabScreen>
  );
}

function PrivateCheckInSheet({ open, onClose, onChooseSofter }: { open: boolean; onClose: () => void; onChooseSofter: () => void }) {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const [pressure, setPressure] = useState(0);
  const [isPressing, setIsPressing] = useState(false);
  const [hasCheckedIn, setHasCheckedIn] = useState(false);
  const pressing = useRef(false);
  const startedAt = useRef(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => { if (timer.current) clearInterval(timer.current); }, []);

  useEffect(() => {
    if (open) return;
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
    pressing.current = false;
    setIsPressing(false);
  }, [open]);

  function startPress() {
    if (timer.current) clearInterval(timer.current);
    startedAt.current = Date.now();
    setPressure(0);
    setHasCheckedIn(false);
    pressing.current = true;
    setIsPressing(true);
    timer.current = setInterval(() => {
      const next = pressureFromDuration(Date.now() - startedAt.current);
      setPressure(next);
      if (next === 1 && timer.current) {
        clearInterval(timer.current);
        timer.current = null;
      }
    }, 40);
  }

  function finishPress() {
    if (!pressing.current) return;
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
    setPressure(pressureFromDuration(Date.now() - startedAt.current));
    pressing.current = false;
    setIsPressing(false);
    setHasCheckedIn(true);
    Vibration.vibrate(18);
  }

  const percentage = Math.round(pressure * 100);
  const feedback = getCheckInFeedback(pressure);
  const progressColor = pressure < 0.34 ? colors.plum : pressure < 0.68 ? colors.red : colors.lime;
  const sheetHeight = Math.min(590, Math.max(500, height * 0.7));

  return (
    <Modal visible={open} transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: "flex-end" }}>
        <Pressable accessibilityLabel="Close private check-in" onPress={onClose} className="absolute inset-0 bg-ink/60" />
        <Animated.View
          entering={SlideInDown.springify().damping(19).stiffness(150)}
          exiting={SlideOutDown.duration(240)}
          style={{ height: sheetHeight, overflow: "hidden", borderTopLeftRadius: 36, borderTopRightRadius: 36, backgroundColor: colors.surface, paddingHorizontal: 18, paddingTop: 16, paddingBottom: insets.bottom + 18 }}
        >
          <View className="mb-3 h-1 w-10 self-center rounded-full bg-hairline" />
          <View className="flex-row items-start justify-between">
            <View className="min-w-0 flex-1 pr-3">
              <Text className="font-label text-[11px] uppercase tracking-[1.6px] text-red">Private on this device</Text>
              <Text className="mt-1 font-headline text-[29px] leading-[36px] text-ink">How heavy is today?</Text>
            </View>
            <Pressable onPress={onClose} className="h-11 min-w-11 items-center justify-center px-2" accessibilityRole="button"><Text className="font-label text-[12px] text-muted">Close</Text></Pressable>
          </View>

          <Pressable
            accessibilityRole="adjustable"
            accessibilityLabel="Touch to describe how heavy today feels"
            accessibilityHint="Keep touching as the colour deepens, then release"
            accessibilityValue={{ min: 0, max: 100, now: percentage }}
            onPressIn={startPress}
            onPressOut={finishPress}
            className="mt-4 h-48 overflow-hidden rounded-[26px]"
          >
            <LinearGradient colors={[colors.sky, colors.lilac]} style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0 }} />
            <Animated.View style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0, opacity: pressure }}><LinearGradient colors={[colors.peach, colors.plum]} style={{ flex: 1 }} /></Animated.View>
            <Animated.View style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0, opacity: Math.max(0, (pressure - 0.55) / 0.45) }}><LinearGradient colors={[colors.red, colors.ink]} style={{ flex: 1 }} /></Animated.View>
            <View className="flex-1 justify-between p-5">
              <Text className="font-label text-[11px] uppercase tracking-[1.4px] text-ink/70">{isPressing ? "Let the colour deepen" : "Touch the colour"}</Text>
              <Text className="font-headline text-[54px] leading-[62px] tabular-nums" style={{ color: pressure > 0.62 ? colors.surface : colors.ink }}>{percentage}%</Text>
            </View>
          </Pressable>

          <View className="mt-4 h-1.5 overflow-hidden rounded-full bg-hairline"><View className="h-full rounded-full" style={{ width: `${Math.max(percentage, 2)}%`, backgroundColor: progressColor }} /></View>
          <View className="mt-2 flex-row justify-between">
            <Text className="font-label text-[11px] uppercase tracking-[1.2px] text-muted">Light</Text>
            <Text className="font-label text-[11px] uppercase tracking-[1.2px] text-muted">Heavy</Text>
          </View>

          <View className="mt-4 min-h-[92px] justify-center border-t border-hairline pt-3">
            {hasCheckedIn ? (
              <Animated.View entering={FadeInDown.duration(260)}>
                <Text className="font-headline text-[20px] leading-7 text-ink">{feedback.label}</Text>
                <Text className="font-body text-[13px] leading-[18px] text-muted">{feedback.message}</Text>
                <Pressable onPress={feedback.band === "light" ? onClose : onChooseSofter} className="mt-3 min-h-11 items-center justify-center rounded-full bg-ink px-5" accessibilityRole="button">
                  <Text className="font-label text-[12px] text-surface">{feedback.band === "light" ? "Keep this pace" : "Show me something hopeful"}</Text>
                </Pressable>
              </Animated.View>
            ) : (
              <Text className="font-body text-[13px] text-muted">Nothing is saved or shared.</Text>
            )}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}
