import icons from "@repo/tokens/icons";

const butterfly = icons.butterfly;

/**
 * The real Titli line-art mark, from the design export — shared with
 * apps/mobile via @repo/tokens/icons so it can't drift between platforms.
 * Drawn as plain stroked SVG (no fill) so it's crisp at any size with zero
 * external asset dependency.
 */
export function ButterflyIcon({ size = 22, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={(size * 52) / 64}
      viewBox={butterfly.viewBox}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {butterfly.paths.map((p: { d: string; strokeWidth: number }, i: number) => (
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

export function BrandMark({ size = 22, showWordmark = true }: { size?: number; showWordmark?: boolean }) {
  return (
    <span className="flex items-center gap-2 text-gold">
      <ButterflyIcon size={size} />
      {showWordmark ? <span className="font-headline text-label text-ink">Titli</span> : null}
    </span>
  );
}
