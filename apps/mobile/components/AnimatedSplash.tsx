import { useEffect, useState, type PropsWithChildren } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  Easing,
  runOnJS,
} from "react-native-reanimated";

import { colors, motion } from "@repo/tokens";
import { ButterflyMark } from "./icons/ButterflyMark";

/**
 * The one deliberate oxblood-glow brand moment (see the brief's "Usage
 * notes" — maroon is a rare moment, not a background). Hides the native
 * splash immediately (see app/_layout.tsx's SplashScreen.hideAsync call)
 * and shows this instead: a brief glow, then a fade into the feed.
 */
export function AnimatedSplash({ children }: PropsWithChildren) {
  const [showSplash, setShowSplash] = useState(true);
  const glowOpacity = useSharedValue(0);
  const splashOpacity = useSharedValue(1);

  useEffect(() => {
    glowOpacity.value = withSequence(
      withTiming(1, { duration: motion.duration.slow, easing: Easing.out(Easing.quad) }),
      withTiming(
        0,
        { duration: motion.duration.splash, easing: Easing.inOut(Easing.quad) },
        () => {
          splashOpacity.value = withTiming(0, { duration: motion.duration.base }, (finished) => {
            if (finished) runOnJS(setShowSplash)(false);
          });
        }
      )
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const glowStyle = useAnimatedStyle(() => ({ opacity: glowOpacity.value }));
  const splashStyle = useAnimatedStyle(() => ({ opacity: splashOpacity.value }));

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {children}
      {showSplash ? (
        <Animated.View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, styles.splash, splashStyle]}
        >
          <Animated.View style={[styles.glow, glowStyle]} />
          <ButterflyMark size={64} color={colors.gold} />
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  splash: {
    backgroundColor: colors.bg,
    alignItems: "center",
    justifyContent: "center",
  },
  glow: {
    position: "absolute",
    width: 480,
    height: 480,
    borderRadius: 240,
    backgroundColor: colors.maroon,
  },
});
