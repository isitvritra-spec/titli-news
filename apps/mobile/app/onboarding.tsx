import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import { colors } from "@repo/tokens";
import { useMarkOnboardingSeen } from "../lib/onboarding";
import { ButterflyMark, BarChartIcon, TagIcon } from "../components/icons";

const SLIDES = [
  {
    Icon: (props: { size: number; color: string }) => <ButterflyMark {...props} />,
    title: "Feminism news, in bite-size cards",
    body: "Titli pairs short news with real Indian gender data — one card, one screen, about a minute a day.",
  },
  {
    Icon: (props: { size: number; color: string }) => <BarChartIcon {...props} />,
    title: "Every number shows its source",
    body: "Data cards always carry the year and where the number is from. If a stat can't be sourced, it doesn't run.",
  },
  {
    Icon: (props: { size: number; color: string }) => <TagIcon {...props} />,
    title: "Pick what you follow",
    body: "Choose topics like work, safety or politics, and your feed shows only those.",
  },
];

/**
 * A real route (not a conditional overlay in _layout.tsx) so it has normal
 * back-navigation semantics and stays reachable later (e.g. a future
 * "replay onboarding" entry). Driven entirely by the Skip/Next buttons and
 * dots — the design export has no swipe gesture on this screen, just a
 * step index — so this mirrors that with plain state, not a carousel.
 */
export default function Onboarding() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const markSeen = useMarkOnboardingSeen();
  const [step, setStep] = useState(0);

  function finish() {
    markSeen();
    router.replace("/(tabs)");
  }

  function next() {
    if (step >= SLIDES.length - 1) finish();
    else setStep((s) => s + 1);
  }

  const slide = SLIDES[step]!;

  return (
    <View className="flex-1 bg-bg" style={{ paddingTop: insets.top + 16 }}>
      <View className="flex-shrink-0 flex-row justify-end px-5">
        <Pressable onPress={finish} hitSlop={8} className="rounded-sm p-2">
          <Text className="font-label text-label text-muted">Skip</Text>
        </Pressable>
      </View>

      <View className="flex-1 items-center justify-center gap-5 px-8">
        <slide.Icon size={step === 0 ? 52 : 40} color={colors.gold} />
        <Text className="font-headline text-title text-ink text-center">{slide.title}</Text>
        <Text className="font-body text-body leading-relaxed text-muted text-center">{slide.body}</Text>
      </View>

      <View className="flex-shrink-0 items-center gap-5 px-8 pb-12">
        <View className="flex-row gap-2">
          {SLIDES.map((_, i) => (
            <View
              key={i}
              className="h-1.5 w-1.5 rounded-full"
              style={{
                backgroundColor: i === step ? colors.gold : colors.muted,
                opacity: i === step ? 1 : 0.4,
              }}
            />
          ))}
        </View>
        <Pressable
          onPress={next}
          className="w-full items-center rounded-full bg-gold p-[14px]"
        >
          <Text className="font-label text-label text-bg">
            {step >= SLIDES.length - 1 ? "Get started" : "Next"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
