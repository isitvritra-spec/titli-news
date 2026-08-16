import { Path } from "react-native-svg";

import { IconBase, type IconProps } from "./Icon";

/** The Feed tab icon. */
export function HouseIcon({ size = 22, color }: IconProps) {
  return (
    <IconBase size={size} viewBox="0 0 20 20">
      <Path
        d="M3 8.5L10 3l7 5.5V16a1 1 0 0 1-1 1h-3v-5H7v5H4a1 1 0 0 1-1-1V8.5Z"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </IconBase>
  );
}
