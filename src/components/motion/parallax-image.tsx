"use client";

import * as React from "react";
import Image, { type ImageProps } from "next/image";

import { useGsap } from "@/hooks/use-gsap";
import { gsap } from "@/lib/motion/gsap";
import { cn } from "@/lib/utils";

export type ParallaxImageProps = Omit<ImageProps, "className"> & {
  /**
   * How far the image drifts across the whole scroll, as a percentage of its
   * own height. Positive = the image lags the page (the usual "further away"
   * read). Keep it under ~20 or the overscan below stops covering the edges.
   */
  strength?: number;
  className?: string;
  imageClassName?: string;
  /** Horizontal drift instead of vertical — used by the marquee rows. */
  axis?: "y" | "x";
};

/**
 * An image that drifts against the scroll direction.
 *
 * The inner element is scaled up so the drift never exposes an edge, and the
 * wrapper clips it. With reduced motion the transform is simply never applied,
 * and the scaled-up image still fills the frame.
 */
export function ParallaxImage({
  strength = 12,
  className,
  imageClassName,
  axis = "y",
  alt,
  ...imageProps
}: ParallaxImageProps) {
  const innerRef = React.useRef<HTMLDivElement>(null);

  const scopeRef = useGsap(() => {
    const el = innerRef.current;
    if (!el) return;

    gsap.fromTo(
      el,
      { [axis === "y" ? "yPercent" : "xPercent"]: -strength / 2 },
      {
        [axis === "y" ? "yPercent" : "xPercent"]: strength / 2,
        ease: "none",
        scrollTrigger: {
          trigger: el.parentElement,
          start: "top bottom",
          end: "bottom top",
          scrub: true,
        },
      },
    );
  }, [strength, axis]);

  // Overscan by slightly more than the drift so no edge is ever revealed.
  const overscan = 1 + strength / 100 + 0.02;

  return (
    <div
      ref={scopeRef as React.RefObject<HTMLDivElement>}
      className={cn("relative overflow-hidden", className)}
    >
      <div
        ref={innerRef}
        className="absolute inset-0 will-change-transform"
        style={{ scale: overscan }}
      >
        <Image
          alt={alt}
          {...imageProps}
          className={cn("object-cover", imageClassName)}
        />
      </div>
    </div>
  );
}
