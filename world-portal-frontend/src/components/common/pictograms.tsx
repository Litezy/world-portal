/**
 * Line pictograms for the "Why World Portal" cards. Drawn rather than pulled
 * from an icon set so each one maps to a specific service rather than a
 * generic shape.
 */
type Props = React.ComponentProps<"svg">;

function Glyph({ children, ...props }: Props) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="size-5"
      {...props}
    >
      {children}
    </svg>
  );
}

/** Passport with a stamp — the visa service. */
export function PassportIcon(props: Props) {
  return (
    <Glyph {...props}>
      <rect x="4.5" y="2.5" width="15" height="19" rx="2.5" />
      <circle cx="12" cy="10" r="3.25" />
      <path d="M12 6.75c-1.4 1.9-1.4 4.6 0 6.5M12 6.75c1.4 1.9 1.4 4.6 0 6.5M8.9 10h6.2" />
      <path d="M9.5 17.5h5" />
    </Glyph>
  );
}

/** Bolt — turnaround speed. */
export function BoltIcon(props: Props) {
  return (
    <Glyph {...props}>
      <path d="M13.5 2.5 5 13.2h5.4l-.9 8.3L18.5 10.8H13l.5-8.3Z" />
    </Glyph>
  );
}

/** Headset — the single point of contact. */
export function ConciergeIcon(props: Props) {
  return (
    <Glyph {...props}>
      <path d="M4 13v-1a8 8 0 0 1 16 0v1" />
      <path d="M4 13.5h1.6a1 1 0 0 1 1 1V18a1 1 0 0 1-1 1H4.8A1.8 1.8 0 0 1 3 17.2v-1.9a1.8 1.8 0 0 1 1-1.8Z" />
      <path d="M20 13.5h-1.6a1 1 0 0 0-1 1V18a1 1 0 0 0 1 1h.8a1.8 1.8 0 0 0 1.8-1.8v-1.9a1.8 1.8 0 0 0-1-1.8Z" />
      <path d="M19 19v.5a2.5 2.5 0 0 1-2.5 2.5H13" />
    </Glyph>
  );
}

/** Compass — curated itineraries. */
export function CompassIcon(props: Props) {
  return (
    <Glyph {...props}>
      <circle cx="12" cy="12" r="9.25" />
      <path d="M15.6 8.4 13.9 14 8.4 15.6 10.1 10Z" />
    </Glyph>
  );
}

/** Ripples — the "infinity pool" style amenity chip. */
export function WavesIcon(props: Props) {
  return (
    <Glyph {...props}>
      <path d="M2.5 7.5c1.3-1 2.6-1 3.9 0s2.6 1 3.9 0 2.6-1 3.9 0 2.6 1 3.9 0 1.4-.5 1.9-.9" />
      <path d="M2.5 12.5c1.3-1 2.6-1 3.9 0s2.6 1 3.9 0 2.6-1 3.9 0 2.6 1 3.9 0 1.4-.5 1.9-.9" />
      <path d="M2.5 17.5c1.3-1 2.6-1 3.9 0s2.6 1 3.9 0 2.6-1 3.9 0 2.6 1 3.9 0 1.4-.5 1.9-.9" />
    </Glyph>
  );
}

/** Low sun — the "sunset" style amenity chip. */
export function SunIcon(props: Props) {
  return (
    <Glyph {...props}>
      <circle cx="12" cy="13" r="3.5" />
      <path d="M12 5.5V3.5M12 22.5v-2M5.6 6.6 4.2 5.2M19.8 20.8l-1.4-1.4M3.5 13h-2M22.5 13h-2M5.6 19.4l-1.4 1.4M19.8 5.2l-1.4 1.4" />
    </Glyph>
  );
}

export const pictograms = {
  passport: PassportIcon,
  bolt: BoltIcon,
  concierge: ConciergeIcon,
  compass: CompassIcon,
} as const;

export type PictogramName = keyof typeof pictograms;
