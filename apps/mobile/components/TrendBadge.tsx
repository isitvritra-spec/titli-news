import { Text, View } from "react-native";
import { computeTrend, type Reading } from "@repo/utils";

/**
 * The ▲/▼ next to a data card's stat. Uses the one shared trend-computation
 * function (@repo/utils) that the website also calls, so the direction
 * shown here can never disagree with the web version of the same card.
 */
export function TrendBadge({ readings }: { readings: Reading[] }) {
  const trend = computeTrend(readings);
  if (!trend || trend.direction === "flat" || !trend.previous) return null;

  const arrow = trend.direction === "up" ? "▲" : "▼";

  return (
    <View className="flex-row items-center gap-1">
      <Text className="text-gold text-xs font-body">{arrow}</Text>
      <Text className="text-gold text-xs font-body">
        {Math.abs(trend.delta).toLocaleString("en-IN")} since {trend.previous.year}
      </Text>
    </View>
  );
}
