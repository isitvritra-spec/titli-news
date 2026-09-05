import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";

import { colors } from "@repo/tokens";
import { useMarkOnboardingSeen } from "../lib/onboarding";
import { api } from "../lib/api";
import { useSelectedTopics, useToggleTopic } from "../lib/topicSelection";
import { ButterflyMark, BarChartIcon, TagIcon } from "../components/icons";

const SLIDES = [
  {
    Icon: (props: { size: number; color: string }) => <ButterflyMark {...props} />,
    eyebrow: "Your morning drop",
    title: "Your 7, no noise.",
    body: "Know what changed, why it matters to you, and what to do next. Then get on with your day.",
    canvas: colors.peach,
  },
  {
    Icon: (props: { size: number; color: string }) => <BarChartIcon {...props} />,
    eyebrow: "Receipts, always",
    title: "Know it. Check it.",
    body: "Every claim keeps its source close. If Titli cannot verify it, Titli does not publish it.",
    canvas: colors.lime,
  },
  {
    Icon: (props: { size: number; color: string }) => <TagIcon {...props} />,
    eyebrow: "No algorithm mystery",
    title: "Choose your signal.",
    body: "Pick at least three topics. Essential stories stay, and your daily mix starts feeling like yours.",
    canvas: colors.lilac,
  },
];

const topicCanvases = [colors.sky, colors.peach, colors.lime, colors.sage, colors.lilac];

export default function Onboarding() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const markSeen = useMarkOnboardingSeen();
  const [step, setStep] = useState(0);
  const selectedTopics = useSelectedTopics();
  const toggleTopic = useToggleTopic();
  const { data: topics } = useQuery({ queryKey: ["topics"], queryFn: () => api.getTopics() });
  const slide = SLIDES[step]!;

  async function finish() {
    await markSeen();
    router.replace("/(tabs)");
  }

  function next() {
    if (step >= SLIDES.length - 1) {
      if (selectedTopics.length >= 3) void finish();
      return;
    }
    setStep((current) => current + 1);
  }

  return (
    <View className="flex-1 bg-bg" style={{ paddingTop: insets.top + 12 }}>
      <View className="flex-row items-center px-5 pb-4">
        <ButterflyMark size={23} color={colors.red} />
        <Text className="ml-2 font-label text-[12px] uppercase tracking-[2px] text-ink">Titli</Text>
        <Text className="ml-auto font-body text-caption text-muted">0{step + 1} / 03</Text>
        <Pressable onPress={() => void finish()} className="ml-3 min-h-11 min-w-11 items-center justify-center rounded-full border border-hairline px-3">
          <Text className="font-label text-[12px] text-muted">Skip</Text>
        </Pressable>
      </View>

      <View className="min-h-0 flex-1 px-4">
        <View
          className="relative overflow-hidden rounded-[32px] border border-hairline p-6"
          style={{ minHeight: step === 2 ? 210 : 270, backgroundColor: slide.canvas }}
        >
          <Text className="absolute -bottom-10 -right-2 font-headline text-[150px] leading-[160px] text-ink opacity-[0.06]">
            {step + 1}
          </Text>
          <View className="h-20 w-20 -rotate-3 items-center justify-center rounded-[24px] bg-surface">
            <slide.Icon size={step === 0 ? 42 : 34} color={colors.red} />
          </View>
          <Text className="mt-auto font-label text-caption uppercase tracking-[2px] text-red">
            {slide.eyebrow}
          </Text>
        </View>

        <Text className="mt-6 font-headline text-[40px] leading-[52px] text-ink">{slide.title}</Text>
        <Text className="mt-3 font-body text-body leading-6 text-muted">{slide.body}</Text>

        {step === SLIDES.length - 1 ? (
          <View className="mt-4 flex-row flex-wrap gap-2">
            {topics?.map((topic, index) => {
              const selected = selectedTopics.includes(topic.slug);
              return (
                <Pressable
                  key={topic.id}
                  onPress={() => toggleTopic(topic.slug)}
                  className="rounded-full border px-3 py-2"
                  style={{
                    borderColor: selected ? colors.ink : "transparent",
                    backgroundColor: selected ? topicCanvases[index % topicCanvases.length] : colors.surface,
                  }}
                >
                  <Text className="font-label text-caption text-ink">{topic.title}</Text>
                </Pressable>
              );
            })}
          </View>
        ) : null}
      </View>

      <View className="px-5 pb-8 pt-4" style={{ paddingBottom: Math.max(insets.bottom, 20) + 8 }}>
        <View className="mb-5 flex-row gap-1.5">
          {SLIDES.map((_, index) => (
            <View
              key={index}
              className="h-1 flex-1 rounded-full"
              style={{ backgroundColor: index <= step ? colors.red : colors.surface }}
            />
          ))}
        </View>
        <Pressable
          onPress={next}
          disabled={step === SLIDES.length - 1 && selectedTopics.length < 3}
          className="w-full items-center rounded-full bg-red py-4 disabled:opacity-40"
        >
          <Text className="font-label text-label text-surface">
            {step >= SLIDES.length - 1
              ? selectedTopics.length < 3
                ? `Choose ${3 - selectedTopics.length} more`
                : "Start my first drop"
              : "Keep going"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
