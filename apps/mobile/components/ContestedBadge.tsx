import { Text, View } from "react-native";

/**
 * A gold-outlined tag, not a new color — "contested" gets attention through
 * the one accent color already in the palette, not an invented warning hue.
 */
export function ContestedBadge() {
  return (
    <View className="self-start rounded-full border border-gold px-3 py-1">
      <Text className="text-gold text-xs font-body uppercase tracking-wide">
        Contested — accounts differ
      </Text>
    </View>
  );
}
