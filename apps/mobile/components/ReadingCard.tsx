import { Dimensions, Pressable, Text, View } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { isDataCard, type Card } from "@repo/api-client";
import { computeTrend, formatAsOf, formatCardDate } from "@repo/utils";

import { TrendBadge } from "./TrendBadge";
import { ContestedBadge } from "./ContestedBadge";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const IMAGE_HEIGHT = Math.round(SCREEN_HEIGHT * 0.56);

/**
 * The one card layout for both card types (per the brief: "two card types,
 * one layout"). Image sits as its own block at the top — not a full-bleed
 * background with text overlaid — so photos and the ~60-word body both
 * stay legible on the calmer near-black base, per the brand's usage notes.
 */
export function ReadingCard({ card }: { card: Card }) {
  const router = useRouter();
  const isData = isDataCard(card);
  const trend = isData ? computeTrend(card.readings) : null;

  return (
    <View style={{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT }} className="bg-bg">
      <View style={{ height: IMAGE_HEIGHT }} className="w-full overflow-hidden">
        <Image
          source={{ uri: card.image.url }}
          placeholder={{ uri: card.image.blurDataURL }}
          placeholderContentFit="cover"
          contentFit="cover"
          style={{ width: "100%", height: "100%" }}
          accessibilityLabel={card.image.alt}
          transition={200}
        />
        <LinearGradient
          colors={["rgba(16,10,12,0)", "#100A0C"]}
          style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 64 }}
        />
      </View>

      <Pressable
        onPress={() => router.push(`/card/${card.slug}`)}
        className="flex-1 px-5 pt-4"
      >
        {card.isContested ? (
          <View className="mb-3">
            <ContestedBadge />
          </View>
        ) : null}

        <Text className="font-headline text-2xl text-ink" numberOfLines={3}>
          {card.headline}
        </Text>

        {isData && trend?.latest ? (
          <Text className="mt-1 text-xs text-muted font-body">
            {formatAsOf(trend.latest.year, card.surveySource.name)}
          </Text>
        ) : null}

        <Text className="mt-3 text-base leading-relaxed text-ink font-body" numberOfLines={6}>
          {card.body}
        </Text>

        <View className="mt-auto mb-6 flex-row items-center justify-between">
          {isData ? (
            trend ? <TrendBadge readings={card.readings} /> : <View />
          ) : (
            <Text className="text-xs text-muted font-body uppercase tracking-wide">
              {card.source.name} · {formatCardDate(card.sourceDate)}
            </Text>
          )}
          <Text className="text-xs text-muted font-body">Tap for more</Text>
        </View>
      </Pressable>
    </View>
  );
}
