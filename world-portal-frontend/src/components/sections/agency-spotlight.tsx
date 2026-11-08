"use client";

import * as React from "react";

import { useGsap } from "@/hooks/use-gsap";
import { gsap } from "@/lib/motion/gsap";
import { cn } from "@/lib/utils";

/** How hard a `[data-magnetic]` element leans toward the pointer (0..1). */
const PULL = 0.28;

/**
 * Agency's island with a light you carry: the page's tenth beat.
 *
 * With a mouse, a soft cyan-and-blue light follows the pointer across the
 * band and the two calls to action lean toward the cursor as it nears them.
 * On the dark island it is screen-blended, so it brightens whatever it
 * passes; on the pale light island it is a fainter cyan pool in normal blend
 * (a screen blend would vanish on near-white, and a multiply turns muddy).
 * With touch, where nothing
 * hovers, the same light
 * drifts down through the band as the page scrolls instead, so a phone still
 * sees it move. Nothing here carries meaning: it is all light.
 *
 * Transforms and opacity only (`quickTo` on x/y). Under reduced motion the
 * light is not drawn at all and the island keeps its static corner glow.
 */
export function AgencySpotlight({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  const lightRef = React.useRef<HTMLSpanElement>(null);

  const scopeRef = useGsap(({ scope }) => {
    const light = lightRef.current;
    if (!scope || !light) return;

    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

    if (!finePointer) {
      gsap.fromTo(
        light,
        {
          x: () => scope.clientWidth * 0.2,
          y: () => scope.clientHeight * 0.08,
          opacity: 0.35,
        },
        {
          x: () => scope.clientWidth * 0.8,
          y: () => scope.clientHeight * 0.78,
          opacity: 0.9,
          ease: "none",
          scrollTrigger: {
            trigger: scope,
            start: "top 85%",
            end: "bottom 30%",
            scrub: 0.8,
            invalidateOnRefresh: true,
          },
        },
      );
      return;
    }

    // At rest the light sits behind the pitch; it wakes when the pointer
    // arrives and follows it, a beat behind.
    gsap.set(light, {
      x: scope.clientWidth * 0.7,
      y: scope.clientHeight * 0.14,
      opacity: 0.5,
    });
    const xTo = gsap.quickTo(light, "x", { duration: 0.7, ease: "power3.out" });
    const yTo = gsap.quickTo(light, "y", { duration: 0.7, ease: "power3.out" });

    const magnets = Array.from(
      scope.querySelectorAll<HTMLElement>("[data-magnetic]"),
    ).map((el) => ({
      el,
      x: gsap.quickTo(el, "x", { duration: 0.5, ease: "power3.out" }),
      y: gsap.quickTo(el, "y", { duration: 0.5, ease: "power3.out" }),
    }));

    const onMove = (event: PointerEvent) => {
      const box = scope.getBoundingClientRect();
      xTo(event.clientX - box.left);
      yTo(event.clientY - box.top);

      for (const magnet of magnets) {
        const r = magnet.el.getBoundingClientRect();
        const dx = event.clientX - (r.left + r.width / 2);
        const dy = event.clientY - (r.top + r.height / 2);
        // Only within a short reach of the button, and fading with distance.
        const reach = Math.max(r.width, r.height) * 0.9;
        const falloff = Math.max(0, 1 - Math.hypot(dx, dy) / reach);
        magnet.x(dx * PULL * falloff);
        magnet.y(dy * PULL * falloff);
      }
    };
    const onEnter = () =>
      gsap.to(light, { opacity: 1, duration: 0.5, overwrite: "auto" });
    const onLeave = () => {
      gsap.to(light, { opacity: 0.5, duration: 0.9, overwrite: "auto" });
      for (const magnet of magnets) {
        magnet.x(0);
        magnet.y(0);
      }
    };

    scope.addEventListener("pointermove", onMove);
    scope.addEventListener("pointerenter", onEnter);
    scope.addEventListener("pointerleave", onLeave);
    return () => {
      scope.removeEventListener("pointermove", onMove);
      scope.removeEventListener("pointerenter", onEnter);
      scope.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <div
      ref={scopeRef as React.Ref<HTMLDivElement>}
      className={cn(className)}
      {...props}
    >
      {children}
      <span
        ref={lightRef}
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute top-0 left-0 z-[1] size-[560px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-0 will-change-transform motion-reduce:hidden sm:size-[680px] dark:mix-blend-screen",
          "bg-[radial-gradient(closest-side,color-mix(in_srgb,var(--ee-cyan-hi)_20%,transparent),color-mix(in_srgb,var(--ee-blue)_6%,transparent)_45%,transparent)]",
          "dark:bg-[radial-gradient(closest-side,color-mix(in_srgb,var(--ee-cyan-hi)_38%,transparent),color-mix(in_srgb,var(--ee-blue)_20%,transparent)_45%,transparent)]",
        )}
      />
    </div>
  );
}
