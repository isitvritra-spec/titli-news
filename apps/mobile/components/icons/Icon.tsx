import Svg from "react-native-svg";
import type { ReactNode } from "react";

/**
 * Shared shape for every icon in this folder — thin single-weight line art
 * (fill="none", round caps/joins), per design-guide.md's "thin line icons
 * only" rule. Height is derived from the viewBox's own aspect ratio so a
 * non-square icon (like ButterflyMark) doesn't need a separate height prop.
 */
export type IconProps = {
  size?: number;
  color: string;
};

export function IconBase({
  size = 20,
  viewBox,
  children,
}: {
  size?: number;
  viewBox: string;
  children: ReactNode;
}) {
  const [, , w, h] = viewBox.split(" ").map(Number);
  return (
    <Svg width={size} height={(size * h) / w} viewBox={viewBox} fill="none">
      {children}
    </Svg>
  );
}
