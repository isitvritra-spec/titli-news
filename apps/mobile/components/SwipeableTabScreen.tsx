import type { PropsWithChildren } from "react";
import { Directions, Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { FadeIn, runOnJS } from "react-native-reanimated";
import { router, type Href } from "expo-router";

type TabName = "today" | "explore" | "saved";

// Left → right ordering of the three tabs, so a horizontal swipe moves between
// them like the reader app it mirrors. The Today feed pages vertically, so a
// horizontal fling here doesn't fight it.
const ORDER: { name: TabName; href: Href }[] = [
  { name: "today", href: "/" },
  { name: "explore", href: "/topics" },
  { name: "saved", href: "/saved" },
];

export function SwipeableTabScreen({ children, current }: PropsWithChildren<{ current: TabName }>) {
  const index = ORDER.findIndex((tab) => tab.name === current);

  function goto(direction: number) {
    const next = ORDER[index + direction];
    if (next) router.navigate(next.href);
  }

  const swipe = Gesture.Race(
    Gesture.Fling()
      .direction(Directions.LEFT)
      .onEnd(() => runOnJS(goto)(1)),
    Gesture.Fling()
      .direction(Directions.RIGHT)
      .onEnd(() => runOnJS(goto)(-1)),
  );

  return (
    <GestureDetector gesture={swipe}>
      <Animated.View
        entering={FadeIn.duration(220)}
        style={{ flex: 1, minHeight: 0, overflow: "hidden" }}
      >
        {children}
      </Animated.View>
    </GestureDetector>
  );
}
