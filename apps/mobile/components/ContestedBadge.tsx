import { Text, View } from "react-native";

export function ContestedBadge() {
  return (
    <View className="self-start rounded-full bg-pressed px-3 py-1.5">
      <Text className="font-label text-[11px] text-red">Accounts differ</Text>
    </View>
  );
}
