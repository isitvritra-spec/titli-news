import { Pressable } from "react-native";
import { useRouter } from "expo-router";
import { Symbol } from "./Symbol";
import { editorial as e } from "./theme";

export function SearchButton({
  onPress,
  active = false,
}: {
  onPress?: () => void;
  active?: boolean;
}) {
  const router = useRouter();
  return (
    <Pressable
      onPress={onPress ?? (() => router.navigate("/(tabs)/topics?search=1"))}
      accessibilityRole="button"
      accessibilityLabel="Search stories"
      accessibilityState={{ expanded: active }}
      aria-expanded={active}
      style={({ pressed }) => ({
        width: 44,
        height: 44,
        borderRadius: 24,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: active ? "#E7EADD" : e.white,
        borderWidth: 1,
        borderColor: active ? "#C6CFB8" : e.line,
        opacity: pressed ? 0.72 : 1,
        transform: [{ scale: pressed ? 0.96 : 1 }],
      })}
    >
      <Symbol name="search" size={19} color="#535D50" />
    </Pressable>
  );
}
