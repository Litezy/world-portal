"use client";

import * as React from "react";

import { LOGO_GRID, WING_LOWER, WING_UPPER } from "@/components/common/logo-geometry";
import { useGsap } from "@/hooks/use-gsap";
import { gsap } from "@/lib/motion/gsap";
import { cn } from "@/lib/utils";

/** Share of the progress spent in the air; the rest is the roll-out. */
const AIRBORNE = 0.86;
/** How far the plane rolls along the letter after touchdown, in px. */
const ROLL = 26;

/** The stretch of scroll (px, ending at the page's foot) the flight spans. */
const flightRange = () => Math.min(440, window.innerHeight * 0.52);

/**
 * The bookend: the page opened on a visa form folding into a paper plane and
 * flying off to the Maldives, and it closes with a plane coming home. Over
 * the last stretch of scroll, a small plane drawn from the logo's own wings
 * (`logo-geometry.ts`) glides in along a dotted contrail and touches down on
 * the top of the ghost wordmark's last letter, where a gold runway light
 * comes on (the footer's one gold touch).
 *
 * SVG and transforms, not WebGL. One scrubbed progress value sets the plane's
 * position on a parabola, its pitch (the parabola's slope, so the nose comes
 * level as it lands), the contrail's reveal (`clip-path`) and the light, so
 * scrolling back up takes off again.
 *
 * It renders inside the wordmark, anchored to a zero-size point on the
 * letter's cap line (an `em` offset, so it tracks the 19.9vw type at every
 * width). The resting markup is the landed plane with its light on: that is
 * the whole of it under reduced motion, and the contrail only exists once
 * the flight is built.
 */
export function SiteFooterPlane({ className }: { className?: string }) {
  const id = React.useId();
  const planeRef = React.useRef<SVGSVGElement>(null);
  const trailRef = React.useRef<SVGSVGElement>(null);
  const pathRef = React.useRef<SVGPathElement>(null);
  const lightRef = React.useRef<HTMLSpanElement>(null);

  const scopeRef = useGsap(({ scope }) => {
    const plane = planeRef.current;
    const trail = trailRef.current;
    const path = pathRef.current;
    const light = lightRef.current;
    const footer = scope?.closest("footer");
    if (!scope || !plane || !trail || !path || !light || !footer) return;

    // Geometry, re-measured on every refresh (resize, fonts, images).
    const geo = { w: 0, h: 0, pw: 0, ph: 0, range: 0 };
    const measure = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      geo.range = flightRange();
      geo.w = vw * (vw < 640 ? 0.66 : 0.6);
      // Descend a little faster than the page rises, so the glide reads.
      geo.h = geo.range + Math.min(210, vh * 0.24);
      geo.pw = plane.getBoundingClientRect().width || 60;
      geo.ph = geo.pw * (LOGO_GRID.height / LOGO_GRID.width);

      // The contrail follows the plane's tail: the same parabola, ending
      // where the tail is at touchdown.
      trail.setAttribute("width", String(geo.w));
      trail.setAttribute("height", String(geo.h));
      trail.setAttribute("viewBox", `0 0 ${geo.w} ${geo.h}`);
      trail.style.right = `${ROLL + geo.pw * 0.98}px`;
      trail.style.bottom = `${geo.ph * 0.9}px`;
      path.setAttribute("d", `M0 0 Q ${geo.w / 2} ${geo.h} ${geo.w} ${geo.h}`);
      trail.style.display = "block";
    };

    const state = { p: 0 };
    const render = () => {
      const p = state.p;
      const t = Math.min(1, p / AIRBORNE);
      const roll = gsap.utils.clamp(0, 1, (p - AIRBORNE) / (1 - AIRBORNE));
      const easedRoll = 1 - (1 - roll) * (1 - roll);

      // y = -h(1-t)^2: steep on the way in, level at touchdown.
      const x = -geo.w * (1 - t) - ROLL * (1 - easedRoll);
      const y = -geo.h * (1 - t) * (1 - t);
      const pitch = (Math.atan2(2 * geo.h * (1 - t), geo.w) * 180) / Math.PI;

      plane.style.transform = `translate3d(${x}px,${y}px,0) rotate(${pitch * 0.85}deg)`;
      plane.style.opacity = String(Math.min(1, p / 0.12));
      trail.style.clipPath = `inset(0 ${(1 - t) * 100}% 0 0)`;
      trail.style.opacity = String(Math.min(1, p / 0.12) * (1 - 0.45 * easedRoll));
      light.style.opacity = String(easedRoll);
      light.style.transform = `scale(${0.4 + 0.6 * easedRoll})`;
    };

    measure();
    gsap.to(state, {
      p: 1,
      ease: "none",
      onUpdate: render,
      scrollTrigger: {
        trigger: footer,
        start: () => `bottom bottom+=${flightRange()}`,
        end: "bottom bottom",
        scrub: 0.7,
        invalidateOnRefresh: true,
        onRefresh: () => {
          measure();
          render();
        },
      },
    });
    render();

    return () => {
      plane.style.transform = "";
      plane.style.opacity = "";
      trail.style.cssText = "";
      light.style.opacity = "";
      light.style.transform = "";
      path.removeAttribute("d");
    };
  }, []);

  return (
    <span
      ref={scopeRef as React.Ref<HTMLSpanElement>}
      aria-hidden="true"
      className={cn("pointer-events-none absolute size-0", className)}
    >
      {/* The contrail fades out behind the plane, as a real one does. */}
      <svg
        ref={trailRef}
        className="absolute hidden overflow-visible [mask-image:linear-gradient(90deg,transparent_15%,black_75%)] text-brand-600/40 dark:text-white/40"
      >
        <path
          ref={pathRef}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray="0.5 9"
        />
      </svg>

      {/* The gold runway light, just ahead of the plane's nose. */}
      <span
        ref={lightRef}
        className="absolute bottom-0 left-2 size-1.5 rounded-full bg-gold shadow-[0_0_10px_2px_var(--color-gold)] sm:size-2"
      />

      <svg
        ref={planeRef}
        viewBox={`0 0 ${LOGO_GRID.width} ${LOGO_GRID.height}`}
        // The upper wing is the logo's blue on the pale light band, and pale
        // paper on the dark one, so it never melts into the footer behind it.
        className="absolute right-0 bottom-0 w-[clamp(46px,5vw,84px)] origin-[78%_96%] overflow-visible drop-shadow-[0_6px_10px_rgb(0_40_120/0.22)] will-change-transform [--plane-hi:var(--brand-500)] [--plane-lo:var(--brand-700)] dark:drop-shadow-[0_6px_10px_rgb(0_0_0/0.45)] dark:[--plane-hi:var(--brand-50)] dark:[--plane-lo:var(--brand-100)]"
      >
        <defs>
          <linearGradient
            id={`${id}-paper`}
            x1="0"
            y1="0"
            x2="880"
            y2="150"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0" style={{ stopColor: "var(--plane-hi)" }} />
            <stop offset="1" style={{ stopColor: "var(--plane-lo)" }} />
          </linearGradient>
        </defs>
        {/* Cyan wing first, so the paper wing overlaps it — as in the logo. */}
        <path d={WING_LOWER} style={{ fill: "var(--cyan-400)" }} />
        <path d={WING_UPPER} fill={`url(#${id}-paper)`} />
      </svg>
    </span>
  );
}
