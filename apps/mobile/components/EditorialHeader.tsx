import { Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";
import { colors, derived } from "@repo/tokens";

import { ButterflyMark } from "./icons";

export function EditorialHeader({
  eyebrow,
  title,
  description,
  compact = false,
  progress,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  compact?: boolean;
  progress?: { current: number; total: number };
}) {
  const insets = useSafeAreaInsets();

  return (
    <Animated.View
      entering={FadeInDown.duration(360)}
      style={{
        paddingTop: insets.top + 8,
        paddingHorizontal: 20,
        backgroundColor: colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: derived.hairline,
      }}
    >
      <View className="flex-row items-center pb-3">
        <ButterflyMark size={compact ? 24 : 28} color={colors.red} />
        <View className="ml-2.5 min-w-0 flex-1">
          <Text className="font-label text-[11px] uppercase tracking-[1.6px] text-red">
            {eyebrow}
          </Text>
          <Text
            className={`font-headline text-ink ${compact ? "text-[22px] leading-[30px]" : "text-[36px] leading-[47px]"}`}
            numberOfLines={1}
          >
            {title}
          </Text>
        </View>
        {progress ? (
          <Text className="ml-3 font-label text-[11px] tabular-nums text-muted">
            {Math.min(progress.current, progress.total)}/{progress.total}
          </Text>
        ) : null}
      </View>

      {description ? (
        <Text className="max-w-[92%] pb-4 font-body text-[15px] leading-[22px] text-muted">
          {description}
        </Text>
      ) : null}

      {progress ? (
        <View className="pb-3 pt-1">
          <View className="h-px overflow-hidden bg-hairline">
            <LinearGradient
              colors={[colors.red, colors.plum, colors.lime]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                width: `${Math.min(progress.current / progress.total, 1) * 100}%`,
                height: 1,
              }}
            />
          </View>
        </View>
      ) : null}
    </Animated.View>
  );
}
