import { useEffect, useRef, useState } from "react";
import { FlatList, type NativeScrollEvent, type NativeSyntheticEvent, useWindowDimensions } from "react-native";
import { useBottomTabBarHeight } from "expo-router/js-tabs";
import { useRouter } from "expo-router";
import type { EditionCard, HotStory, TodayEdition } from "@repo/api-client";

import { EditionCompletion } from "./EditionCompletion";
import { MoreNews } from "./MoreNews";
import { ReadingCard } from "./ReadingCard";
import { feedIndexForOffset } from "../lib/feedPaging";

type StackItem =
  | { kind: "card"; item: EditionCard }
  | { kind: "completion" }
  | { kind: "more" };

export function CardStack({
  edition,
  onIndexChange,
  onComplete,
  initialIndex = 0,
  height: heightOverride,
  hotStories = [],
}: {
  edition: TodayEdition;
  onIndexChange?: (index: number) => void;
  onComplete?: () => void;
  initialIndex?: number;
  height?: number;
  hotStories?: HotStory[];
}) {
  const router = useRouter();
  const listRef = useRef<FlatList<StackItem>>(null);
  const lastIndex = useRef(-1);
  const [showMore, setShowMore] = useState(false);
  const { width, height: windowHeight } = useWindowDimensions();
  const tabBarHeight = useBottomTabBarHeight();
  const height = Math.max(420, heightOverride ?? windowHeight - tabBarHeight);
  const bottomInset = Math.max(tabBarHeight + 8, 96);
  const data: StackItem[] = [
    ...edition.cards.map((item): StackItem => ({ kind: "card", item })),
    { kind: "completion" },
    ...(showMore ? [{ kind: "more" } as StackItem] : []),
  ];

  useEffect(() => {
    if (!showMore) return;
    const frame = requestAnimationFrame(() => {
      listRef.current?.scrollToIndex({ index: edition.cards.length + 1, animated: true });
    });
    return () => cancelAnimationFrame(frame);
  }, [edition.cards.length, showMore]);

  function updateVisibleItem(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const nextIndex = feedIndexForOffset(event.nativeEvent.contentOffset.y, height, data.length);
    if (nextIndex === lastIndex.current) return;

    lastIndex.current = nextIndex;
    onIndexChange?.(nextIndex);
    if (nextIndex === edition.cards.length) onComplete?.();
  }

  return (
    <FlatList
      ref={listRef}
      data={data}
      initialScrollIndex={Math.min(Math.max(initialIndex, 0), data.length - 1)}
      style={{ width, height }}
      showsVerticalScrollIndicator={false}
      bounces={false}
      pagingEnabled
      snapToInterval={height}
      snapToAlignment="start"
      disableIntervalMomentum
      decelerationRate="fast"
      overScrollMode="never"
      scrollEventThrottle={32}
      onScroll={updateVisibleItem}
      getItemLayout={(_, index) => ({ length: height, offset: height * index, index })}
      keyExtractor={(item, index) => item.kind === "card" ? item.item.card.id : `${item.kind}-${index}`}
      renderItem={({ item }) => {
        if (item.kind === "card") return (
          <ReadingCard
            editionCard={item.item}
            editionId={edition.id}
            editionDate={edition.editionDate}
            height={height}
            width={width}
            bottomInset={bottomInset}
          />
        );
        if (item.kind === "completion") return (
          <EditionCompletion
            edition={edition}
            height={height}
            width={width}
            bottomInset={bottomInset}
            onStayCurious={() => setShowMore(true)}
            onExplore={() => router.push("/(tabs)/topics")}
          />
        );
        return <MoreNews stories={hotStories} height={height} width={width} bottomInset={bottomInset} />;
      }}
    />
  );
}
