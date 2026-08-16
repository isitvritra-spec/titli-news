import icons from "@repo/tokens/icons";

const bookmark = icons.bookmark;

/**
 * The save/bookmark toggle — same shape as apps/mobile's, from
 * @repo/tokens/icons. `active` swaps it from outline to filled.
 */
export function BookmarkIcon({
  size = 18,
  active = false,
  className = "",
}: {
  size?: number;
  active?: boolean;
  className?: string;
}) {
  const [, , vbW, vbH] = bookmark.viewBox.split(" ").map(Number);
  return (
    <svg
      width={size}
      height={(size * vbH) / vbW}
      viewBox={bookmark.viewBox}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {bookmark.paths.map((p: { d: string; strokeWidth: number }, i: number) => (
        <path
          key={i}
          d={p.d}
          stroke="currentColor"
          fill={active ? "currentColor" : "none"}
          strokeWidth={p.strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
    </svg>
  );
}
