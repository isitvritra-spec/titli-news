import { useEffect, useRef, useState, type RefObject } from "react";
import {
  Keyboard,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { BlurTargetView, BlurView } from "expo-blur";
import { Tabs, type BottomTabBarProps } from "expo-router/js-tabs";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { HouseIcon, BookmarkIcon, PulseIcon } from "../../components/icons";
import { Symbol } from "../../components/ui/Symbol";
import { SearchButton } from "../../components/ui/SearchButton";
import {
  DOCK_HEIGHT,
  dockBottom,
  dockClearance,
} from "../../components/ui/navigation";
import { editorial as e, type } from "../../components/ui/theme";

const dockInk = "#566050";
export default function TabsLayout() {
  const blurTarget = useRef<View>(null);
  return (
    <BlurTargetView ref={blurTarget} style={{ flex: 1 }}>
      <Tabs
        tabBar={(props) => (
          <NavigationDock {...props} blurTarget={blurTarget} />
        )}
        screenOptions={{
          headerShown: false,
          // Directional horizontal transition so moving between tabs reads as a slide.
          animation: "shift",
          transitionSpec: { animation: "timing", config: { duration: 220 } },
          tabBarStyle: { position: "absolute", height: DOCK_HEIGHT },
          tabBarHideOnKeyboard: true,
        }}
      >
        <Tabs.Screen name="index" options={{ title: "Today" }} />
        <Tabs.Screen name="topics" options={{ title: "Explore" }} />
        <Tabs.Screen name="saved" options={{ title: "Saved" }} />
      </Tabs>
    </BlurTargetView>
  );
}
function NavigationDock({
  state,
  navigation,
  blurTarget,
}: BottomTabBarProps & { blurTarget: RefObject<View | null> }) {
  const [open, setOpen] = useState(false);
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const pendingDestination = useRef<(() => void) | null>(null);
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const router = useRouter();
  const current = state.routes[state.index]?.name;
  const menuTop = insets.top + 16;
  const menuBottom = dockClearance(insets.bottom);
  const menuHeight = Math.max(250, height - menuTop - menuBottom);
  const cardHeight = Math.max(146, (menuHeight - 126) / 2);
  useEffect(() => {
    const show = Keyboard.addListener("keyboardDidShow", () =>
      setKeyboardOpen(true),
    );
    const hide = Keyboard.addListener("keyboardDidHide", () =>
      setKeyboardOpen(false),
    );
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);
  function tab(name: string) {
    const route = state.routes.find((item) => item.name === name);
    if (!route) return;
    const event = navigation.emit({
      type: "tabPress",
      target: route.key,
      canPreventDefault: true,
    });
    if (!event.defaultPrevented) navigation.navigate(name);
    setOpen(false);
  }
  function choose(action: () => void) {
    if (Platform.OS === "ios") {
      pendingDestination.current = action;
      setOpen(false);
    } else {
      setOpen(false);
      action();
    }
  }
  const destinations = [
    {
      label: "Explore",
      caption: "A new way to see your world.",
      tint: "#16231A",
      icon: <Symbol name="globe" size={25} color={e.white} />,
      action: () => tab("topics"),
    },
    {
      label: "Today’s seven",
      caption: "Your daily dose of perspective.",
      tint: "#31190E",
      icon: <HouseIcon color={e.white} size={25} />,
      action: () => tab("index"),
    },
    {
      label: "Saved stories",
      caption: "The ones you kept close.",
      tint: "#21172E",
      icon: <BookmarkIcon color={e.white} size={24} />,
      action: () => tab("saved"),
    },
    {
      label: "Women’s Pulse",
      caption: "Little numbers. Bigger stories.",
      tint: "#102026",
      icon: <PulseIcon color={e.white} size={25} />,
      action: () => router.push("/pulse"),
    },
  ];
  return (
    <>
      {!keyboardOpen && (
        <View
          pointerEvents="box-none"
          style={[s.dockWrap, { bottom: dockBottom(insets.bottom) }]}
        >
          <View testID="navigation-dock" style={s.dock}>
            <Pressable
              accessibilityRole="tab"
              accessibilityLabel="Today"
              accessibilityState={{ selected: current === "index" }}
              aria-selected={current === "index"}
              onPress={() => tab("index")}
              style={[s.tab, current === "index" && s.active]}
            >
              <HouseIcon size={19} color={dockInk} />
              <Text style={s.tabLabel}>Today</Text>
            </Pressable>
            <Pressable
              accessibilityRole="tab"
              accessibilityLabel="Explore"
              accessibilityState={{ selected: current === "topics" }}
              aria-selected={current === "topics"}
              onPress={() => tab("topics")}
              style={[s.tab, current === "topics" && s.active]}
            >
              <Symbol name="globe" color={dockInk} size={22} />
              <Text style={s.tabLabel}>Explore</Text>
            </Pressable>
            <Pressable
              accessibilityRole="tab"
              accessibilityLabel="Saved"
              accessibilityState={{ selected: current === "saved" }}
              aria-selected={current === "saved"}
              onPress={() => tab("saved")}
              style={[s.tab, current === "saved" && s.active]}
            >
              <BookmarkIcon
                size={18}
                active={current === "saved"}
                color={dockInk}
              />
              <Text style={s.tabLabel}>Saved</Text>
            </Pressable>
          </View>
        </View>
      )}
      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
        statusBarTranslucent
        onDismiss={() => {
          const action = pendingDestination.current;
          pendingDestination.current = null;
          action?.();
        }}
      >
        <View style={{ flex: 1 }}>
          <BlurView
            testID="explore-backdrop"
            tint="light"
            intensity={45}
            {...(Platform.OS === "android"
              ? { blurTarget, blurMethod: "dimezisBlurViewSdk31Plus" as const }
              : {})}
            style={StyleSheet.absoluteFill}
          />
          <View
            pointerEvents="none"
            style={[StyleSheet.absoluteFill, { backgroundColor: "#F7F5EF55" }]}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Dismiss explore menu"
            onPress={() => setOpen(false)}
            style={StyleSheet.absoluteFill}
          />
          <View
            testID="explore-panel"
            accessibilityViewIsModal
            style={[s.menu, { top: menuTop, bottom: menuBottom }]}
          >
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ padding: 18 }}
            >
              <View style={s.menuHeading}>
                <View>
                  <Text style={type.label}>A little space to explore</Text>
                  <Text style={[type.title, { fontSize: 32, marginTop: 3 }]}>
                    Where next?
                  </Text>
                </View>
                <SearchButton
                  onPress={() =>
                    choose(() => router.navigate("/(tabs)/topics?search=1"))
                  }
                />
              </View>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
                {destinations.map((item) => (
                  <Pressable
                    key={item.label}
                    onPress={() => choose(item.action)}
                    accessibilityRole="button"
                    style={({ pressed }) => [
                      s.destination,
                      {
                        height: cardHeight,
                        backgroundColor: item.tint,
                        opacity: pressed ? 0.8 : 1,
                        transform: [{ scale: pressed ? 0.98 : 1 }],
                      },
                    ]}
                  >
                    <View style={s.photoIcon}>{item.icon}</View>
                    <View style={{ marginTop: "auto" }}>
                      <Text
                        style={[
                          type.title,
                          {
                            color: e.white,
                            fontSize: 25,
                            lineHeight: 30,
                            letterSpacing: -0.5,
                          },
                        ]}
                      >
                        {item.label}
                      </Text>
                      <Text
                        style={[
                          type.body,
                          {
                            color: "#FFFFFFD9",
                            fontSize: 14,
                            lineHeight: 20,
                            marginTop: 8,
                          },
                        ]}
                      >
                        {item.caption}
                      </Text>
                    </View>
                    <View style={{ alignSelf: "flex-end", marginTop: 16 }}>
                      <Symbol name="arrow" color={e.white} size={21} />
                    </View>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          </View>
          <View style={[s.dockWrap, { bottom: dockBottom(insets.bottom) }]}>
            <Pressable
              onPress={() => setOpen(false)}
              accessibilityRole="button"
              accessibilityLabel="Close explore menu"
              style={[s.dock, s.close]}
            >
              <Symbol name="close" color={dockInk} size={20} />
              <Text style={[type.button, { color: dockInk, fontSize: 14 }]}>
                Back to reading
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}
const s = StyleSheet.create({
  dockWrap: {
    position: "absolute",
    left: 26,
    right: 26,
    alignItems: "center",
    zIndex: 100,
    elevation: 20,
  },
  dock: {
    width: "100%",
    maxWidth: 400,
    height: DOCK_HEIGHT,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 4,
    borderWidth: 1,
    borderColor: "#D4D7CB",
    borderRadius: 30,
    backgroundColor: "#E8E9E1",
    shadowColor: "#626B59",
    shadowOpacity: 0.07,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  tab: {
    flex: 1,
    minHeight: 44,
    flexDirection: "row",
    gap: 5,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  tabLabel: { ...type.button, color: dockInk, fontSize: 12, lineHeight: 16 },
  active: { backgroundColor: "#FAFBF5" },
  menu: {
    position: "absolute",
    left: 16,
    right: 16,
    maxWidth: 520,
    alignSelf: "center",
    borderRadius: 28,
    backgroundColor: "#FAF8F4F2",
    borderWidth: 1,
    borderColor: "#FFFFFFB0",
    overflow: "hidden",
  },
  menuHeading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  destination: {
    width: "47%",
    flexGrow: 1,
    borderRadius: 22,
    padding: 20,
    overflow: "hidden",
  },
  photoIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#11121066",
    borderWidth: 1,
    borderColor: "#FFFFFF55",
  },
  close: { justifyContent: "center", gap: 10 },
});
