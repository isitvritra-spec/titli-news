import type { PropsWithChildren } from "react";
import Animated, { FadeIn } from "react-native-reanimated";

type TabName = "today" | "explore" | "saved";

export function SwipeableTabScreen({ children }: PropsWithChildren<{ current: TabName }>) {
  return (
    <Animated.View
      entering={FadeIn.duration(240)}
      style={{ flex: 1, minHeight: 0, overflow: "hidden" }}
    >
      {children}
    </Animated.View>
  );
}
