import icons from "@repo/tokens/icons";

const share = icons.share;

/** The card footer's share button — same shape as apps/mobile's. */
export function ShareIcon({ size = 18, className = "" }: { size?: number; className?: string }) {
  const [, , vbW, vbH] = share.viewBox.split(" ").map(Number);
  return (
    <svg
      width={size}
      height={(size * vbH) / vbW}
      viewBox={share.viewBox}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {share.paths.map((p: { d: string; strokeWidth: number }, i: number) => (
        <path
          key={i}
          d={p.d}
          stroke="currentColor"
          strokeWidth={p.strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
    </svg>
  );
}
