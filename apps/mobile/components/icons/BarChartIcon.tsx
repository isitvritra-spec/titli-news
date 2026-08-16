import { Path } from "react-native-svg";

import { IconBase, type IconProps } from "./Icon";

/** Onboarding slide 2 — "Every number shows its source". */
export function BarChartIcon({ size = 40, color }: IconProps) {
  return (
    <IconBase size={size} viewBox="0 0 32 32">
      <Path d="M5 27V13" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      <Path d="M13 27V7" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      <Path d="M21 27V17" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      <Path d="M27 27V10" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      <Path d="M3 27H29" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </IconBase>
  );
}
