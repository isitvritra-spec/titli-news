import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  Extrapolation,
  FadeInDown,
  interpolate,
  runOnJS,
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { isDataCard, type HotStory } from "@repo/api-client";
import { colors } from "@repo/tokens";

import { ButterflyMark } from "./icons";
import { selectBalancedHotStories } from "../lib/contentBalance";

const canvases = [colors.sky, colors.peach, colors.lilac, colors.lime, colors.sage];
export function MoreNews({
  stories,
  width,
  height,
  bottomInset,
}: {
  stories: HotStory[];
  width: number;
  height: number;
  bottomInset: number;
}) {
  const router = useRouter();
  const visibleStories = selectBalancedHotStories(stories, 5);
  const cardWidth = Math.min(292, width * 0.75);
  const slotWidth = cardWidth * 0.74;
  const usableHeight = height - bottomInset;
  const cardHeight = Math.min(304, Math.max(250, usableHeight * 0.46));
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollX = useSharedValue(0);
  const dragOrigin = useSharedValue(0);
  const maxOffset = Math.max(visibleStories.length - 1, 0) * slotWidth;
  const deckGesture = Gesture.Pan()
    .activeOffsetX([-14, 14])
    .failOffsetY([-14, 14])
    .onBegin(() => {
      dragOrigin.value = scrollX.value;
    })
    .onUpdate((event) => {
      scrollX.value = Math.min(Math.max(dragOrigin.value - event.translationX, 0), maxOffset);
    })
    .onEnd(() => {
      const next = Math.min(Math.max(Math.round(scrollX.value / slotWidth), 0), visibleStories.length - 1);
      scrollX.value = withTiming(next * slotWidth, { duration: 260 });
      runOnJS(setActiveIndex)(next);
    });
  const railStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: -scrollX.value }],
  }));

  return (
    <View style={{ width, height, paddingBottom: bottomInset, backgroundColor: colors.surface }}>
      <View className="flex-1 overflow-hidden bg-surface pb-4 pt-5">
        <Animated.View entering={FadeInDown.duration(380)} className="px-5">
          <View className="flex-row items-center justify-between">
            <Text className="font-label text-[11px] uppercase tracking-[1.6px] text-red">
              Beyond today&apos;s seven
            </Text>
            <ButterflyMark size={23} color={colors.red} />
          </View>
          <Text className="mt-1 font-headline text-[32px] leading-[42px] text-ink">
            Worth staying for.
          </Text>
          <Text className="max-w-[330px] font-body text-[14px] leading-5 text-muted" numberOfLines={2}>
            Stories readers stayed with, not the ones with the loudest clicks.
          </Text>
        </Animated.View>

        {visibleStories.length > 0 ? (
          <View className="justify-start pt-5" style={{ height: cardHeight + 64 }}>
            {visibleStories.length > 1 && activeIndex === 0 ? (
              <SidePreviewCard
                story={visibleStories[visibleStories.length - 1]!}
                width={cardWidth}
                height={cardHeight}
              />
            ) : null}
            <GestureDetector gesture={deckGesture}>
              <View style={{ width, height: cardHeight + 44, overflow: "hidden", zIndex: 2 }}>
                <Animated.View style={[{ width: width + maxOffset, height: cardHeight + 40 }, railStyle]}>
                  {visibleStories.map((item, index) => (
                    <StoryDeckCard
                      key={`${item.card.id}-${index}`}
                      story={item}
                      index={index}
                      displayIndex={index}
                      scrollX={scrollX}
                      slotWidth={slotWidth}
                      deckWidth={width}
                      width={cardWidth}
                      height={cardHeight}
                      isActive={index === activeIndex}
                      onPress={() => router.push(`/card/${item.card.slug}`)}
                    />
                  ))}
                </Animated.View>
              </View>
            </GestureDetector>
          </View>
        ) : (
          <View className="mx-5 my-5 flex-1 items-center justify-center rounded-[28px] bg-sky px-7">
            <Text className="text-center font-headline text-[24px] leading-[30px] text-ink">
              The reading room is warming up.
            </Text>
            <Text className="mt-2 text-center font-body text-[14px] leading-5 text-muted">
              More carefully selected stories will appear as readers spend time with them.
            </Text>
          </View>
        )}

        <Pressable
          onPress={() => router.push("/(tabs)/topics")}
          className="mx-5 min-h-11 items-center justify-center rounded-full bg-red px-5"
        >
          <Text className="font-label text-[12px] text-surface">Explore what matters to you</Text>
        </Pressable>
      </View>
    </View>
  );
}

function SidePreviewCard({ story, width, height }: { story: HotStory; width: number; height: number }) {
  return (
    <View
      pointerEvents="none"
      style={{
        position: "absolute",
        left: -width * 0.62,
        top: "50%",
        width,
        height,
        marginTop: -height / 2,
        borderRadius: 28,
        overflow: "hidden",
        opacity: 0.68,
        transform: [{ translateY: 18 }, { scale: 0.84 }, { rotate: "-5deg" }],
        zIndex: 1,
      }}
    >
      <LinearGradient colors={[colors.peach, colors.surface]} style={{ flex: 1, padding: 20 }}>
        <Text className="font-label text-[11px] uppercase tracking-[1.2px] text-ink" numberOfLines={1}>
          {story.reason}
        </Text>
        <Text className="mt-5 font-headline text-[22px] leading-[28px] text-ink" numberOfLines={2}>
          {story.card.headline}
        </Text>
      </LinearGradient>
    </View>
  );
}

function StoryDeckCard({
  story,
  index,
  displayIndex,
  scrollX,
  slotWidth,
  deckWidth,
  width,
  height,
  isActive,
  onPress,
}: {
  story: HotStory;
  index: number;
  displayIndex: number;
  scrollX: SharedValue<number>;
  slotWidth: number;
  deckWidth: number;
  width: number;
  height: number;
  isActive: boolean;
  onPress: () => void;
}) {
  const card = story.card;
  const isData = isDataCard(card);
  const canvas = canvases[displayIndex % canvases.length];
  const animatedStyle = useAnimatedStyle(() => {
    const center = index * slotWidth;
    const input = [center - slotWidth, center, center + slotWidth];
    const distance = Math.min(Math.abs(scrollX.value - center) / slotWidth, 1);

    return {
      zIndex: Math.round(20 - distance * 10),
      opacity: interpolate(scrollX.value, input, [0.7, 1, 0.7], Extrapolation.CLAMP),
      transform: [
        { perspective: 900 },
        {
          translateX: interpolate(
            scrollX.value,
            input,
            [width * 0.1, 0, width * -0.1],
            Extrapolation.CLAMP,
          ),
        },
        { translateY: interpolate(scrollX.value, input, [18, 0, 18], Extrapolation.CLAMP) },
        { scale: interpolate(scrollX.value, input, [0.84, 1, 0.84], Extrapolation.CLAMP) },
        {
          rotateY: `${interpolate(scrollX.value, input, [12, 0, -12], Extrapolation.CLAMP)}deg`,
        },
      ],
    };
  });

  return (
    <View
      style={{
        width: slotWidth,
        height: height + 40,
        position: "absolute",
        left: (deckWidth - slotWidth) / 2 + index * slotWidth,
        alignItems: "center",
        justifyContent: "center",
        zIndex: isActive ? 30 : 1,
      }}
    >
      <Animated.View
        style={[
          {
            width,
            height,
            borderRadius: 28,
            overflow: "hidden",
            shadowColor: colors.ink,
            shadowOpacity: 0.16,
            shadowRadius: 20,
            shadowOffset: { width: 0, height: 12 },
            elevation: 8,
          },
          animatedStyle,
        ]}
      >
        <LinearGradient
          colors={[canvas, colors.surface]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="p-5"
          style={{ flex: 1 }}
        >
            <View className="flex-row items-start justify-between">
              <Text className="font-label text-[11px] uppercase tracking-[1.2px] text-ink" numberOfLines={1}>
                {story.reason}
              </Text>
              {isData && card.metric ? (
                <Text className="ml-2 font-headline text-[20px] leading-6 text-ink">
                  {card.metric.value}{card.metric.unit}
                </Text>
              ) : (
                <Text className="ml-2 font-label text-[11px] tabular-nums text-muted">0{displayIndex + 1}</Text>
              )}
            </View>
            <Text className="mt-4 font-headline text-[21px] leading-[26px] text-ink" numberOfLines={3}>
              {card.headline}
            </Text>
            <Text className="mt-2 font-body text-[13px] leading-[18px] text-muted" numberOfLines={3}>
              {card.body}
            </Text>
            <View className="mt-auto flex-row items-center justify-between border-t border-hairline pt-2">
              <Text className="font-label text-[11px] text-ink">
                {story.averageDwellSeconds > 0 ? `${story.averageDwellSeconds}s read` : "Fresh from Titli"}
              </Text>
              <Pressable
                onPress={onPress}
                className="min-h-11 min-w-11 items-center justify-center rounded-full bg-ink px-3"
                aria-label={`Open ${card.headline}`}
              >
                <Text className="font-label text-[11px] text-surface">Open</Text>
              </Pressable>
            </View>
        </LinearGradient>
      </Animated.View>
    </View>
  );
}
