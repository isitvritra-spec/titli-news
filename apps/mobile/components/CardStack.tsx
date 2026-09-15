import { useEffect, useRef, useState } from "react";
import {
  FlatList,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import type { EditionCard, HotStory, TodayEdition } from "@repo/api-client";

import { EditionCompletion } from "./EditionCompletion";
import { MoreNews } from "./MoreNews";
import { ReadingCard } from "./ReadingCard";
import { feedIndexForOffset } from "../lib/feedPaging";
import { editionDateLabel } from "../lib/editionFreshness";
import { EditorialHeader } from "./EditorialHeader";
import { SearchButton } from "./ui/SearchButton";
import { dockClearance } from "./ui/navigation";
import { editorial as e } from "./ui/theme";

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
  const insets = useSafeAreaInsets();
  const [greetingHeight, setGreetingHeight] = useState(insets.top + 96);
  const height = heightOverride ?? windowHeight;
  const bottomInset = dockClearance(insets.bottom);
  const data: StackItem[] = [
    ...edition.cards.map((item): StackItem => ({ kind: "card", item })),
    { kind: "completion" },
    ...(showMore ? [{ kind: "more" } as StackItem] : []),
  ];

  useEffect(() => {
    if (!showMore) return;
    const frame = requestAnimationFrame(() => {
      listRef.current?.scrollToIndex({
        index: edition.cards.length + 1,
        animated: true,
      });
    });
    return () => cancelAnimationFrame(frame);
  }, [edition.cards.length, showMore]);

  function updateVisibleItem(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const nextIndex = feedIndexForOffset(
      event.nativeEvent.contentOffset.y,
      height,
      data.length,
    );
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
      testID="edition-pager"
      extraData={greetingHeight}
      getItemLayout={(_, index) => ({
        length: height,
        offset: height * index,
        index,
      })}
      keyExtractor={(item, index) =>
        item.kind === "card" ? item.item.card.id : `${item.kind}-${index}`
      }
      renderItem={({ item, index }) => {
        if (item.kind === "card")
          return (
            <View
              style={{
                width,
                height,
                paddingTop: index === 0 ? 0 : insets.top,
                backgroundColor: e.paper,
              }}
            >
              {index === 0 && (
                <View
                  onLayout={(event) =>
                    setGreetingHeight(
                      Math.round(event.nativeEvent.layout.height),
                    )
                  }
                >
                  <EditorialHeader
                    eyebrow={editionDateLabel(edition.editionDate)}
                    title="TITLI"
                    compact
                    greeting
                    progress={{ current: 1, total: edition.cards.length }}
                  />
                </View>
              )}
              <ReadingCard
                editionCard={item.item}
                editionId={edition.id}
                editionDate={edition.editionDate}
                height={height - (index === 0 ? greetingHeight : insets.top)}
                width={width}
                bottomInset={bottomInset}
              />
              {index > 0 && (
                <View
                  style={{
                    position: "absolute",
                    top: insets.top + 10,
                    right: 20,
                  }}
                >
                  <SearchButton />
                </View>
              )}
            </View>
          );
        if (item.kind === "completion")
          return (
            <View
              style={{
                width,
                height,
                paddingTop: insets.top,
                backgroundColor: e.paper,
              }}
            >
              <EditionCompletion
                edition={edition}
                height={height - insets.top}
                width={width}
                bottomInset={bottomInset}
                onStayCurious={() => setShowMore(true)}
                onExplore={() => router.push("/(tabs)/topics")}
              />
            </View>
          );
        return (
          <View
            style={{
              width,
              height,
              paddingTop: insets.top,
              backgroundColor: e.paper,
            }}
          >
            <MoreNews
              stories={hotStories}
              height={height - insets.top}
              width={width}
              bottomInset={bottomInset}
            />
          </View>
        );
      }}
    />
  );
}
