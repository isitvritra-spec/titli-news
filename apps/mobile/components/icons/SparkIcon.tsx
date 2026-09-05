import { Path } from "react-native-svg";

import { IconBase, type IconProps } from "./Icon";

export function SparkIcon({ size = 20, color }: IconProps) {
  return (
    <IconBase size={size} viewBox="0 0 20 20">
      <Path
        d="M10 2.5 11.7 8l5.3 2-5.3 2-1.7 5.5L8.3 12 3 10l5.3-2L10 2.5Z"
        stroke={color}
        strokeWidth={1.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </IconBase>
  );
}
