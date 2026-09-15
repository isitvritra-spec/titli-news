import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SearchButton } from "./ui/SearchButton";
import { editorial as e, type } from "./ui/theme";

export function EditorialHeader({
  eyebrow,
  title,
  description,
  compact = false,
  progress,
  onSearch,
  greeting = false,
  searchActive = false,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  compact?: boolean;
  progress?: { current: number; total: number };
  onSearch?: () => void;
  greeting?: boolean;
  searchActive?: boolean;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={{
        paddingTop: insets.top + 8,
        paddingHorizontal: 22,
        paddingBottom: 10,
        backgroundColor: e.paper,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <View style={{ flex: 1 }}>
          {greeting && (
            <Text style={[type.body, { fontSize: 13, lineHeight: 19 }]}>
              Hi, curious mind.
            </Text>
          )}
          <Text
            style={[
              type.title,
              { fontSize: compact ? 25 : 30, lineHeight: compact ? 32 : 38 },
            ]}
          >
            {title === "TITLI" ? "Your daily Titli" : title}
          </Text>
        </View>
        <SearchButton onPress={onSearch} active={searchActive} />
      </View>
      {description ? (
        <Text style={[type.body, { fontSize: 14, marginTop: 8 }]}>
          {description}
        </Text>
      ) : null}
      {progress ? (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
            marginTop: 8,
          }}
        >
          <Text
            numberOfLines={1}
            style={[type.label, { flex: 1, fontSize: 9, letterSpacing: 1 }]}
          >
            {eyebrow}
          </Text>
          <Text style={[type.label, { fontSize: 11 }]}>
            {Math.min(progress.current, progress.total)}/{progress.total}
          </Text>
        </View>
      ) : null}
    </View>
  );
}
