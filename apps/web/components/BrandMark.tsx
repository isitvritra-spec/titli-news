/**
 * The line-art butterfly mark from the brief, now with a name: Titli
 * (Hindi for butterfly). Drawn as plain stroked SVG (no fill) — "line-art"
 * per the brief's usage notes — so it's crisp at any size with zero
 * external asset dependency.
 */
export function ButterflyIcon({ size = 22, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <line x1="16" y1="9" x2="16" y2="25" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M16 9 L13 4.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
      <path d="M16 9 L19 4.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
      <path
        d="M16 11.5 C 10.5 4.5, 2 6, 4 14 C 5.5 19, 12 17.5, 16 13.5 Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      <path
        d="M16 11.5 C 21.5 4.5, 30 6, 28 14 C 26.5 19, 20 17.5, 16 13.5 Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      <path
        d="M16 14 C 12.5 16, 7.5 18, 8.5 23 C 9.5 26.5, 13.5 24.5, 16 20 Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      <path
        d="M16 14 C 19.5 16, 24.5 18, 23.5 23 C 22.5 26.5, 18.5 24.5, 16 20 Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function BrandMark({ size = 22, showWordmark = true }: { size?: number; showWordmark?: boolean }) {
  return (
    <span className="flex items-center gap-2 text-gold">
      <ButterflyIcon size={size} />
      {showWordmark ? <span className="font-headline text-base text-ink">Titli</span> : null}
    </span>
  );
}
