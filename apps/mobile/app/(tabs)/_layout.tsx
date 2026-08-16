import { Tabs } from "expo-router/tabs";

import { colors, derived, fontFamily } from "@repo/tokens";
import { HouseIcon, TagIcon, BookmarkIcon } from "../../components/icons";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.gold,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: derived.hairline,
          borderTopWidth: 1,
        },
        tabBarLabelStyle: {
          fontFamily: fontFamily.label,
          fontSize: 11,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Feed",
          tabBarIcon: ({ color }) => <HouseIcon size={22} color={String(color)} />,
        }}
      />
      <Tabs.Screen
        name="topics"
        options={{
          title: "Topics",
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
