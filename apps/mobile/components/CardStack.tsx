import { useWindowDimensions } from "react-native";
import { useBottomTabBarHeight } from "expo-router/tabs";
import { Carousel } from "react-native-reanimated-carousel";
import type { Card } from "@repo/api-client";

import { ReadingCard } from "./ReadingCard";

/**
 * The swipe feed itself. Starts on react-native-reanimated-carousel for its
 * built-in windowing/recycling and snap physics — a working, good-feeling
 * feed without hand-rolling gesture math. If the feel needs more control
 * later, this is the one place to eject to a custom Gesture.Pan() build.
 *
 * useWindowDimensions (not Dimensions.get, which only reads once at module
 * load) so this stays correct if the viewport changes after load — the
 * common case on web, where Dimensions.get can capture a stale size before
 * the browser chrome/responsive layout settles. Height is the window minus
 * the tab bar (useBottomTabBarHeight) — this screen renders *above* the tab
 * bar, not full-window, so sizing each card to the raw window height pushed
 * its footer out below the visible area, under the tab bar.
 */
export function CardStack({
  cards,
  onIndexChange,
}: {
  cards: Card[];
  onIndexChange?: (index: number) => void;
}) {
  const { width, height: windowHeight } = useWindowDimensions();
  const tabBarHeight = useBottomTabBarHeight();
  const height = windowHeight - tabBarHeight;
  return (
    <Carousel
      data={cards}
      orientation="vertical"
      style={{ width, height }}
      loop={false}
      onSnapToItem={onIndexChange}
      renderItem={({ item }) => <ReadingCard card={item} />}
    />
  );
}
