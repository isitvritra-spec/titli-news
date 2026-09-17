import { useState } from "react";
import { Pressable, Share, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import {
  EDITION_ROLE_CONFIG,
  isDataCard,
  type EditionCard,
  type EditionRole,
} from "@repo/api-client";
import { computeTrend, formatAsOf, formatCardDate } from "@repo/utils";
import { colors } from "@repo/tokens";

import { useSavedCardIds, useToggleSaved } from "../lib/savedCards";
import { cardShareUrl } from "../lib/links";
import { trackEvent } from "../lib/analytics";
import { getCardSignalTopics } from "../lib/personalization";
import { recordReaderSignal } from "../lib/readerProfile";
import { TrendBadge } from "./TrendBadge";
import { ContestedBadge } from "./ContestedBadge";
import { BookmarkIcon, ShareIcon } from "./icons";

const rolePalette: Record<EditionRole, { accent: string; canvas: string }> = {
  anchor: { accent: colors.red, canvas: colors.peach },
  for_you: { accent: colors.plum, canvas: colors.lilac },
  number: { accent: colors.ink, canvas: colors.lime },
  useful_now: { accent: colors.jade, canvas: colors.sage },
  beyond_metro: { accent: colors.red, canvas: colors.peach },
  another_lens: { accent: colors.plum, canvas: colors.sky },
  lift: { accent: colors.red, canvas: colors.lilac },
};

export function ReadingCard({
  editionCard,
  editionId,
  editionDate,
  height,
  width,
  bottomInset,
}: {
  editionCard: EditionCard;
  editionId: string;
  editionDate: string;
  height: number;
  width: number;
  bottomInset: number;
}) {
  const router = useRouter();
  const [showWhy, setShowWhy] = useState(false);
  const [feedbackSent, setFeedbackSent] = useState(false);
  const card = editionCard.card;
  const position = editionCard.position;
  const role = EDITION_ROLE_CONFIG.find(
    (item) => item.role === editionCard.role,
  )!;
  const palette = rolePalette[editionCard.role];
  const isData = isDataCard(card);
  const contentHeight = Math.max(0, height - bottomInset);
  const compact = contentHeight < 510;
  const imageHeight = Math.min(
    230,
    Math.max(compact ? 132 : 164, Math.round(contentHeight * 0.31)),
  );
  const bodyLines = compact ? (isData ? 2 : 3) : isData ? 4 : 5;
  const trend = isData ? computeTrend(card.readings) : null;
  const savedIds = useSavedCardIds();
  const toggleSaved = useToggleSaved();
  const isSaved = savedIds.includes(card.id);
  const stampProgress = useSharedValue(0);
  const stampStyle = useAnimatedStyle(() => ({
    opacity: stampProgress.value,
    transform: [
      { rotate: "-8deg" },
      { scale: 0.82 + stampProgress.value * 0.18 },
    ],
  }));

  function toggleWhy() {
    const next = !showWhy;
    setShowWhy(next);
    if (next)
      trackEvent("why_this_open", { editionId, cardId: card.id, position });
  }

  function toggleSave() {
    const willSave = !isSaved;
    toggleSaved(card.id);
    trackEvent(willSave ? "card_save" : "card_unsave", {
      editionId,
      cardId: card.id,
    });
    if (willSave) void recordReaderSignal("save", getCardSignalTopics(card));

    if (willSave) {
      stampProgress.value = 0;
      stampProgress.value = withSequence(
        withTiming(1, { duration: 180, easing: Easing.out(Easing.back(1.5)) }),
        withDelay(650, withTiming(0, { duration: 180 })),
      );
    }
  }

  return (
    <View
      style={{
        width,
        height,
        paddingBottom: bottomInset,
        overflow: "hidden",
        backgroundColor: palette.canvas,
      }}
    >
      <Pressable
        onPress={() => router.push(`/card/${card.slug}`)}
        className="relative w-full overflow-hidden"
        style={{ height: imageHeight, backgroundColor: palette.canvas }}
      >
        <Image
          source={{ uri: card.image.url }}
          placeholder={{ uri: card.image.blurDataURL }}
          placeholderContentFit="cover"
          contentFit="cover"
          style={{ width: "100%", height: "100%" }}
          accessibilityLabel={card.image.alt}
          transition={250}
        />
        {card.image.credit ? (
          <Text
            style={{
              position: "absolute",
              right: 0,
              bottom: 0,
              paddingHorizontal: 8,
              paddingVertical: 3,
              fontSize: 10,
              color: "#FFFFFF",
              backgroundColor: "rgba(17,18,16,0.6)",
            }}
          >
            {card.image.credit}
          </Text>
        ) : null}
        {isData && card.metric ? (
          <LinearGradient
            colors={["#11121012", "#111210E8"]}
            locations={[0.1, 1]}
            style={[
              StyleSheet.absoluteFill,
              {
                alignItems: "flex-end",
                justifyContent: "flex-end",
                paddingHorizontal: 20,
                paddingBottom: 44,
              },
            ]}
          >
            <Text
              className="font-headline text-white"
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.65}
              style={{
                fontSize: compact ? 52 : 64,
                lineHeight: compact ? 61 : 73,
                fontVariant: ["tabular-nums"],
              }}
            >
              {card.metric.value}
              {card.metric.unit}
            </Text>
            <Text className="font-label text-[11px] uppercase tracking-wider text-white" style={{ textAlign: "right" }}>
              One number / full context below
            </Text>
          </LinearGradient>
        ) : (
          <LinearGradient
            colors={["transparent", "#11121070"]}
            style={StyleSheet.absoluteFill}
          />
        )}
        <View
          className="absolute inset-x-0 bottom-0 h-px"
          style={{ backgroundColor: palette.accent }}
        />
        <View
          className="absolute bottom-3 left-5 rounded-full border border-ink px-3 py-1.5"
          style={{ backgroundColor: colors.surface }}
        >
          <Text className="font-label text-[11px] uppercase tracking-wider text-ink">
            {role.label}
          </Text>
        </View>
      </Pressable>

      <View style={{ flex: 1, minHeight: 0, backgroundColor: colors.surface }}>
        <View
          style={{
            flex: 1,
            minHeight: 0,
            paddingHorizontal: 20,
            paddingTop: 14,
            paddingBottom: 12,
          }}
        >
          <View className="mb-2.5 flex-row items-center gap-2">
            {card.isContested ? <ContestedBadge /> : null}
            {card.correctedAt ? (
              <View className="rounded-full border border-red px-2.5 py-1">
                <Text className="font-label text-[11px] uppercase tracking-wider text-red">
                  Corrected
                </Text>
              </View>
            ) : null}
            <Pressable
              onPress={toggleWhy}
              className="min-h-11 justify-center rounded-full px-3"
              style={{ backgroundColor: palette.canvas }}
            >
              <Text
                className="font-label text-[11px]"
                style={{ color: palette.accent }}
              >
                {showWhy ? "Why it is here" : "Picked for you"}
              </Text>
            </Pressable>
          </View>

          {showWhy ? (
            <View className="mb-3 rounded-lg bg-surface2 px-3.5 py-3">
              <Text
                className="font-body text-[13px] leading-5 text-ink"
                numberOfLines={compact ? 3 : 5}
              >
                {editionCard.recommendationReason}
              </Text>
              <View className="mt-2 flex-row items-center justify-between">
                <Text
                  className="mr-2 flex-1 font-body text-[11px] text-muted"
                  numberOfLines={2}
                >
                  {feedbackSent
                    ? "Your next edition will adjust."
                    : "Essential stories always stay visible."}
                </Text>
                {!editionCard.isMandatory && !feedbackSent ? (
                  <Pressable
                    onPress={() => {
                      setFeedbackSent(true);
                      trackEvent("less_like_this", {
                        editionId,
                        cardId: card.id,
                        position,
                      });
                      void recordReaderSignal(
                        "less_like_this",
                        getCardSignalTopics(card),
                      );
                    }}
                    className="min-h-11 justify-center"
                    hitSlop={8}
                  >
                    <Text className="font-label text-[11px] text-red">
                      Less like this
                    </Text>
                  </Pressable>
                ) : null}
              </View>
            </View>
          ) : null}

          <Pressable
            onPress={() => router.push(`/card/${card.slug}`)}
            style={({ pressed }) => ({ opacity: pressed ? 0.72 : 1 })}
          >
            <Text
              className="font-headline text-ink"
              numberOfLines={3}
              style={{
                fontSize: compact ? 23 : 26,
                lineHeight: compact ? 30 : 35,
              }}
            >
              {card.headline}
            </Text>

            {isData && trend ? (
              <View className="mt-0.5">
                <TrendBadge readings={card.readings} />
              </View>
            ) : null}
            {isData && trend?.latest ? (
              <Text className="mt-0.5 font-body text-caption text-muted">
                {formatAsOf(trend.latest.year, card.surveySource.name)}
              </Text>
            ) : null}

            {!showWhy ? (
              <Text
                className="mt-2 font-body text-ink"
                numberOfLines={bodyLines}
                style={{
                  fontSize: compact ? 14 : 15,
                  lineHeight: compact ? 20 : 22,
                }}
              >
                {card.body}
              </Text>
            ) : null}
            {!showWhy ? (
              <Text className="mt-2 font-label text-[11px] text-red">
                Read full story
              </Text>
            ) : null}
          </Pressable>
        </View>
        <View
          testID={`story-actions-${card.id}`}
          style={{
            flexDirection: "row",
            alignItems: "center",
            minHeight: 64,
            paddingHorizontal: 20,
            paddingVertical: 10,
            borderTopWidth: 1,
            borderTopColor: "#E6E2DB",
            backgroundColor: colors.surface,
          }}
        >
          <View className="min-w-0 flex-1 pr-3">
            <Text className="font-label text-[11px] text-ink" numberOfLines={1}>
              {isData ? card.surveySource.name : card.source.name}
            </Text>
            <Text
              className="font-body text-[11px] uppercase tracking-wider text-muted"
              numberOfLines={1}
            >
              {isData
                ? editionDate
                : `${formatCardDate(card.sourceDate)} / verified`}
            </Text>
          </View>
          <View className="mr-2 h-11 w-11 items-center justify-center rounded-full bg-surface2">
            <Pressable
              onPress={toggleSave}
              accessibilityRole="button"
              aria-label={isSaved ? "Remove from saved" : "Save"}
              className="h-11 w-11 items-center justify-center"
            >
              <BookmarkIcon
                size={18}
                color={isSaved ? colors.red : colors.muted}
                active={isSaved}
              />
            </Pressable>
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={async () => {
              const result = await Share.share({
                message: `${card.headline}\n${cardShareUrl(card.slug)}`,
              });
              if (result.action === Share.sharedAction) {
                trackEvent("card_share", { editionId, cardId: card.id });
                void recordReaderSignal("share", getCardSignalTopics(card));
              }
            }}
            aria-label="Share"
            className="h-11 w-11 items-center justify-center rounded-full bg-surface2"
          >
            <ShareIcon size={18} color={colors.muted} />
          </Pressable>
        </View>
        <Animated.View
          pointerEvents="none"
          className="absolute bottom-16 right-5 rounded-md border-2 border-red bg-surface px-3 py-1"
          style={stampStyle}
        >
          <Text className="font-headline text-label uppercase tracking-wider text-red">
            Kept
          </Text>
        </Animated.View>
      </View>
    </View>
  );
}
