import { useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { isDataCard, type HotStory } from "@repo/api-client";
import { fontFamily } from "@repo/tokens";
import { selectBalancedHotStories } from "../lib/contentBalance";
import { Symbol } from "./ui/Symbol";
import { editorial as e, type } from "./ui/theme";

const canvases = [e.lime, e.peach, e.lilac, e.blue];
export function MoreNews({
  stories,
  width,
  height,
  bottomInset,
}: {
  stories: HotStory[];
  width: number;
  height: number;
  bottomInset: number;
}) {
  const router = useRouter();
  const visible = selectBalancedHotStories(stories, 5);
  const [index, setIndex] = useState(0);
  const rail = useRef<ScrollView>(null);
  const cardWidth = Math.min(width - 68, 380);
  const cardHeight = Math.max(370, Math.min(height - bottomInset - 170, 485));
  return (
    <View style={{ width, height, backgroundColor: e.paper }}>
      <ScrollView
        nestedScrollEnabled
        contentContainerStyle={{
          paddingBottom: bottomInset + 20,
          paddingTop: 20,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ paddingHorizontal: 24, marginBottom: 20 }}>
          <Text style={type.label}>Beyond your seven</Text>
          <Text style={[type.title, { marginTop: 6, fontSize: 34 }]}>
            Curiosity looks good on you.
          </Text>
        </View>
        {visible.length ? (
          <>
            <ScrollView
              ref={rail}
              horizontal
              snapToInterval={cardWidth + 14}
              decelerationRate="fast"
              disableIntervalMomentum
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(event) =>
                setIndex(
                  Math.max(
                    0,
                    Math.min(
                      visible.length - 1,
                      Math.round(
                        event.nativeEvent.contentOffset.x / (cardWidth + 14),
                      ),
                    ),
                  ),
                )
              }
              contentContainerStyle={{ paddingHorizontal: 24, gap: 14 }}
            >
              {visible.map(({ card, reason }, i) => (
                <View
                  key={card.id}
                  style={{
                    width: cardWidth,
                    minHeight: cardHeight,
                    borderRadius: 26,
                    padding: 20,
                    backgroundColor: canvases[i % 4],
                    overflow: "hidden",
                  }}
                >
                  <Text
                    style={[
                      type.label,
                      { textAlign: "center", color: e.ink, fontSize: 10 },
                    ]}
                  >
                    {reason} · {String(i + 1).padStart(2, "0")}
                  </Text>
                  <Text
                    numberOfLines={4}
                    style={{
                      fontFamily: fontFamily.headline,
                      fontSize: 26,
                      lineHeight: 31,
                      color: e.ink,
                      textAlign: "center",
                      marginTop: 12,
                    }}
                  >
                    {card.headline}
                  </Text>
                  <View style={s.photo}>
                    <Image
                      source={{ uri: card.image.url }}
                      placeholder={{ uri: card.image.blurDataURL }}
                      accessibilityLabel={card.image.alt}
                      contentFit="cover"
                      style={StyleSheet.absoluteFill}
                    />
                    <LinearGradient
                      colors={["#11121008", "#111210D9"]}
                      locations={[0.12, 1]}
                      style={StyleSheet.absoluteFill}
                    />
                    {isDataCard(card) && card.metric ? (
                      <View style={s.metric}>
                      <Text
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        style={{
                          fontFamily: fontFamily.headline,
                          fontSize: Math.min(
                            76,
                            ((cardWidth - 40) * 1.5) /
                              `${card.metric.value}${card.metric.unit}`.length,
                          ),
                          lineHeight: 100,
                          color: e.white,
                        }}
                      >
                        {card.metric.value}
                        {card.metric.unit}
                      </Text>
                      <Text
                        style={[
                          type.body,
                          { fontSize: 12, textAlign: "center", color: e.white },
                        ]}
                      >
                        {card.surveySource.name}
                      </Text>
                      </View>
                    ) : null}
                  </View>
                  <Pressable
                    onPress={() => router.push(`/card/${card.slug}`)}
                    accessibilityRole="button"
                    accessibilityLabel={`Read ${card.headline}`}
                    style={({ pressed }) => [
                      s.read,
                      { opacity: pressed ? 0.7 : 1 },
                    ]}
                  >
                    <Text style={[type.button, { color: e.paper }]}>
                      A little more perspective
                    </Text>
                    <Symbol name="arrow" color={e.paper} size={19} />
                  </Pressable>
                </View>
              ))}
            </ScrollView>
            <View style={s.controls}>
              <View style={{ flexDirection: "row", gap: 6 }}>
                {visible.map((item, i) => (
                  <Pressable
                    key={item.card.id}
                    onPress={() => {
                      setIndex(i);
                      rail.current?.scrollTo({
                        x: i * (cardWidth + 14),
                        animated: true,
                      });
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={`Story ${i + 1}`}
                    accessibilityState={{ selected: i === index }}
                    aria-pressed={i === index}
                    style={{
                      width: 30,
                      height: 44,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <View
                      style={{
                        width: i === index ? 22 : 6,
                        height: 6,
                        borderRadius: 3,
                        backgroundColor: i === index ? e.ink : e.line,
                      }}
                    />
                  </Pressable>
                ))}
              </View>
              <Text style={type.label}>
                {index + 1} / {visible.length}
              </Text>
            </View>
          </>
        ) : (
          <View
            style={{
              marginHorizontal: 24,
              padding: 28,
              backgroundColor: e.lilac,
              borderRadius: 26,
            }}
          >
            <Symbol name="leaf" size={32} />
            <Text style={[type.title, { marginTop: 20, fontSize: 30 }]}>
              Room for something new.
            </Text>
            <Text style={[type.body, { marginTop: 10 }]}>
              More stories are on their way. Until then, explore a topic you
              care about.
            </Text>
          </View>
        )}
        <Pressable
          onPress={() => router.push("/(tabs)/topics")}
          accessibilityRole="button"
          style={{ padding: 16, alignItems: "center" }}
        >
          <Text style={type.button}>Explore your own direction →</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}
const s = StyleSheet.create({
  photo: {
    height: 180,
    borderRadius: 17,
    marginVertical: 20,
    overflow: "hidden",
  },
  metric: {
    position: "absolute",
    inset: 0,
    justifyContent: "flex-end",
    alignItems: "flex-start",
    padding: 18,
  },
  read: {
    marginTop: "auto",
    minHeight: 54,
    backgroundColor: e.ink,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    paddingHorizontal: 16,
  },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: 24,
    marginTop: 10,
  },
});
