import { Path } from "react-native-svg";
import icons from "@repo/tokens/icons";

import { IconBase, type IconProps } from "./Icon";

const butterfly = icons.butterfly;

/** The real Titli mark — was a 🦋 emoji placeholder until this export. */
export function ButterflyMark({ size = 64, color }: IconProps) {
  return (
    <IconBase size={size} viewBox={butterfly.viewBox}>
      {butterfly.paths.map((p: { d: string; strokeWidth: number }, i: number) => (
        <Path
          key={i}
          d={p.d}
          stroke={color}
          strokeWidth={p.strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
    </IconBase>
  );
}
