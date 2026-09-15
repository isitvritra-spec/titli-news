import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useIsRestoring, useQuery } from "@tanstack/react-query";
import { colors } from "@repo/tokens";
import type { TodayEdition } from "@repo/api-client";

import { api } from "../../lib/api";
import { trackEvent } from "../../lib/analytics";
import { readEditionOrder, writeEditionOrder } from "../../lib/editionOrder";
import {
  getCardSignalTopics,
  personalizeEdition,
} from "../../lib/personalization";
import { readReaderProfile, recordReaderSignal } from "../../lib/readerProfile";
import { useSelectedTopics } from "../../lib/topicSelection";
import { CardStack } from "../../components/CardStack";
import { ButterflyMark } from "../../components/icons";
import { SwipeableTabScreen } from "../../components/SwipeableTabScreen";

const progressKey = (editionId: string, version: number) =>
  `titli-edition-progress:${editionId}:v${version}`;

export default function Today() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [initialIndex, setInitialIndex] = useState(0);
  const [progressReady, setProgressReady] = useState(false);
  const [displayEdition, setDisplayEdition] = useState<TodayEdition | null>(
    null,
  );
  const [feedHeight, setFeedHeight] = useState(0);
  const startedEdition = useRef<string | null>(null);
  const completedEdition = useRef<string | null>(null);
  const preparedEdition = useRef<string | null>(null);
  const activeCardSession = useRef<{
    editionKey: string;
    index: number;
    startedAt: number;
  } | null>(null);
  const isRestoring = useIsRestoring();
  const selectedTopics = useSelectedTopics();

  const {
    data: edition,
    isPending,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["today-edition"],
    queryFn: () => api.getTodayEdition(),
  });
  const { data: hotStories = [] } = useQuery({
    queryKey: [
      "hot-stories",
      "balanced-v1",
      displayEdition?.id,
      displayEdition?.version,
    ],
    queryFn: () => api.getHotStories(displayEdition?.id),
    enabled: Boolean(displayEdition?.id),
  });

  useEffect(() => {
    if (isRestoring || isPending) return;

    if (!edition) {
      setDisplayEdition(null);
      setProgressReady(true);
      return;
    }

    const editionKey = `${edition.id}:${edition.version}`;
    if (preparedEdition.current === editionKey) return;

    let cancelled = false;
    setProgressReady(false);
    void Promise.all([
      AsyncStorage.getItem(progressKey(edition.id, edition.version)),
      readReaderProfile(),
    ])
      .then(async ([storedProgress, readerProfile]) => {
        const rankedEdition = personalizeEdition(
          edition,
          selectedTopics,
          readerProfile,
        );
        const storedEdition = await readEditionOrder(rankedEdition);
        const personalizedEdition = storedEdition ?? rankedEdition;
        if (!storedEdition) await writeEditionOrder(personalizedEdition);
        if (cancelled) return;

        const parsed = Number(storedProgress ?? 0);
        const safeIndex = Number.isInteger(parsed)
          ? Math.min(Math.max(parsed, 0), personalizedEdition.cards.length)
          : 0;
        preparedEdition.current = editionKey;
        activeCardSession.current = {
          editionKey,
          index: safeIndex,
          startedAt: Date.now(),
        };
        setDisplayEdition(personalizedEdition);
        setInitialIndex(safeIndex);
        setActiveIndex(safeIndex);
        setProgressReady(true);
      })
      .catch(() => {
        if (cancelled) return;
        preparedEdition.current = editionKey;
        activeCardSession.current = {
          editionKey,
          index: 0,
          startedAt: Date.now(),
        };
        setDisplayEdition(edition);
        setInitialIndex(0);
        setActiveIndex(0);
        setProgressReady(true);
      });

    return () => {
      cancelled = true;
    };
  }, [edition, isPending, isRestoring, selectedTopics]);

  useEffect(() => {
    if (!displayEdition) return;
    const editionKey = `${displayEdition.id}:${displayEdition.version}`;
    if (startedEdition.current === editionKey) return;
    startedEdition.current = editionKey;
    trackEvent("edition_start", { editionId: displayEdition.id });
  }, [displayEdition]);

  useEffect(() => {
    const item = displayEdition?.cards[activeIndex];
    if (!item) return;

    const startedAt = Date.now();
    let viewRecorded = false;
    const timer = setTimeout(() => {
      viewRecorded = true;
      trackEvent("card_view", {
        editionId: displayEdition.id,
        cardId: item.card.id,
        position: activeIndex,
      });
    }, 2_000);

    return () => {
      clearTimeout(timer);
      const durationMs = Date.now() - startedAt;
      if (!viewRecorded && durationMs < 500) return;
      trackEvent("card_dwell", {
        editionId: displayEdition.id,
        cardId: item.card.id,
        position: activeIndex,
        durationMs: Math.min(durationMs, 300_000),
      });
    };
  }, [activeIndex, displayEdition]);

  function onIndexChange(index: number) {
    if (displayEdition) {
      const editionKey = `${displayEdition.id}:${displayEdition.version}`;
      const previous = activeCardSession.current;
      if (previous?.editionKey === editionKey && previous.index !== index) {
        const previousCard = displayEdition.cards[previous.index]?.card;
        const durationMs = Date.now() - previous.startedAt;
        if (previousCard && durationMs < 2_000) {
          void recordReaderSignal(
            "fast_skip",
            getCardSignalTopics(previousCard),
          );
        } else if (previousCard && durationMs >= 8_000) {
          void recordReaderSignal(
            "healthy_dwell",
            getCardSignalTopics(previousCard),
          );
        }
      }
      activeCardSession.current = { editionKey, index, startedAt: Date.now() };
    }
    setActiveIndex(index);
    if (displayEdition) {
      void AsyncStorage.setItem(
        progressKey(displayEdition.id, displayEdition.version),
        String(index),
      );
    }
  }

  function onComplete() {
    if (!displayEdition) return;
    const editionKey = `${displayEdition.id}:${displayEdition.version}`;
    if (completedEdition.current === editionKey) return;
    completedEdition.current = editionKey;
    trackEvent("edition_complete", { editionId: displayEdition.id });
  }

  return (
    <SwipeableTabScreen current="today">
      <View
        className="flex-1 bg-bg"
        onLayout={(event) =>
          setFeedHeight(Math.round(event.nativeEvent.layout.height))
        }
      >
        <View style={{ flex: 1, minHeight: 0, overflow: "hidden" }}>
          {isPending || isRestoring || !progressReady ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator color={colors.red} />
            </View>
          ) : isError ? (
            <StateMessage
              title="Titli could not reach the newsroom."
              body="Your last edition remains saved offline. Check your connection and try again."
              action="Try again"
              onPress={() => refetch()}
            />
          ) : displayEdition &&
            displayEdition.cards.length > 0 &&
            feedHeight > 0 ? (
            <CardStack
              key={`${displayEdition.id}:${displayEdition.version}:${initialIndex}`}
              edition={displayEdition}
              initialIndex={initialIndex}
              onIndexChange={onIndexChange}
              onComplete={onComplete}
              height={feedHeight || undefined}
              hotStories={hotStories}
            />
          ) : (
            <StateMessage
              title="Today's Titli is being prepared."
              body="Editors are checking sources and composing the seven stories worth your time."
              action="Check again"
              onPress={() => refetch()}
            />
          )}
        </View>
      </View>
    </SwipeableTabScreen>
  );
}

function StateMessage({
  title,
  body,
  action,
  onPress,
}: {
  title: string;
  body: string;
  action: string;
  onPress: () => void;
}) {
  return (
    <View className="flex-1 items-center justify-center px-8">
      <View className="mb-7 h-24 w-24 items-center justify-center rounded-card bg-surface shadow-sm">
        <ButterflyMark size={42} color={colors.red} />
      </View>
      <Text className="text-center font-headline text-title leading-[34px] text-ink">
        {title}
      </Text>
      <Text className="mt-3 text-center font-body text-body leading-6 text-muted">
        {body}
      </Text>
      <Pressable
        onPress={onPress}
        className="mt-7 rounded-full bg-red px-6 py-3"
      >
        <Text className="font-label text-label text-surface">{action}</Text>
      </Pressable>
    </View>
  );
}
