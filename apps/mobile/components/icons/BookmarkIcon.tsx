import { Path } from "react-native-svg";
import icons from "@repo/tokens/icons";

import { IconBase, type IconProps } from "./Icon";

const bookmark = icons.bookmark;

/**
 * The Saved tab icon, and the save/bookmark toggle on cards and the detail
 * screen — same shape everywhere, `active` swaps it from outline to filled.
 */
export function BookmarkIcon({ size = 22, color, active = false }: IconProps & { active?: boolean }) {
  return (
    <IconBase size={size} viewBox={bookmark.viewBox}>
      {bookmark.paths.map((p: { d: string; strokeWidth: number }, i: number) => (
        <Path
          key={i}
          d={p.d}
          stroke={color}
          fill={active ? color : "none"}
          strokeWidth={p.strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
    </IconBase>
  );
}
