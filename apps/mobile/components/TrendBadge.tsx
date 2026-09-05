import { Text, View } from "react-native";
import { computeTrend, type Reading } from "@repo/utils";

export function TrendBadge({ readings }: { readings: Reading[] }) {
  const trend = computeTrend(readings);
  if (!trend || trend.direction === "flat" || !trend.previous) return null;

  const direction = trend.direction === "up" ? "+" : "-";

  return (
    <View className="flex-row items-center gap-1">
      <Text className="font-label text-caption text-red">{direction}</Text>
      <Text className="font-body text-caption text-muted">
        {Math.abs(trend.delta).toLocaleString("en-IN")} since {trend.previous.year}
      </Text>
    </View>
  );
}
