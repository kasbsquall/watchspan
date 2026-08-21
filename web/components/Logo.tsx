/* The Watchspan mark: two measurement serifs bound the span, and the line
   between them steps down as attention is spent. Inherits currentColor so it
   works on any surface; the amber stroke is the mark's one fixed colour. */
export default function Logo({ size = 22 }: { size?: number }) {
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      aria-hidden
      className="shrink-0"
    >
      <g fill="none" stroke="currentColor" strokeLinecap="square">
        <path d="M 10 16 L 10 48" strokeWidth="2.4" />
        <path d="M 54 16 L 54 48" strokeWidth="2.4" strokeOpacity="0.55" />
      </g>
      <path
        d="M 10 24 L 22 24 L 22 31 L 34 31 L 34 39 L 44 39 L 44 45 L 54 45"
        fill="none"
        stroke="var(--color-ember-500)"
        strokeWidth="2.6"
        strokeLinejoin="miter"
      />
    </svg>
  );
}
