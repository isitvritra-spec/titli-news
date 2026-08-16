import { Path } from "react-native-svg";

import { IconBase, type IconProps } from "./Icon";

/** The topic-row selected-state checkmark. */
export function CheckIcon({ size = 16, color }: IconProps) {
  return (
    <IconBase size={size} viewBox="0 0 16 16">
      <Path
        d="M3.5 8.5L6.5 11.5L12.5 4.5"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </IconBase>
  );
}
