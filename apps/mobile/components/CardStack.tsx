import { Dimensions } from "react-native";
import { Carousel } from "react-native-reanimated-carousel";
import type { Card } from "@repo/api-client";

import { ReadingCard } from "./ReadingCard";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

/**
 * The swipe feed itself. Starts on react-native-reanimated-carousel for its
 * built-in windowing/recycling and snap physics — a working, good-feeling
 * feed without hand-rolling gesture math. If the feel needs more control
 * later, this is the one place to eject to a custom Gesture.Pan() build.
 */
export function CardStack({
  cards,
  onIndexChange,
}: {
  cards: Card[];
  onIndexChange?: (index: number) => void;
}) {
  return (
    <Carousel
      data={cards}
      orientation="vertical"
      style={{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT }}
      loop={false}
      onSnapToItem={onIndexChange}
      renderItem={({ item }) => <ReadingCard card={item} />}
    />
  );
}
