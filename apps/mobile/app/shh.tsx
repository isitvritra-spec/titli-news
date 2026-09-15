import { useCallback, useEffect, useRef, useState } from "react";
import {
  AppState,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { getCheckInFeedback, pressureFromDuration } from "../lib/checkIn";
import { useSetExploreMode } from "../lib/exploreMode";
import { Symbol } from "../components/ui/Symbol";
import { editorial as e, type } from "../components/ui/theme";

const night = "#191E25";
const quiet = "#BDC3CE";
export default function Shh() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const setMode = useSetExploreMode();
  const [pressure, setPressure] = useState(0);
  const [holding, setHolding] = useState(false);
  const [complete, setComplete] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const started = useRef<number | null>(null);
  const reducedMotion = useReducedMotion();
  const bloom = useSharedValue(0);
  const size = Math.min(width - 90, height * 0.34, 300);
  const feedback = getCheckInFeedback(pressure);
  const clearTimer = useCallback(() => {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
    started.current = null;
  }, []);
  const reset = useCallback(() => {
    clearTimer();
    setPressure(0);
    setHolding(false);
    setComplete(false);
  }, [clearTimer]);
  useFocusEffect(
    useCallback(() => {
      reset();
      return reset;
    }, [reset]),
  );
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state !== "active") reset();
    });
    return () => {
      subscription.remove();
      clearTimer();
    };
  }, [reset, clearTimer]);
  useEffect(() => {
    bloom.value = withTiming(pressure, { duration: reducedMotion ? 0 : 180 });
  }, [pressure, bloom, reducedMotion]);
  const orb = useAnimatedStyle(() => ({
    transform: [{ scale: reducedMotion ? 1 : 0.92 + bloom.value * 0.08 }],
  }));
  function begin() {
    clearTimer();
    setComplete(false);
    setHolding(true);
    setPressure(0);
    started.current = Date.now();
    timer.current = setInterval(() => {
      if (started.current !== null) {
        const next = pressureFromDuration(Date.now() - started.current);
        setPressure(next);
        if (next === 1 && timer.current) {
          clearInterval(timer.current);
          timer.current = null;
        }
      }
    }, 40);
  }
  function finish() {
    if (started.current === null) return;
    const next = pressureFromDuration(Date.now() - started.current);
    clearTimer();
    setPressure(next);
    setHolding(false);
    setComplete(true);
  }
  function choose(value: number) {
    clearTimer();
    setPressure(value);
    setHolding(false);
    setComplete(true);
  }
  function leave() {
    reset();
    if (router.canGoBack()) router.back();
    else router.replace("/(tabs)");
  }
  return (
    <View style={{ flex: 1, backgroundColor: night }}>
      <StatusBar style="light" />
      <LinearGradient
        colors={["#292738", night, "#222F30"]}
        style={StyleSheet.absoluteFill}
      />
      <View style={[s.top, { paddingTop: insets.top + 10 }]}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 7 }}>
          <Symbol name="lock" size={14} color={quiet} />
          <Text style={[type.label, { color: quiet, fontSize: 10 }]}>
            Just between you & you
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close private space"
          onPress={leave}
          style={s.close}
        >
          <Symbol name="close" color={e.paper} size={20} />
        </Pressable>
      </View>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 28,
          paddingBottom: insets.bottom + 24,
          alignItems: "center",
          minHeight: Math.max(0, height - insets.top - 66),
        }}
      >
        <Text
          style={[
            type.title,
            { color: e.lilac, fontStyle: "italic", fontSize: 24, marginTop: 8 },
          ]}
        >
          shh…
        </Text>
        <Text style={[type.title, s.heading]}>How heavy{`\n`}is today?</Text>
        <Text style={[type.body, s.subtitle]}>
          You can put a little of it down here.
        </Text>
        <View
          style={{
            width: size + 42,
            height: size + 42,
            alignItems: "center",
            justifyContent: "center",
            marginTop: 22,
            marginBottom: 12,
          }}
        >
          <View
            pointerEvents="none"
            style={[
              s.ring,
              { width: size + 38, height: size + 38, borderRadius: size },
            ]}
          />
          <View
            pointerEvents="none"
            style={[
              s.ring,
              {
                width: size + 16,
                height: size + 16,
                borderRadius: size,
                borderColor: "#FFFFFF20",
              },
            ]}
          />
          <Animated.View style={[{ width: size, height: size }, orb]}>
            <Pressable
              onPressIn={begin}
              onPressOut={finish}
              accessibilityRole="adjustable"
              accessibilityLabel="How heavy today feels"
              accessibilityHint="Hold as the colour deepens, then release. You can also use the three feeling buttons below."
              accessibilityValue={{
                min: 0,
                max: 100,
                now: Math.round(pressure * 100),
              }}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(pressure * 100)}
              {...(Platform.OS === "web"
                ? {
                    onKeyDown: (event: {
                      key: string;
                      preventDefault: () => void;
                    }) => {
                      if (
                        ![
                          "ArrowUp",
                          "ArrowRight",
                          "ArrowDown",
                          "ArrowLeft",
                          "Home",
                          "End",
                        ].includes(event.key)
                      )
                        return;
                      event.preventDefault();
                      choose(
                        event.key === "Home"
                          ? 0
                          : event.key === "End"
                            ? 1
                            : Math.max(
                                0,
                                Math.min(
                                  1,
                                  pressure +
                                    (["ArrowUp", "ArrowRight"].includes(
                                      event.key,
                                    )
                                      ? 0.1
                                      : -0.1),
                                ),
                              ),
                      );
                    },
                  }
                : {})}
              accessibilityActions={[
                { name: "increment", label: "Heavier" },
                { name: "decrement", label: "Lighter" },
              ]}
              onAccessibilityAction={(event) =>
                choose(
                  Math.max(
                    0,
                    Math.min(
                      1,
                      pressure +
                        (event.nativeEvent.actionName === "increment"
                          ? 0.2
                          : -0.2),
                    ),
                  ),
                )
              }
              style={[s.orb, { borderRadius: size, width: size, height: size }]}
            >
              <LinearGradient
                colors={["#E5DFF9", "#9AADC3", "#728C84"]}
                start={{ x: 0.1, y: 0 }}
                end={{ x: 0.8, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              <View style={[StyleSheet.absoluteFill, { opacity: pressure }]}>
                <LinearGradient
                  colors={["#E9BAA4", "#AC86A6", "#655F89"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{ flex: 1 }}
                />
              </View>
              <View pointerEvents="none" style={{ alignItems: "center" }}>
                <Symbol
                  name={complete ? "leaf" : "star"}
                  size={30}
                  color={night}
                />
                <Text
                  style={[
                    type.button,
                    { color: night, marginTop: 14, fontSize: 17 },
                  ]}
                >
                  {holding
                    ? "Release when it feels right"
                    : complete
                      ? feedback.label
                      : "Touch. Hold. Let go."}
                </Text>
                <Text
                  style={[
                    type.body,
                    { color: "#30383E", fontSize: 13, marginTop: 3 },
                  ]}
                >
                  {holding || complete
                    ? `${Math.round(pressure * 100)} / 100`
                    : "There’s no right answer."}
                </Text>
              </View>
            </Pressable>
          </Animated.View>
        </View>
        <Text style={[type.label, { color: quiet, fontSize: 9 }]}>
          Or choose what feels closest
        </Text>
        <View style={s.choices}>
          {[
            { label: "Light", value: 0.15 },
            { label: "Tender", value: 0.5 },
            { label: "Heavy", value: 0.85 },
          ].map((item) => (
            <Pressable
              key={item.label}
              onPress={() => choose(item.value)}
              accessibilityRole="button"
              accessibilityState={{
                selected:
                  complete &&
                  getCheckInFeedback(item.value).band === feedback.band,
              }}
              aria-pressed={
                complete &&
                getCheckInFeedback(item.value).band === feedback.band
              }
              style={[
                s.choice,
                complete &&
                  getCheckInFeedback(item.value).band === feedback.band && {
                    backgroundColor: e.lilac,
                    borderColor: e.lilac,
                  },
              ]}
            >
              <Text
                style={[
                  type.button,
                  {
                    fontSize: 14,
                    color:
                      complete &&
                      getCheckInFeedback(item.value).band === feedback.band
                        ? night
                        : e.paper,
                  },
                ]}
              >
                {item.label}
              </Text>
            </Pressable>
          ))}
        </View>
        <View accessibilityLiveRegion="polite" style={s.response}>
          <Text
            style={[
              type.body,
              { color: e.paper, textAlign: "center", fontSize: 17 },
            ]}
          >
            {complete
              ? feedback.message
              : "No fixing. No explaining. Just a moment that belongs to you."}
          </Text>
        </View>
        {complete ? (
          <View style={{ width: "100%", gap: 8 }}>
            <Pressable
              onPress={() => {
                reset();
                setMode("Hopeful");
                router.replace("/(tabs)/topics");
              }}
              accessibilityRole="button"
              style={s.primary}
            >
              <Text style={type.button}>Find a little light</Text>
              <Symbol name="arrow" size={19} />
            </Pressable>
            <Pressable
              onPress={leave}
              accessibilityRole="button"
              style={{ alignItems: "center", padding: 12 }}
            >
              <Text style={[type.button, { color: quiet, fontSize: 14 }]}>
                I’m ready to go back
              </Text>
            </Pressable>
          </View>
        ) : null}
        <View
          style={{
            flexDirection: "row",
            gap: 6,
            alignItems: "center",
            marginTop: "auto",
            paddingTop: 18,
          }}
        >
          <Symbol name="lock" size={12} color={quiet} />
          <Text style={[type.body, { color: quiet, fontSize: 12 }]}>
            Nothing saved. Nothing shared.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
const s = StyleSheet.create({
  top: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingBottom: 8,
  },
  close: {
    width: 44,
    height: 44,
    borderRadius: 24,
    backgroundColor: "#FFFFFF10",
    justifyContent: "center",
    alignItems: "center",
  },
  heading: {
    color: e.paper,
    textAlign: "center",
    fontSize: 45,
    lineHeight: 51,
    marginTop: 4,
  },
  subtitle: { color: quiet, textAlign: "center", fontSize: 15, marginTop: 12 },
  ring: { position: "absolute", borderWidth: 1, borderColor: "#FFFFFF0C" },
  orb: {
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E5DFF980",
  },
  choices: { flexDirection: "row", gap: 8, marginTop: 12, width: "100%" },
  choice: {
    flex: 1,
    minHeight: 44,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#FFFFFF30",
    alignItems: "center",
    justifyContent: "center",
  },
  response: { minHeight: 85, justifyContent: "center", paddingVertical: 16 },
  primary: {
    backgroundColor: e.lilac,
    borderRadius: 28,
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 22,
  },
});
