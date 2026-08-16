import { Pressable, Share, Text, useWindowDimensions, View } from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useBottomTabBarHeight } from "expo-router/tabs";
import { isDataCard, type Card } from "@repo/api-client";
import { computeTrend, formatAsOf, formatCardDate } from "@repo/utils";
import { colors } from "@repo/tokens";

import { useSavedCardIds, useToggleSaved } from "../lib/savedCards";
import { TrendBadge } from "./TrendBadge";
import { ContestedBadge } from "./ContestedBadge";
import { BookmarkIcon, ShareIcon } from "./icons";

/**
 * The one card layout for both card types (per the brief: "two card types,
 * one layout"). Image sits as its own block at the top, and text sits
 * fully below it on the flat near-black — not overlaid on the image — so
 * no gradient scrim is needed (design-guide.md: "no scrim is needed").
 *
 * useWindowDimensions (not Dimensions.get) so the card always fills the
 * actual current viewport — see CardStack.tsx's comment on why a one-time
 * snapshot goes stale, especially on web. Height subtracts the tab bar
 * (this only renders on the Feed tab, above the bar, not full-window) —
 * same reasoning as CardStack.tsx, kept in sync since both need it.
 */
export function ReadingCard({ card }: { card: Card }) {
  const router = useRouter();
  const { width, height: windowHeight } = useWindowDimensions();
  const tabBarHeight = useBottomTabBarHeight();
  const height = windowHeight - tabBarHeight;
  /** "Top ~40% of the card" per design-guide.md. */
  const imageHeight = Math.round(height * 0.4);
  const isData = isDataCard(card);
  const trend = isData ? computeTrend(card.readings) : null;
  const savedIds = useSavedCardIds();
  const toggleSaved = useToggleSaved();
  const isSaved = savedIds.includes(card.id);

  return (
    <View style={{ width, height }} className="bg-bg">
      <View style={{ height: imageHeight }} className="w-full overflow-hidden">
        <Image
          source={{ uri: card.image.url }}
          placeholder={{ uri: card.image.blurDataURL }}
          placeholderContentFit="cover"
          contentFit="cover"
          style={{ width: "100%", height: "100%" }}
          accessibilityLabel={card.image.alt}
          transition={200}
        />
      </View>

      <Pressable
        onPress={() => router.push(`/card/${card.slug}`)}
        className="flex-1 px-5 pt-4"
      >
        {/*
          flex-1 + min-h-0: without min-h-0, a flex child won't shrink below
          its content's natural size, so a long headline+body can overflow
          this block and push the footer below the visible/clipped area —
          most visible on web, where the CSS flexbox engine enforces this
          strictly; Yoga (native) is more forgiving. numberOfLines above
          already caps each Text's own height, so this block just needs
          permission to actually respect that instead of overflowing.
        */}
        <View className="flex-1 min-h-0">
          {card.isContested ? (
            <View className="mb-3">
              <ContestedBadge />
            </View>
          ) : null}

          <Text className="font-headline text-title text-ink" numberOfLines={3}>
            {card.headline}
          </Text>

          {isData && card.metric ? (
            <Text
              className="mt-1 font-headline text-hero text-ink"
              style={{ fontVariant: ["tabular-nums"] }}
            >
              {card.metric.value}
              {card.metric.unit}
            </Text>
          ) : null}

          {isData && trend ? (
            <View className="mt-1">
              <TrendBadge readings={card.readings} />
            </View>
          ) : null}

          {isData && trend?.latest ? (
            <Text className="mt-0.5 text-caption text-muted font-body">
              {formatAsOf(trend.latest.year, card.surveySource.name)}
            </Text>
          ) : null}

          <Text className="mt-3 text-body leading-relaxed text-ink font-body" numberOfLines={6}>
            {card.body}
          </Text>
        </View>

        <View className="mt-auto mb-6 pt-3 border-t border-hairline flex-row items-center justify-between">
          <Text className="text-caption text-muted font-body" numberOfLines={1}>
            {isData ? "" : `${card.source.name} · ${formatCardDate(card.sourceDate)}`}
          </Text>
          <View className="flex-row items-center gap-4">
            <Pressable
              onPress={() => toggleSaved(card.id)}
              aria-label={isSaved ? "Remove from saved" : "Save"}
              hitSlop={8}
            >
              <BookmarkIcon size={18} color={isSaved ? colors.gold : colors.muted} active={isSaved} />
            </Pressable>
            <Pressable
              onPress={() => Share.share({ message: card.headline })}
              aria-label="Share"
              hitSlop={8}
            >
              <ShareIcon size={18} color={colors.muted} />
            </Pressable>
          </View>
        </View>
      </Pressable>
    </View>
  );
}
