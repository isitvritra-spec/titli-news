import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeIn, useReducedMotion } from "react-native-reanimated";
import type { TodayEdition } from "@repo/api-client";
import { fontFamily } from "@repo/tokens";
import { useSavedCardIds } from "../lib/savedCards";
import { Symbol, type SymbolName } from "./ui/Symbol";
import { editorial as e, type } from "./ui/theme";

export function EditionCompletion({
  edition,
  height,
  width,
  bottomInset,
  onStayCurious,
  onExplore,
}: {
  edition: TodayEdition;
  height: number;
  width: number;
  bottomInset: number;
  onStayCurious: () => void;
  onExplore: () => void;
}) {
  const savedIds = useSavedCardIds();
  const saved = edition.cards.filter(({ card }) =>
    savedIds.includes(card.id),
  ).length;
  const reducedMotion = useReducedMotion();
  const compact = height - bottomInset < 700;
  return (
    <View style={{ width, height, backgroundColor: e.paper }}>
      <ScrollView
        nestedScrollEnabled
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingTop: compact ? 14 : 24,
          paddingBottom: bottomInset + 20,
          minHeight: height,
        }}
      >
        <View style={s.center}>
          <Text style={type.label}>Today’s edition · complete</Text>
          <View
            style={s.progress}
            accessibilityLabel={`${edition.cards.length} of ${edition.cards.length} stories complete`}
          >
            {edition.cards.map(({ card }, i) => (
              <View
                key={card.id}
                style={[
                  s.tick,
                  {
                    backgroundColor:
                      i === edition.cards.length - 1 ? e.moss : e.line,
                  },
                ]}
              />
            ))}
          </View>
        </View>
        <Animated.View
          entering={reducedMotion ? undefined : FadeIn.duration(650)}
          style={[s.center, { marginTop: compact ? 16 : 30 }]}
        >
          <View style={[s.medallionScene, { height: compact ? 142 : 180 }]}>
            <View
              style={[
                s.orbit,
                { width: compact ? 164 : 200, height: compact ? 164 : 200 },
              ]}
            />
            <LinearGradient
              colors={[e.white, "#E8E1D3"]}
              start={{ x: 0.2, y: 0 }}
              end={{ x: 0.8, y: 1 }}
              style={[
                s.medallion,
                { width: compact ? 118 : 148, height: compact ? 118 : 148 },
              ]}
            >
              <Symbol name="gift" size={compact ? 60 : 72} color={e.moss} />
            </LinearGradient>
            <View
              style={{
                position: "absolute",
                left: 18,
                bottom: 18,
                transform: [{ rotate: "-35deg" }],
              }}
            >
              <Symbol name="leaf" size={34} color={e.moss} />
            </View>
            <View style={{ position: "absolute", right: 24, top: 12 }}>
              <Symbol name="star" size={22} color={e.moss} />
            </View>
            <View style={{ position: "absolute", right: 10, bottom: 26 }}>
              <Symbol name="leaf" size={28} color={e.moss} />
            </View>
          </View>
          <Text style={[type.label, { marginTop: 14 }]}>
            A little wiser. A little lighter.
          </Text>
          <Text
            style={[
              type.title,
              {
                fontSize: compact ? 44 : 52,
                lineHeight: compact ? 56 : 64,
                marginTop: 8,
              },
            ]}
          >
            You did it.
          </Text>
          <Text style={[type.body, { textAlign: "center" }]}>
            {edition.cards.length === 7 ? "Seven" : edition.cards.length}{" "}
            stories. You’re caught up.
          </Text>
        </Animated.View>
        <View style={[s.stats, { marginVertical: compact ? 20 : 28 }]}>
          <Stat
            icon="star"
            value={String(edition.cards.length)}
            label="Stories read"
          />
          <Stat icon="gift" value={String(saved)} label="Kept for later" />
          <Stat icon="leaf" value="100%" label="Edition complete" />
        </View>
        <View style={s.complete}>
          <Text style={[type.button, { color: e.white }]}>
            That’s your world, for today.
          </Text>
          <Symbol name="star" color={e.lime} size={20} />
        </View>
        <Pressable
          onPress={onStayCurious}
          accessibilityRole="button"
          style={({ pressed }) => [s.discover, { opacity: pressed ? 0.8 : 1 }]}
        >
          <View style={s.discoverIcon}>
            <Symbol name="globe" size={26} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[type.button, { fontSize: 18 }]}>
              Still a little curious?
            </Text>
            <Text style={[type.body, { fontSize: 14, lineHeight: 19 }]}>
              A few more stories, at your pace.
            </Text>
          </View>
          <Symbol name="arrow" />
        </Pressable>
        <Pressable
          onPress={onExplore}
          accessibilityRole="button"
          style={s.explore}
        >
          <Text style={[type.button, { fontSize: 14 }]}>
            Make room for a new perspective
          </Text>
          <Symbol name="arrow" size={17} />
        </Pressable>
      </ScrollView>
    </View>
  );
}
function Stat({
  icon,
  value,
  label,
}: {
  icon: SymbolName;
  value: string;
  label: string;
}) {
  return (
    <View style={s.stat}>
      <Symbol name={icon} color={e.moss} size={22} />
      <Text style={s.value}>{value}</Text>
      <Text style={s.caption}>{label}</Text>
    </View>
  );
}
const s = StyleSheet.create({
  center: { alignItems: "center" },
  progress: { flexDirection: "row", gap: 7, marginTop: 13 },
  tick: { width: 24, height: 4, borderRadius: 3 },
  medallionScene: {
    width: 268,
    alignItems: "center",
    justifyContent: "center",
  },
  orbit: {
    position: "absolute",
    borderRadius: 120,
    borderWidth: 1,
    borderColor: e.line,
  },
  medallion: {
    borderRadius: 90,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: e.white,
    shadowColor: e.moss,
    shadowOpacity: 0.15,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 12 },
  },
  stats: { flexDirection: "row" },
  stat: {
    flex: 1,
    alignItems: "center",
    gap: 5,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderColor: e.line,
  },
  value: {
    fontFamily: fontFamily.label,
    fontSize: 29,
    color: e.ink,
    marginTop: 3,
  },
  caption: {
    fontFamily: fontFamily.body,
    fontSize: 12,
    color: e.muted,
    textAlign: "center",
  },
  complete: {
    minHeight: 52,
    backgroundColor: e.ink,
    borderRadius: 30,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
    padding: 12,
  },
  discover: {
    marginTop: 14,
    padding: 18,
    gap: 12,
    backgroundColor: e.lime,
    borderRadius: 24,
    flexDirection: "row",
    alignItems: "center",
  },
  discoverIcon: {
    width: 45,
    height: 45,
    borderRadius: 24,
    backgroundColor: "#FFFFFF66",
    justifyContent: "center",
    alignItems: "center",
  },
  explore: {
    minHeight: 48,
    gap: 8,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    marginTop: 5,
  },
});
