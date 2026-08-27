"use client";

import * as React from "react";

import { useGsap } from "@/hooks/use-gsap";
import { EASE, gsap } from "@/lib/motion/gsap";
import { cn } from "@/lib/utils";

export type RevealProps = React.ComponentProps<"div"> & {
  /** Stagger between direct children. 0 animates the wrapper as one block. */
  stagger?: number;
  y?: number;
  delay?: number;
  duration?: number;
  /** Fraction of the viewport the element must reach before it plays. */
  start?: string;
  as?: React.ElementType;
};

/**
 * Slides its content up into place as it enters the viewport.
 *
 * The initial hidden state is applied by GSAP rather than CSS, so with reduced
 * motion (or before hydration) the content is simply visible — never a blank
 * section waiting on JavaScript.
 */
export function Reveal({
  stagger = 0,
  y = 28,
  delay = 0,
  duration = 0.9,
  start = "top 85%",
  as: Comp = "div",
  className,
  children,
  ...props
}: RevealProps) {
  const scopeRef = useGsap(
    ({ scope }) => {
      if (!scope) return;
      const targets = stagger ? Array.from(scope.children) : scope;

      gsap.from(targets, {
        y,
        autoAlpha: 0,
        duration,
        delay,
        stagger,
        ease: EASE,
        scrollTrigger: { trigger: scope, start, once: true },
      });
    },
    [stagger, y, delay, duration, start],
  );

  return (
    <Comp
      ref={scopeRef as React.Ref<HTMLDivElement>}
      className={cn(className)}
      {...props}
    >
      {children}
    </Comp>
  );
}
