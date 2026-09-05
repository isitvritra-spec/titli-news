import { Path } from "react-native-svg";

import { IconBase, type IconProps } from "./Icon";

export function PulseIcon({ size = 20, color }: IconProps) {
  return (
    <IconBase size={size} viewBox="0 0 20 20">
      <Path
        d="M2 10h3l2-4 3 8 2.3-5 1.5 3H18"
        stroke={color}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </IconBase>
  );
}
