import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import Animated, {
  FadeInDown,
  FadeOutUp,
  LinearTransition,
} from "react-native-reanimated";
import { isDataCard } from "@repo/api-client";
import { fontFamily } from "@repo/tokens";
import { api } from "../../lib/api";
import { trackEvent } from "../../lib/analytics";
import {
  type ExploreMode,
  useExploreMode,
  useSetExploreMode,
} from "../../lib/exploreMode";
import { useSelectedTopics, useToggleTopic } from "../../lib/topicSelection";
import { useSavedCardIds, useToggleSaved } from "../../lib/savedCards";
import {
  BookmarkIcon,
  CheckIcon,
  ChevronLeftIcon,
  PulseIcon,
} from "../../components/icons";
import { EditorialHeader } from "../../components/EditorialHeader";
import { Symbol } from "../../components/ui/Symbol";
import { editorial as e, type } from "../../components/ui/theme";

const canvases = [e.lime, e.lilac, e.peach, e.blue];
const modes: ExploreMode[] = ["Surprise me", "Useful", "Hopeful", "Debatable"];
function score(value: string, salt: string) {
  return [...`${salt}:${value}`].reduce(
    (n, c) => (n * 31 + c.charCodeAt(0)) % 10007,
    7,
  );
}

export default function Topics() {
  const router = useRouter();
  const params = useLocalSearchParams<{ search?: string; checkin?: string }>();
  const { width } = useWindowDimensions();
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(params.search === "1");
  const [topicFilter, setTopicFilter] = useState<string | null>(null);
  const [storyIndex, setStoryIndex] = useState(0);
  const [showAll, setShowAll] = useState(false);
  const input = useRef<TextInput>(null);
  const rail = useRef<ScrollView>(null);
  const page = useRef<ScrollView>(null);
  const mode = useExploreMode();
  const setMode = useSetExploreMode();
  const selected = useSelectedTopics();
  const toggle = useToggleTopic();
  const savedIds = useSavedCardIds();
  const toggleSaved = useToggleSaved();
  const { data: topics = [] } = useQuery({
    queryKey: ["topics"],
    queryFn: () => api.getTopics(),
  });
  const {
    data: cards = [],
    isPending,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["feed", "explore"],
    queryFn: () => api.getFeed({}),
  });
  const { data: pulse = [] } = useQuery({
    queryKey: ["pulse"],
    queryFn: () => api.getPulse(),
  });
  const { data: edition } = useQuery({
    queryKey: ["today-edition"],
    queryFn: () => api.getTodayEdition(),
  });
  const storyWidth = Math.min(width - 56, 440);
  const ordered = [...cards]
    .filter(
      (card) =>
        (!topicFilter || card.topics.some((t) => t.slug === topicFilter)) &&
        `${card.headline} ${card.body} ${card.topics.map((t) => t.title).join(" ")}`
          .toLowerCase()
          .includes(query.trim().toLowerCase()),
    )
    .sort((a, b) => {
      const preferred = (card: typeof a) => {
        const entry = edition?.cards.find((item) => item.card.id === card.id);
        return mode === "Hopeful"
          ? Number(entry?.role === "lift") * 3 +
              Number(entry?.distressLevel === "low")
          : mode === "Useful"
            ? (entry?.practicalUtility ?? 0)
            : mode === "Debatable"
              ? Number(card.isContested)
              : 0;
      };
      return (
        preferred(b) - preferred(a) || score(a.slug, mode) - score(b.slug, mode)
      );
    })
    .slice(0, 7);
  const metric = pulse[0];
  useEffect(() => {
    if (params.search === "1") {
      setSearchOpen(true);
      input.current?.focus();
    }
  }, [params.search]);
  useEffect(() => {
    if (params.checkin === "1") {
      router.setParams({ checkin: undefined });
      router.push("/shh");
    }
  }, [params.checkin, router]);
  useEffect(() => {
    setStoryIndex(0);
    rail.current?.scrollTo({ x: 0, animated: false });
  }, [mode, topicFilter, query]);
  function jump(index: number) {
    const next = Math.max(0, Math.min(index, ordered.length - 1));
    setStoryIndex(next);
    rail.current?.scrollTo({ x: next * (storyWidth + 12), animated: true });
  }
  function openSearch() {
    setSearchOpen(true);
    page.current?.scrollTo({ y: 0, animated: true });
    requestAnimationFrame(() =>
      requestAnimationFrame(() => input.current?.focus()),
    );
  }
  return (
    <View style={{ flex: 1, backgroundColor: e.paper }}>
      <EditorialHeader
        eyebrow="Explore"
        title="Explore"
        compact
        onSearch={openSearch}
        searchActive={searchOpen}
      />
      <ScrollView
        ref={page}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 125 }}
      >
        <View style={s.intro}>
          {searchOpen && (
            <Animated.View
              entering={FadeInDown.duration(220)}
              exiting={FadeOutUp.duration(160)}
              layout={LinearTransition.duration(200)}
              style={s.search}
            >
              <Symbol name="search" size={18} />
              <TextInput
                ref={input}
                autoFocus
                value={query}
                onChangeText={setQuery}
                placeholder="Stories, ideas, things that matter…"
                placeholderTextColor={e.muted}
                accessibilityLabel="Search stories and topics"
                style={{
                  flex: 1,
                  fontFamily: fontFamily.body,
                  fontSize: 16,
                  minHeight: 48,
                  color: e.ink,
                }}
              />
              <Pressable
                onPress={() => {
                  setQuery("");
                  setSearchOpen(false);
                  router.setParams({ search: undefined });
                }}
                accessibilityRole="button"
                accessibilityLabel="Close search"
                style={s.smallButton}
              >
                <Symbol name="close" size={18} />
              </Pressable>
            </Animated.View>
          )}
          {!searchOpen && (
            <Animated.View
              entering={FadeInDown.duration(220)}
              exiting={FadeOutUp.duration(150)}
              layout={LinearTransition.duration(200)}
            >
              <Text
                style={[
                  type.title,
                  { marginTop: 16, fontSize: 38, lineHeight: 44 },
                ]}
              >
                A new way to{`\n`}see your world.
              </Text>
              <Text style={[type.body, { marginTop: 8 }]}>
                Pick a feeling. Find a fresh perspective.
              </Text>
            </Animated.View>
          )}
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 22,
            gap: 8,
            paddingBottom: 22,
            paddingTop: 16,
          }}
        >
          {modes.map((item) => (
            <Pressable
              key={item}
              onPress={() => setMode(item)}
              accessibilityRole="button"
              accessibilityState={{ selected: mode === item }}
              aria-pressed={mode === item}
              style={[
                s.chip,
                mode === item && { backgroundColor: e.ink, borderColor: e.ink },
              ]}
            >
              <Text
                style={[
                  type.button,
                  { fontSize: 14, color: mode === item ? e.white : e.ink },
                ]}
              >
                {item}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
        {isPending ? (
          <ActivityIndicator style={{ height: 250 }} color={e.ink} />
        ) : isError ? (
          <View style={s.intro}>
            <Text style={type.body}>The reading room couldn’t connect.</Text>
            <Pressable onPress={() => refetch()} style={s.chip}>
              <Text style={type.button}>Try again</Text>
            </Pressable>
          </View>
        ) : ordered.length === 0 ? (
          <View style={[s.intro, { paddingVertical: 40 }]}>
            <Text style={type.title}>A different direction?</Text>
            <Text style={type.body}>No stories match this search yet.</Text>
            <Pressable
              onPress={() => {
                setQuery("");
                setTopicFilter(null);
              }}
              style={s.chip}
            >
              <Text style={type.button}>Show all stories</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <ScrollView
              ref={rail}
              horizontal
              showsHorizontalScrollIndicator={false}
              snapToInterval={storyWidth + 12}
              decelerationRate="fast"
              disableIntervalMomentum
              onMomentumScrollEnd={(event) =>
                setStoryIndex(
                  Math.max(
                    0,
                    Math.min(
                      ordered.length - 1,
                      Math.round(
                        event.nativeEvent.contentOffset.x / (storyWidth + 12),
                      ),
                    ),
                  ),
                )
              }
              contentContainerStyle={{ paddingHorizontal: 22, gap: 12 }}
            >
              {ordered.map((card, index) => {
                const dataCard = isDataCard(card) && card.metric;
                const saved = savedIds.includes(card.id);
                return (
                  <View
                    key={card.id}
                    style={[
                      s.story,
                      {
                        width: storyWidth,
                        backgroundColor: canvases[index % 4],
                      },
                    ]}
                  >
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Read ${card.headline}`}
                      onPress={() => router.push(`/card/${card.slug}`)}
                      style={{ flex: 1 }}
                    >
                      <View style={{ height: 245, overflow: "hidden" }}>
                        <Image
                          source={{ uri: card.image.url }}
                          placeholder={{ uri: card.image.blurDataURL }}
                          contentFit="cover"
                          style={StyleSheet.absoluteFill}
                          accessibilityLabel={card.image.alt}
                        />
                        <LinearGradient
                          colors={
                            dataCard
                              ? ["#11121012", "#111210E8"]
                              : ["transparent", "#11121070"]
                          }
                          locations={[0.08, 1]}
                          style={StyleSheet.absoluteFill}
                        />
                        {dataCard ? (
                          <View style={s.metricOnPhoto}>
                            <Text style={[type.label, { color: e.white }]}>
                              The bigger picture
                            </Text>
                            <Text
                              adjustsFontSizeToFit
                              numberOfLines={1}
                              style={{
                                fontFamily: fontFamily.headline,
                                fontSize: Math.min(
                                  84,
                                  ((storyWidth - 48) * 1.5) /
                                    `${dataCard.value}${dataCard.unit}`.length,
                                ),
                                lineHeight: 96,
                                color: e.white,
                              }}
                            >
                              {dataCard.value}
                              {dataCard.unit}
                            </Text>
                            <Text
                              style={[type.body, { color: e.white, fontSize: 14 }]}
                            >
                              {isDataCard(card) ? card.surveySource.name : ""}
                            </Text>
                          </View>
                        ) : null}
                      </View>
                      <View style={{ padding: 20, paddingBottom: 12 }}>
                        <Text style={[type.label, { color: e.ink }]}>
                          {card.primaryGenre?.title ?? "A fresh perspective"}
                        </Text>
                        <Text
                          numberOfLines={3}
                          style={{
                            fontFamily: fontFamily.headline,
                            fontSize: 25,
                            lineHeight: 30,
                            marginTop: 8,
                            color: e.ink,
                            minHeight: 90,
                          }}
                        >
                          {card.headline}
                        </Text>
                        <View style={s.read}>
                          <Text style={type.button}>Read the story</Text>
                          <View style={s.readArrow}>
                            <Symbol name="arrow" color={e.white} size={20} />
                          </View>
                        </View>
                      </View>
                    </Pressable>
                    <Pressable
                      onPress={() => {
                        toggleSaved(card.id);
                        trackEvent(saved ? "card_unsave" : "card_save", {
                          cardId: card.id,
                        });
                      }}
                      accessibilityRole="button"
                      accessibilityLabel={
                        saved ? "Remove from saved" : "Save story"
                      }
                      accessibilityState={{ selected: saved }}
                      aria-pressed={saved}
                      style={s.save}
                    >
                      <BookmarkIcon color={e.ink} size={21} active={saved} />
                    </Pressable>
                  </View>
                );
              })}
            </ScrollView>
            <View style={s.railControls}>
              <Text style={type.label}>
                {String(storyIndex + 1).padStart(2, "0")} /{" "}
                {String(ordered.length).padStart(2, "0")} ·{" "}
                {topicFilter
                  ? topics.find((t) => t.slug === topicFilter)?.title
                  : "Selected for your curiosity"}
              </Text>
              <View style={{ flexDirection: "row", gap: 4 }}>
                <Pressable
                  onPress={() => jump(storyIndex - 1)}
                  disabled={storyIndex === 0}
                  accessibilityRole="button"
                  accessibilityLabel="Previous story"
                  style={[
                    s.smallButton,
                    { opacity: storyIndex === 0 ? 0.3 : 1 },
                  ]}
                >
                  <ChevronLeftIcon color={e.ink} size={21} />
                </Pressable>
                <Pressable
                  onPress={() => jump(storyIndex + 1)}
                  disabled={storyIndex === ordered.length - 1}
                  accessibilityRole="button"
                  accessibilityLabel="Next story"
                  style={[
                    s.smallButton,
                    { opacity: storyIndex === ordered.length - 1 ? 0.3 : 1 },
                  ]}
                >
                  <Symbol name="arrow" size={20} />
                </Pressable>
              </View>
            </View>
          </>
        )}
        <View style={s.section}>
          <Text style={type.label}>
            Make it yours · {selected.length} followed
          </Text>
          <Text style={[type.title, { fontSize: 30, marginTop: 5 }]}>
            Keep your interests close.
          </Text>
          <Text style={[type.body, { fontSize: 14 }]}>
            Tap a topic to explore. Tap + to keep it.
          </Text>
          <View style={s.topicGrid}>
            {(showAll ? topics : topics.slice(0, 4)).map((topic, index) => (
              <View
                key={topic.id}
                style={[
                  s.topic,
                  {
                    backgroundColor: canvases[index % 4],
                    borderColor:
                      topicFilter === topic.slug ? e.ink : "transparent",
                  },
                ]}
              >
                <Pressable
                  onPress={() => {
                    setTopicFilter(
                      topicFilter === topic.slug ? null : topic.slug,
                    );
                    page.current?.scrollTo({ y: 0, animated: true });
                  }}
                  accessibilityRole="button"
                  accessibilityState={{ selected: topicFilter === topic.slug }}
                  aria-pressed={topicFilter === topic.slug}
                  accessibilityLabel={`Explore ${topic.title}`}
                  style={{ flex: 1, padding: 16, paddingBottom: 56 }}
                >
                  <Text style={type.label}>
                    {String(index + 1).padStart(2, "0")}
                  </Text>
                  <Text
                    style={{
                      fontFamily: fontFamily.headline,
                      fontSize: 21,
                      lineHeight: 25,
                      color: e.ink,
                      marginTop: 16,
                    }}
                  >
                    {topic.title}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    toggle(topic.slug);
                    trackEvent(
                      selected.includes(topic.slug)
                        ? "genre_unfollow"
                        : "genre_follow",
                      { topicSlug: topic.slug },
                    );
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={`${selected.includes(topic.slug) ? "Unfollow" : "Follow"} ${topic.title}`}
                  style={[
                    s.smallButton,
                    {
                      position: "absolute",
                      bottom: 8,
                      right: 10,
                      borderRadius: 24,
                      backgroundColor: "#FFFFFF88",
                    },
                  ]}
                >
                  {selected.includes(topic.slug) ? (
                    <CheckIcon color={e.ink} size={18} />
                  ) : (
                    <Text style={[type.button, { fontSize: 25 }]}>+</Text>
                  )}
                </Pressable>
              </View>
            ))}
          </View>
          {topicFilter && (
            <Pressable onPress={() => setTopicFilter(null)} style={s.chip}>
              <Text style={type.button}>Clear topic filter</Text>
            </Pressable>
          )}
          {topics.length > 4 && (
            <Pressable
              onPress={() => setShowAll(!showAll)}
              accessibilityRole="button"
              style={{ padding: 14, alignItems: "center" }}
            >
              <Text style={type.button}>
                {showAll ? "Fewer topics" : "Explore all topics"}
              </Text>
            </Pressable>
          )}
        </View>
        <Pressable
          onPress={() => router.push("/pulse")}
          accessibilityRole="button"
          style={s.pulse}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Text style={[type.label, { color: e.ink }]}>Women’s Pulse</Text>
            <PulseIcon color={e.ink} size={25} />
          </View>
          <Text style={[type.title, { marginTop: 20, fontSize: 32 }]}>
            The world is moving.{`\n`}So are we.
          </Text>
          <Text style={[type.body, { marginTop: 10, color: e.ink }]}>
            {metric
              ? `${metric.value.toLocaleString("en-IN")} ${metric.unit} · ${metric.label}`
              : "Real numbers. Women’s lives. See the bigger picture."}
          </Text>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              marginTop: 20,
            }}
          >
            <Text style={type.button}>Take a closer look</Text>
            <Symbol name="arrow" />
          </View>
        </Pressable>
      </ScrollView>
    </View>
  );
}
const s = StyleSheet.create({
  intro: { paddingHorizontal: 22 },
  search: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingLeft: 14,
    borderWidth: 1,
    borderColor: e.line,
    borderRadius: 18,
    backgroundColor: e.white,
    marginTop: 10,
  },
  chip: {
    minHeight: 44,
    borderRadius: 24,
    paddingHorizontal: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: e.line,
    marginTop: 0,
  },
  story: { borderRadius: 30, overflow: "hidden" },
  metricOnPhoto: {
    position: "absolute",
    inset: 0,
    justifyContent: "flex-end",
    padding: 24,
  },
  save: {
    position: "absolute",
    right: 14,
    top: 14,
    width: 46,
    height: 46,
    borderRadius: 24,
    backgroundColor: e.white,
    justifyContent: "center",
    alignItems: "center",
  },
  read: {
    marginTop: 16,
    padding: 5,
    paddingLeft: 18,
    backgroundColor: e.white,
    borderRadius: 28,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  readArrow: {
    width: 38,
    height: 38,
    borderRadius: 20,
    backgroundColor: e.ink,
    alignItems: "center",
    justifyContent: "center",
  },
  smallButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  railControls: {
    marginHorizontal: 22,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
  },
  section: { paddingHorizontal: 22, paddingVertical: 24 },
  topicGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 18 },
  topic: {
    width: "48%",
    flexGrow: 1,
    minHeight: 176,
    borderRadius: 22,
    borderWidth: 1.5,
    overflow: "hidden",
  },
  pulse: {
    marginHorizontal: 22,
    padding: 24,
    backgroundColor: e.blue,
    borderRadius: 26,
    marginTop: 6,
  },
});
