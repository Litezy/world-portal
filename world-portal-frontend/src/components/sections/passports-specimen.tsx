import { passports } from "@/content/landing";
import { cn } from "@/lib/utils";

import styles from "./passports-specimen.module.css";

const { specimen } = passports;

/**
 * The security print behind both pages: interleaved sine bands, generated
 * once on the server. Pure decoration, in the paper's own line colour.
 */
function guillochePaths(width: number, height: number, bands: number, seed: number) {
  const paths: string[] = [];
  for (let b = 0; b < bands; b++) {
    const base = ((b + 0.5) / bands) * height;
    const amp = height / bands / 1.6;
    const freq = (2 * Math.PI * (2 + ((b + seed) % 3))) / width;
    for (let phase = 0; phase < 3; phase++) {
      let d = "";
      for (let x = 0; x <= width; x += 4) {
        const y = base + amp * Math.sin(x * freq + phase * 2.1 + b);
        d += `${x === 0 ? "M" : "L"}${x} ${y.toFixed(1)}`;
      }
      paths.push(d);
    }
  }
  return paths;
}

const TOP_LINES = guillochePaths(250, 168, 5, 1);
const BOTTOM_LINES = guillochePaths(250, 168, 4, 2);

function Guilloche({ lines }: { lines: string[] }) {
  return (
    <svg
      viewBox="0 0 250 168"
      preserveAspectRatio="none"
      className={styles.guilloche}
      aria-hidden="true"
    >
      <g fill="none" stroke="currentColor" strokeWidth="0.45">
        {lines.map((d, i) => (
          <path key={i} d={d} />
        ))}
      </g>
    </svg>
  );
}

/** A plain head-and-shoulders portrait, drawn in the brand blues. */
function Portrait() {
  return (
    <svg viewBox="0 0 70 90" className={styles.portrait} aria-hidden="true">
      <defs>
        <linearGradient id="pp-backdrop" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--brand-100)" />
          <stop offset="1" stopColor="var(--brand-200)" />
        </linearGradient>
        <linearGradient id="pp-figure" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--brand-700)" />
          <stop offset="1" stopColor="var(--brand-900)" />
        </linearGradient>
      </defs>
      <rect width="70" height="90" fill="url(#pp-backdrop)" />
      <circle cx="35" cy="36" r="14.5" fill="url(#pp-figure)" />
      <path d="M8 90c1.5-17 12-27 27-27s25.5 10 27 27z" fill="url(#pp-figure)" />
    </svg>
  );
}

/** A field whose text types in; `bar` is the width of its stand-in bar. */
function Field({
  label,
  value,
  index,
  bar,
  wide,
  roll,
}: {
  label: string;
  value: string;
  index: number;
  bar: string;
  wide?: boolean;
  /** A later value it rolls to, and at which stage. */
  roll?: { to: string; at: "renewal" | "replacement" };
}) {
  return (
    <div className={cn(wide && styles.wide)}>
      <span className={styles.label}>{label}</span>
      <span
        className={styles.value}
        style={{ "--bar-w": bar, "--i": index } as React.CSSProperties}
      >
        <span className={styles.ink}>
          {roll ? (
            <span className={styles.roll}>
              <span className={cn(styles.rollTrack, styles[roll.at])}>
                <span>{value}</span>
                <span>{roll.to}</span>
              </span>
            </span>
          ) : (
            value
          )}
        </span>
      </span>
    </div>
  );
}

/**
 * The specimen passport for the Passports section (see
 * `passports-specimen.module.css` for the four stages). Rendered at the
 * final stage; `PassportsMotion` rewinds and replays it with the scroll.
 * Hidden from assistive tech, with `specimen.description` alongside.
 */
export function PassportSpecimen({ className }: { className?: string }) {
  const f = specimen.fields;

  return (
    <figure className={cn("m-0", className)}>
      <div data-pp-visual data-stage="3" aria-hidden="true" className={styles.root}>
        <div className={styles.cover} />

        {/* The visa page: where the stamp lands. */}
        <div className={cn(styles.page, styles.top)}>
          <Guilloche lines={TOP_LINES} />
          <span className={styles.pageLabel}>{specimen.visaPage}</span>
          <span className={styles.pageNumber}>3</span>
          <div className={styles.stamp}>
            <span className={styles.stampWord}>{specimen.stamp.word}</span>
            <span className={styles.stampDetail}>{specimen.stamp.detail}</span>
          </div>
        </div>

        {/* The data page. */}
        <div className={cn(styles.page, styles.bottom)}>
          <Guilloche lines={BOTTOM_LINES} />
          <span className={styles.watermark}>{specimen.watermark}</span>

          <div className={styles.dataHead}>
            <span className={styles.type}>P</span>
            <span>{specimen.title}</span>
            <span className={styles.chip}>
              <svg viewBox="0 0 36 28" className={styles.chipLines} aria-hidden="true">
                <path
                  d="M0 9h11M0 19h11M25 9h11M25 19h11M11 0v28M25 0v28M11 14h14"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.4"
                />
              </svg>
              <span className={styles.glint} />
            </span>
          </div>

          <div className={styles.dataBody}>
            <div className={styles.photo}>
              <span className={styles.photoEmpty} />
              <Portrait />
              <span className={styles.flash} />
            </div>

            <div className={styles.fields}>
              <Field wide index={0} bar="70%" {...f.surname} />
              <Field wide index={1} bar="62%" {...f.given} />
              <Field index={2} bar="88%" {...f.birth} />
              <Field
                index={3}
                bar="92%"
                label={f.number.label}
                value={f.number.value}
                roll={{ to: f.number.renewed, at: "replacement" }}
              />
              <Field
                index={4}
                bar="88%"
                label={f.issue.label}
                value={f.issue.value}
                roll={{ to: f.issue.renewed, at: "renewal" }}
              />
              <Field
                index={5}
                bar="88%"
                label={f.expiry.label}
                value={f.expiry.value}
                roll={{ to: f.expiry.renewed, at: "renewal" }}
              />
            </div>
          </div>

          <div className={styles.mrz}>
            {specimen.mrz.map((line) => (
              <span key={line}>{line}</span>
            ))}
          </div>
        </div>
      </div>
      <figcaption className="sr-only">{specimen.description}</figcaption>
    </figure>
  );
}
