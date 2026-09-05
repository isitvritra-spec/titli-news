import { Tabs } from "expo-router/tabs";

import { colors, fontFamily } from "@repo/tokens";
import { HouseIcon, TagIcon, BookmarkIcon } from "../../components/icons";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.surface,
        tabBarInactiveTintColor: colors.muted,
        tabBarActiveBackgroundColor: colors.ink,
        animation: "shift",
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: "transparent",
          borderTopWidth: 1,
          height: 74,
          paddingTop: 6,
          paddingBottom: 6,
          marginHorizontal: 14,
          marginBottom: 10,
          borderRadius: 24,
          position: "absolute",
          shadowColor: colors.ink,
          shadowOpacity: 0.08,
          shadowRadius: 18,
          shadowOffset: { width: 0, height: 7 },
          elevation: 8,
        },
        tabBarLabelStyle: {
          fontFamily: fontFamily.label,
          fontSize: 12,
          lineHeight: 16,
          marginTop: -1,
          marginBottom: 2,
        },
        tabBarIconStyle: {
          marginTop: 3,
        },
        tabBarItemStyle: {
          height: 58,
          marginHorizontal: 4,
          marginVertical: 2,
          borderRadius: 18,
          overflow: "hidden",
        },
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Today",
          tabBarIcon: ({ color }) => <HouseIcon size={22} color={String(color)} />,
        }}
      />
      <Tabs.Screen
        name="topics"
        options={{
          title: "Explore",
          tabBarIcon: ({ color }) => <TagIcon size={22} color={String(color)} />,
        }}
      />
      <Tabs.Screen
        name="saved"
        options={{
          title: "Saved",
          tabBarIcon: ({ color, focused }) => <BookmarkIcon size={22} color={String(color)} active={focused} />,
        }}
      />
    </Tabs>
  );
}
