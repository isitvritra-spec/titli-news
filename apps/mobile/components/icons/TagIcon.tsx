import { Circle, Path } from "react-native-svg";

import { IconBase, type IconProps } from "./Icon";

/**
 * The topic-picker shape — used both for onboarding slide 3 ("Pick what
 * you follow") and the Topics tab icon. One viewBox scales cleanly to
 * either size, so there's no need for two near-duplicate path sets.
 */
export function TagIcon({ size = 22, color }: IconProps) {
  return (
    <IconBase size={size} viewBox="0 0 20 20">
      <Path
        d="M3 4a1 1 0 0 1 1-1h5.5a1 1 0 0 1 .7.3l6.5 6.5a1 1 0 0 1 0 1.4l-6.1 6.1a1 1 0 0 1-1.4 0L2.7 11.1a1 1 0 0 1-.3-.7V4Z"
        stroke={color}
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
      <Circle cx={7.2} cy={7.2} r={1.1} stroke={color} strokeWidth={1.3} />
    </IconBase>
  );
}
