import { Path } from "react-native-svg";
import icons from "@repo/tokens/icons";

import { IconBase, type IconProps } from "./Icon";

const share = icons.share;

/** The card footer's share button. */
export function ShareIcon({ size = 18, color }: IconProps) {
  return (
    <IconBase size={size} viewBox={share.viewBox}>
      {share.paths.map((p: { d: string; strokeWidth: number }, i: number) => (
        <Path key={i} d={p.d} stroke={color} strokeWidth={p.strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      ))}
    </IconBase>
  );
}
