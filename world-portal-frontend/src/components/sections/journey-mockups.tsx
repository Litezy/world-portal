import * as React from "react";

import type { gsap } from "gsap";

import { journey } from "@/content/landing";
import { Card } from "@/ds/components/card";
import { Chip } from "@/ds/components/chip";
import { Icon, type IconName, IconTile } from "@/ds/components/icon";
import { cn } from "@/lib/utils";

/*
 * The four "Example trip" mock-ups the How It Works stage plays through, and
 * the scrubbed sequence that plays each one.
 *
 * They are illustrations, not UI: every value is sample data from
 * `journey.demo`, nothing is focusable, and the whole stage is aria-hidden
 * (the section carries a one-line description instead). Markup and motion
 * live side by side because the sequences find their targets by the
 * `data-mk` hooks below; rename one and you must rename the other.
 *
 * Every mock-up renders in its FINAL state. On phones and under reduced
 * motion that is all anyone sees, and on desktop the timeline sets the
 * starting state itself when it is built.
 */

const { demo } = journey;

/** Lucide's "plane" (ISC), drawn on the kit's duotone model like the forecast glyphs. */
const PLANE =
  "M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z";

/** The kit has no plane, so this one renders through its `.cx-icon` classes. */
export function PlaneGlyph({
  tone = "gradient",
  className,
}: {
  tone?: "gradient" | "white" | "current";
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      className={cn("cx-icon", `cx-icon--${tone}`, className)}
    >
      <path className={cn("b")} d={PLANE} />
      <path className={cn("f")} d={PLANE} />
    </svg>
  );
}

/** One span per character, so a field can "type" with opacity alone. */
function Typed({ text }: { text: string }) {
  return (
    <>
      {Array.from(text).map((char, i) => (
        <span key={i} data-char>
          {char}
        </span>
      ))}
    </>
  );
}

/** The mock-ups' shared shell: a lifted kit card that follows the page theme. */
function MockCard({ className, children, ...rest }: React.HTMLAttributes<HTMLElement>) {
  return (
    <Card
      elevated
      className={cn(
        "w-full gap-0 p-0 text-foreground",
        "shadow-[0_44px_90px_-28px_rgb(2_8_23/0.5),0_14px_30px_-14px_rgb(2_8_23/0.3),inset_0_0_0_1px_rgb(0_0_0/0.05)]",
        "dark:shadow-[0_44px_90px_-28px_rgb(2_8_23/0.85),0_14px_30px_-14px_rgb(2_8_23/0.6),inset_0_0_0_1px_rgb(255_255_255/0.07)]",
        className,
      )}
      {...rest}
    >
      {children}
    </Card>
  );
}

function MockHeader({
  icon,
  title,
  subtitle,
  status,
}: {
  icon: IconName;
  title: string;
  subtitle: string;
  status: React.ReactNode;
}) {
  return (
    <div className={cn("flex items-center gap-3 px-5 pt-5 pb-4")}>
      <IconTile name={icon} size="sm" className={cn("[--tile:38px]")} />
      <div className={cn("min-w-0 flex-1")}>
        <p
          className={cn(
            "truncate text-[15px] leading-5 font-semibold tracking-[-0.01em]",
          )}
        >
          {title}
        </p>
        <p className={cn("truncate text-[12.5px] leading-5 text-muted-foreground")}>
          {subtitle}
        </p>
      </div>
      {/* Status chips that swap share one grid cell, so nothing reflows. */}
      <div className={cn("grid shrink-0 justify-items-end")}>{status}</div>
    </div>
  );
}

/** A fake input on the app's field tokens. Never a real control. */
function MockField({
  label,
  value,
  tag,
  icon,
}: {
  label: string;
  value: string;
  tag?: string;
  icon?: IconName;
}) {
  return (
    <div
      data-mk="field"
      className={cn(
        "relative flex h-[3.25rem] min-w-0 items-center gap-2.5 rounded-xl border border-border/70 bg-field/70 px-3",
      )}
    >
      {/* Phones drop the icon: a half-width field needs the room for its value. */}
      {icon ? (
        <Icon name={icon} size={18} className={cn("hidden shrink-0 sm:inline-block")} />
      ) : null}
      <span className={cn("grid min-w-0 flex-1")}>
        <span
          className={cn(
            "text-[10px] leading-4 font-semibold tracking-[0.14em] text-muted-foreground uppercase",
          )}
        >
          {label}
        </span>
        {/* Block, not flex: one span per character, and flex would drop the spaces. */}
        <span
          className={cn(
            "block truncate text-[15px] leading-5 font-semibold tracking-[-0.01em] tabular-nums",
          )}
        >
          <Typed text={value} />
          <span
            data-mk="caret"
            className={cn(
              "ml-px inline-block h-4 w-[1.5px] rounded-full bg-cyan-300 align-[-3px] opacity-0",
            )}
          />
        </span>
      </span>
      {tag ? (
        <span
          data-mk="tag"
          className={cn(
            "shrink-0 rounded-md bg-foreground/8 px-1.5 py-0.5 text-[10px] font-bold tracking-[0.08em] text-foreground/70",
          )}
        >
          {tag}
        </span>
      ) : null}
      {/* The "focused" ring while a value types in; off in the final state. */}
      <span
        data-mk="focus"
        className={cn(
          "pointer-events-none absolute -inset-px rounded-xl opacity-0",
          "shadow-[inset_0_0_0_1px_var(--cx-focus-border),var(--cx-focus-halo)]",
        )}
      />
    </div>
  );
}

/* ── 1 · Tell us the plan ─────────────────────────────────────────────── */

export function PlanMockup() {
  const { plan, from, to, dates } = demo;
  return (
    <MockCard data-mk="card">
      <MockHeader
        icon="globe"
        title={plan.title}
        subtitle={plan.subtitle}
        status={
          <>
            <Chip data-mk="draft" className={cn("opacity-0 [grid-area:1/1]")}>
              {plan.draft}
            </Chip>
            <Chip data-mk="sent-chip" tone="gain" dot className={cn("[grid-area:1/1]")}>
              {plan.sent}
            </Chip>
          </>
        }
      />
      <div className={cn("grid gap-2.5 px-5 pb-5")}>
        <div
          className={cn(
            "grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-1.5",
          )}
        >
          <MockField label={plan.labels.from} value={from.city} tag={from.country} />
          <span
            className={cn(
              "grid size-6 place-items-center rounded-full bg-foreground/6 text-foreground/55",
            )}
          >
            <Icon name="arrow-right" tone="current" size={13} />
          </span>
          <MockField label={plan.labels.to} value={to.city} tag={to.country} />
        </div>
        <div className={cn("grid grid-cols-2 gap-2.5")}>
          <MockField label={plan.labels.dates} value={dates} icon="calendar" />
          <MockField
            label={plan.labels.travellers}
            value={plan.travellers}
            icon="user"
          />
        </div>
        <MockField label={plan.labels.passport} value={plan.passport} icon="id-card" />

        {/* The action and its confirmation share one cell: the press swaps them. */}
        <div className={cn("mt-1 grid")}>
          <span
            data-mk="action"
            className={cn(
              "flex h-11 items-center justify-center gap-2 rounded-pill bg-ember text-[14px] font-semibold text-on-primary opacity-0 [grid-area:1/1]",
            )}
          >
            {plan.action}
            <Icon name="arrow-right" tone="current" size={16} />
          </span>
          <span
            data-mk="sent"
            className={cn(
              "flex h-11 items-center gap-2.5 rounded-xl bg-foreground/[0.05] px-3 [grid-area:1/1]",
            )}
          >
            <span className={cn("cx-gain")}>
              <Icon name="check-circle" tone="current" size={18} />
            </span>
            <span className={cn("min-w-0 flex-1 truncate text-[13px] font-semibold")}>
              {plan.confirmation}
            </span>
            <span
              className={cn(
                "hidden shrink-0 text-[11.5px] text-muted-foreground sm:inline",
              )}
            >
              {plan.confirmationTime}
            </span>
          </span>
        </div>
      </div>
    </MockCard>
  );
}

/* ── 2 · We map the route ─────────────────────────────────────────────── */

const ROUTE_ICONS: Record<(typeof demo.route.items)[number]["key"], IconName> = {
  passport: "id-card",
  visa: "file-text",
  flight: "send",
  stay: "building",
};

export function RouteMockup() {
  const { route, from, to } = demo;
  return (
    <MockCard data-mk="card">
      <MockHeader
        icon="route"
        title={route.title}
        subtitle={`${from.city} → ${to.city}`}
        status={<Chip>{route.count}</Chip>}
      />
      <ol className={cn("relative px-5 pb-3")}>
        {/* The line the items arrive along: first node centre to last. */}
        <span
          aria-hidden="true"
          className={cn(
            "absolute top-7 bottom-10 left-[2.4375rem] w-px bg-foreground/10",
          )}
        >
          <span
            data-mk="line"
            className={cn(
              "absolute inset-0 origin-top bg-linear-to-b from-cyan-300 to-ember",
            )}
          />
        </span>
        {route.items.map((item, i) => (
          <li
            key={item.key}
            data-mk="item"
            className={cn("relative flex items-center gap-3.5 py-2")}
          >
            {/* An opaque base, so the line passes behind the tile, not through it. */}
            <span className={cn("relative z-[1] rounded-icon bg-elevated")}>
              <IconTile
                name={ROUTE_ICONS[item.key]}
                variant="glass"
                className={cn("[--tile:38px]")}
              />
            </span>
            <span className={cn("min-w-0 flex-1")}>
              <span className={cn("block text-[14.5px] leading-5 font-semibold")}>
                {item.label}
              </span>
              <span
                className={cn(
                  "block truncate text-[12.5px] leading-5 text-muted-foreground tabular-nums",
                )}
              >
                {item.detail}
              </span>
            </span>
            <span data-mk="mark" className={cn("shrink-0")}>
              {i === 0 ? (
                <span className={cn("cx-gain")}>
                  <Icon name="check-circle" tone="current" size={20} />
                </span>
              ) : i === 1 ? (
                <Chip tone="brand">{route.next}</Chip>
              ) : (
                <span
                  className={cn(
                    "text-[12px] font-semibold text-foreground/40 tabular-nums",
                  )}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
              )}
            </span>
          </li>
        ))}
      </ol>
      <p
        data-mk="note"
        className={cn(
          "flex items-center gap-2.5 bg-foreground/[0.04] px-5 py-3.5 text-[12.5px] font-medium text-foreground/70",
        )}
      >
        <Icon name="sparkle" size={14} className={cn("shrink-0")} />
        {route.note}
      </p>
    </MockCard>
  );
}

/* ── 3 · We file and book ─────────────────────────────────────────────── */

const HOLD_ICONS: Record<(typeof demo.filing.holds)[number]["key"], IconName> = {
  seat: "ticket",
  room: "building",
};

export function FilingMockup() {
  const { filing } = demo;
  const [submitted, review, approved] = filing.statuses;
  return (
    <div className={cn("relative w-full")}>
      <MockCard data-mk="card">
        <MockHeader
          icon="file-text"
          title={filing.title}
          subtitle={filing.subtitle}
          status={
            <>
              <Chip data-mk="status" className={cn("opacity-0 [grid-area:1/1]")}>
                {submitted}
              </Chip>
              <Chip
                data-mk="status"
                tone="warning"
                className={cn("opacity-0 [grid-area:1/1]")}
              >
                {review}
              </Chip>
              <Chip data-mk="status" tone="gain" dot className={cn("[grid-area:1/1]")}>
                {approved}
              </Chip>
            </>
          }
        />
        <div className={cn("px-5")}>
          <div
            className={cn(
              "relative h-1.5 overflow-hidden rounded-full bg-foreground/10",
            )}
          >
            <span
              data-mk="bar"
              className={cn(
                "absolute inset-0 origin-left rounded-full bg-linear-to-r from-cyan-400 to-ember",
              )}
            />
          </div>
          <div
            className={cn(
              "mt-2 grid grid-cols-3 text-[11px] font-semibold tracking-[0.04em] text-foreground/75",
            )}
          >
            {filing.stages.map((stage, i) => (
              <span
                key={stage}
                data-mk="stage"
                className={cn(i === 1 && "text-center", i === 2 && "text-right")}
              >
                {stage}
              </span>
            ))}
          </div>
        </div>
        {/* The outcome slot: empty until the stamp comes down in it. */}
        <div
          className={cn(
            "relative mx-5 mt-4 flex h-14 items-center gap-3 rounded-xl border border-dashed border-foreground/12 px-3.5",
          )}
        >
          <span
            className={cn(
              "text-[10px] font-semibold tracking-[0.14em] text-muted-foreground uppercase",
            )}
          >
            {filing.outcome}
          </span>
          <span
            data-mk="awaiting"
            className={cn("text-[12.5px] font-medium text-foreground/55 opacity-0")}
          >
            {filing.awaiting}
          </span>
          {/* Tilted by the wrapper, slammed down by the timeline. */}
          <span className={cn("pointer-events-none absolute right-4 rotate-[-8deg]")}>
            <span
              data-mk="stamp"
              className={cn(
                "cx-gain block rounded-lg border-2 border-current px-3 py-0.5",
                "text-[15px] leading-6 font-extrabold tracking-[0.24em] uppercase",
                "bg-(--cx-gain-wash) shadow-[0_0_0_3px_var(--cx-gain-wash),0_10px_30px_-12px_var(--cx-gain)]",
              )}
            >
              {filing.stamp}
            </span>
          </span>
        </div>
        <ul className={cn("mt-2 grid gap-2 px-5 pb-5")}>
          {filing.holds.map((hold) => (
            <li
              key={hold.key}
              data-mk="hold"
              className={cn(
                "flex items-center gap-3 rounded-xl bg-foreground/[0.04] px-3 py-2.5",
              )}
            >
              <Icon name={HOLD_ICONS[hold.key]} size={20} className={cn("shrink-0")} />
              <span className={cn("min-w-0 flex-1")}>
                <span className={cn("block text-[14px] leading-5 font-semibold")}>
                  {hold.label}
                </span>
                <span
                  className={cn(
                    "block truncate text-[12.5px] leading-5 text-muted-foreground tabular-nums",
                  )}
                >
                  {hold.detail}
                </span>
              </span>
              <span data-mk="tick" className={cn("cx-gain shrink-0")}>
                <Icon name="check-circle" tone="current" size={20} />
              </span>
            </li>
          ))}
        </ul>
      </MockCard>
    </div>
  );
}

/* ── 4 · You travel ───────────────────────────────────────────────────── */

export function TravelMockup() {
  const { travel, from, to } = demo;
  return (
    // The top padding reserves the message's overhang, so whatever centres
    // this mock-up centres the bubble too, rather than letting it ride up.
    <div className={cn("relative w-full pt-14 pb-[5.75rem] sm:pt-8")}>
      {/* The plan, tucked under the pass so only its lower rows show. */}
      <Card
        data-mk="plan"
        elevated
        className={cn(
          "absolute inset-x-4 bottom-0 h-[7.5rem] justify-end gap-0 px-4 pt-0 pb-3 text-foreground",
          "shadow-[0_24px_50px_-20px_rgb(2_8_23/0.45),inset_0_0_0_1px_rgb(0_0_0/0.05)]",
          "dark:shadow-[0_24px_50px_-20px_rgb(2_8_23/0.8),inset_0_0_0_1px_rgb(255_255_255/0.06)]",
        )}
      >
        <p
          className={cn(
            "mb-1 text-[10px] font-semibold tracking-[0.14em] text-muted-foreground uppercase",
          )}
        >
          {travel.plan.title}
        </p>
        <ul className={cn("grid gap-0.5")}>
          {travel.plan.days.slice(0, 2).map((day) => (
            <li
              key={day.day}
              className={cn("flex items-baseline gap-3 text-[12.5px] leading-6")}
            >
              <span
                className={cn(
                  "w-11 shrink-0 font-semibold text-foreground/55 tabular-nums",
                )}
              >
                {day.day}
              </span>
              <span className={cn("truncate font-medium")}>{day.text}</span>
            </li>
          ))}
        </ul>
      </Card>

      <MockCard data-mk="pass" className={cn("relative z-[1]")}>
        <div className={cn("flex items-center justify-between px-5 pt-5")}>
          <p
            className={cn(
              "text-[10.5px] font-semibold tracking-[0.16em] text-muted-foreground uppercase",
            )}
          >
            {travel.pass.title}
          </p>
          <p
            className={cn(
              "text-[12.5px] font-semibold text-foreground/70 tabular-nums",
            )}
          >
            {travel.pass.date}
          </p>
        </div>

        <div className={cn("flex items-center gap-3 px-5 pt-3 pb-4")}>
          <div className={cn("min-w-0")}>
            <p
              className={cn(
                "text-[2.125rem] leading-none font-semibold tracking-[-0.03em]",
              )}
            >
              {from.code}
            </p>
            <p className={cn("mt-1.5 text-[12.5px] text-muted-foreground")}>
              {from.city}
            </p>
          </div>
          <div className={cn("relative flex h-6 flex-1 items-center")}>
            <span
              className={cn("h-px w-full border-t border-dashed border-foreground/25")}
            />
            <span
              data-mk="pass-plane"
              className={cn("absolute inset-0 grid place-items-center")}
            >
              <span
                className={cn(
                  "grid size-8 place-items-center rounded-full bg-elevated",
                )}
              >
                <PlaneGlyph className={cn("size-5 rotate-45")} />
              </span>
            </span>
          </div>
          <div className={cn("min-w-0 text-right")}>
            <p
              className={cn(
                "text-[2.125rem] leading-none font-semibold tracking-[-0.03em]",
              )}
            >
              {to.code}
            </p>
            <p className={cn("mt-1.5 text-[12.5px] text-muted-foreground")}>
              {to.city}
            </p>
          </div>
        </div>

        {/* Perforation */}
        <span
          aria-hidden="true"
          className={cn("mx-5 block border-t border-dashed border-foreground/12")}
        />

        <dl className={cn("grid grid-cols-4 gap-2 px-5 pt-3.5")}>
          {travel.pass.details.map((detail) => (
            <div key={detail.label} data-mk="detail" className={cn("min-w-0")}>
              <dt
                className={cn(
                  "text-[10px] font-semibold tracking-[0.14em] text-muted-foreground uppercase",
                )}
              >
                {detail.label}
              </dt>
              <dd className={cn("mt-0.5 text-[15px] font-semibold tabular-nums")}>
                {detail.value}
              </dd>
            </div>
          ))}
        </dl>

        <div className={cn("px-5 pt-3.5 pb-5")}>
          <span
            data-mk="barcode"
            className={cn(
              "block h-9 origin-left rounded-md opacity-80",
              "bg-[repeating-linear-gradient(90deg,color-mix(in_srgb,var(--foreground)_85%,transparent)_0_2px,transparent_2px_4px,color-mix(in_srgb,var(--foreground)_85%,transparent)_4px_5px,transparent_5px_8px,color-mix(in_srgb,var(--foreground)_85%,transparent)_8px_11px,transparent_11px_12px,color-mix(in_srgb,var(--foreground)_85%,transparent)_12px_13px,transparent_13px_17px)]",
            )}
          />
        </div>
      </MockCard>

      {/* The consultant's message, hanging off the pass's top corner. */}
      <div
        data-mk="chat"
        className={cn(
          // Sits in the root's top padding and overlaps the pass's top edge:
          // by a sliver on phones (clear of its label), more where it is wider.
          "absolute top-0 right-2 z-[2] w-[16.5rem] origin-bottom-right sm:-right-6",
          // ink-950 is the one ink step that stays dark in both themes.
          "rounded-2xl rounded-br-md bg-white px-3.5 py-3 text-ink-950",
          "shadow-[0_24px_48px_-16px_rgb(2_8_23/0.7),0_6px_16px_-8px_rgb(2_8_23/0.5)]",
        )}
      >
        <p
          className={cn(
            "flex items-center gap-1.5 text-[11.5px] font-semibold text-ink-950/55",
          )}
        >
          <Icon name="whatsapp" tone="current" size={14} />
          <span className={cn("truncate")}>{travel.message.from}</span>
          <span className={cn("ml-auto shrink-0 font-medium tabular-nums")}>
            {travel.message.time}
          </span>
        </p>
        <p
          className={cn(
            "mt-1 text-[14px] leading-snug font-semibold tracking-[-0.01em]",
          )}
        >
          {travel.message.body}
        </p>
      </div>
    </div>
  );
}

export const JOURNEY_MOCKUPS = [
  PlanMockup,
  RouteMockup,
  FilingMockup,
  TravelMockup,
] as const;

/* ── The scrubbed sequences ───────────────────────────────────────────── */

type Timeline = gsap.core.Timeline;

const all = (root: Element, hook: string) =>
  Array.from(root.querySelectorAll<HTMLElement>(`[data-mk="${hook}"]`));
const one = (root: Element, hook: string) =>
  root.querySelector<HTMLElement>(`[data-mk="${hook}"]`);

/*
 * Each step owns one unit of the master timeline, [at, at + 1], and finishes
 * by about at + 0.8 so the last fifth of every step holds its final state.
 * Only the first tween on a property is a fromTo; later ones are `to`, so a
 * scrub in either direction rewinds through the same values (a second
 * fromTo would paint its own start state at build time).
 */

function playPlan(tl: Timeline, root: Element, at: number) {
  const fields = all(root, "field");
  const span = 0.6 / fields.length;

  fields.forEach((field, i) => {
    const t = at + 0.06 + i * span;
    const chars = Array.from(field.querySelectorAll<HTMLElement>("[data-char]"));
    const focus = one(field, "focus");
    const caret = one(field, "caret");
    const tag = one(field, "tag");

    // The characters keep their space while hidden (opacity only), so the
    // caret is pulled back over the ones still to come and steps forward as
    // each appears. offsetWidth is layout width, unaffected by the scene's scale.
    const widths = chars.map((char) => char.offsetWidth);
    const still = (from: number) => -widths.slice(from).reduce((sum, w) => sum + w, 0);

    tl.fromTo(focus, { opacity: 0 }, { opacity: 1, duration: 0.02 }, t).fromTo(
      caret,
      { opacity: 0, x: still(0) },
      { opacity: 1, duration: 0.01 },
      t,
    );
    // One tween per character, not a stagger: a staggered fromTo only paints
    // its first target's start state at build, so the rest would show early.
    const gap = (span * 0.62) / Math.max(chars.length, 1);
    chars.forEach((char, c) => {
      const when = t + 0.012 + c * gap;
      tl.fromTo(char, { opacity: 0 }, { opacity: 1, duration: 0.008 }, when);
      tl.to(caret, { x: still(c + 1), duration: 0.008 }, when);
    });
    if (tag) {
      tl.fromTo(
        tag,
        { opacity: 0, scale: 0.6 },
        { opacity: 1, scale: 1, duration: 0.04, ease: "back.out(2.4)" },
        t + span * 0.72,
      );
    }
    tl.to(focus, { opacity: 0, duration: 0.02 }, t + span * 0.9).to(
      caret,
      { opacity: 0, duration: 0.01 },
      t + span * 0.9,
    );
  });

  const end = at + 0.68;
  tl.fromTo(
    one(root, "action"),
    { opacity: 1, scale: 1 },
    { scale: 0.96, duration: 0.03 },
    end,
  )
    .to(one(root, "action"), { opacity: 0, scale: 0.99, duration: 0.04 }, end + 0.03)
    .fromTo(
      one(root, "sent"),
      { opacity: 0, y: 8 },
      { opacity: 1, y: 0, duration: 0.06, ease: "power2.out" },
      end + 0.05,
    )
    .fromTo(
      one(root, "draft"),
      { opacity: 1 },
      { opacity: 0, duration: 0.03 },
      end + 0.05,
    )
    .fromTo(
      one(root, "sent-chip"),
      { opacity: 0, scale: 0.8 },
      { opacity: 1, scale: 1, duration: 0.05, ease: "back.out(2.2)" },
      end + 0.06,
    );
}

function playRoute(tl: Timeline, root: Element, at: number) {
  const items = all(root, "item");
  const last = Math.max(items.length - 1, 1);

  tl.fromTo(one(root, "line"), { scaleY: 0 }, { scaleY: 1, duration: 0.62 }, at + 0.06);
  items.forEach((item, i) => {
    // Each item lands as the line reaches its node. It starts as a faint
    // ghost, so the list has its shape before it is filled in.
    const t = at + 0.03 + (i / last) * 0.62;
    tl.fromTo(
      item,
      { opacity: 0.1, x: -12 },
      { opacity: 1, x: 0, duration: 0.09, ease: "power2.out" },
      t,
    );
    tl.fromTo(
      one(item, "mark"),
      { opacity: 0, scale: 0.4 },
      { opacity: 1, scale: 1, duration: 0.06, ease: "back.out(2.6)" },
      t + 0.07,
    );
  });
  tl.fromTo(
    one(root, "note"),
    { opacity: 0, y: 6 },
    { opacity: 1, y: 0, duration: 0.07 },
    at + 0.74,
  );
}

function playFiling(tl: Timeline, root: Element, at: number) {
  const [submitted, review, approved] = all(root, "status");
  const stages = all(root, "stage");
  const bar = one(root, "bar");

  tl.fromTo(bar, { scaleX: 0.03 }, { scaleX: 0.34, duration: 0.14 }, at + 0.04)
    .to(bar, { scaleX: 0.67, duration: 0.14 }, at + 0.24)
    .to(bar, { scaleX: 1, duration: 0.08 }, at + 0.44);
  [0.04, 0.3, 0.5].forEach((t, i) => {
    tl.fromTo(stages[i], { opacity: 0.35 }, { opacity: 1, duration: 0.03 }, at + t);
  });

  tl.fromTo(submitted, { opacity: 1 }, { opacity: 0, duration: 0.03 }, at + 0.22)
    .fromTo(
      review,
      { opacity: 0, y: 6 },
      { opacity: 1, y: 0, duration: 0.04 },
      at + 0.23,
    )
    .to(review, { opacity: 0, duration: 0.03 }, at + 0.5)
    .fromTo(
      approved,
      { opacity: 0, scale: 0.8 },
      { opacity: 1, scale: 1, duration: 0.05, ease: "back.out(2.2)" },
      at + 0.51,
    );

  // The stamp comes down hard in the empty outcome slot, and the card gives under it.
  tl.fromTo(
    one(root, "awaiting"),
    { opacity: 1 },
    { opacity: 0, duration: 0.03 },
    at + 0.52,
  );
  tl.fromTo(
    one(root, "stamp"),
    { opacity: 0, scale: 1.9, rotate: -10, filter: "blur(6px)" },
    {
      opacity: 1,
      scale: 1,
      rotate: 0,
      filter: "blur(0px)",
      duration: 0.07,
      ease: "power3.in",
    },
    at + 0.53,
  );
  const card = one(root, "card");
  tl.fromTo(card, { scale: 1 }, { scale: 0.985, duration: 0.02 }, at + 0.6).to(
    card,
    { scale: 1, duration: 0.05, ease: "back.out(3)" },
    at + 0.62,
  );

  all(root, "hold").forEach((hold, i) => {
    const t = at + 0.66 + i * 0.08;
    tl.fromTo(hold, { opacity: 0.35 }, { opacity: 1, duration: 0.04 }, t);
    tl.fromTo(
      one(hold, "tick"),
      { opacity: 0, scale: 0.4 },
      { opacity: 1, scale: 1, duration: 0.05, ease: "back.out(2.6)" },
      t + 0.02,
    );
  });
}

function playTravel(tl: Timeline, root: Element, at: number) {
  tl.fromTo(
    one(root, "pass-plane"),
    { xPercent: -42, opacity: 0 },
    { xPercent: 0, opacity: 1, duration: 0.28, ease: "power2.out" },
    at + 0.04,
  )
    .fromTo(
      one(root, "barcode"),
      { scaleX: 0 },
      { scaleX: 1, duration: 0.12, ease: "power2.out" },
      at + 0.28,
    )
    .fromTo(
      one(root, "chat"),
      { opacity: 0, y: 16, scale: 0.86 },
      { opacity: 1, y: 0, scale: 1, duration: 0.08, ease: "back.out(1.8)" },
      at + 0.44,
    )
    .fromTo(
      one(root, "plan"),
      { opacity: 0, y: -56 },
      { opacity: 1, y: 0, duration: 0.14, ease: "power2.out" },
      at + 0.58,
    );
}

const SEQUENCES = [playPlan, playRoute, playFiling, playTravel] as const;

/** Adds mock-up `index`'s sequence to `tl`, inside the unit that starts at `at`. */
export function playMockup(tl: Timeline, root: Element, index: number, at: number) {
  SEQUENCES[index]?.(tl, root, at);
}
