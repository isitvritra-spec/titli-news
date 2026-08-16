import { Path } from "react-native-svg";

import { IconBase, type IconProps } from "./Icon";

/** The detail screen's back affordance, top-left. */
export function ChevronLeftIcon({ size = 22, color }: IconProps) {
  return (
    <IconBase size={size} viewBox="0 0 20 20">
      <Path
        d="M12.5 4.5L6 10l6.5 5.5"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </IconBase>
  );
}
