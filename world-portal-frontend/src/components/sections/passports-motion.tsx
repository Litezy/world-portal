"use client";

import * as React from "react";

import { useGsap } from "@/hooks/use-gsap";
import { gsap, ScrollTrigger } from "@/lib/motion/gsap";

const DESKTOP = "(min-width: 1024px)";
const COMPACT = "(max-width: 1023.98px)";

/** The stage the server renders: the finished passport. */
const FINAL = 3;

/**
 * Drives the specimen passport (`[data-pp-visual]`) through its stages:
 *
 * - **lg+:** the passport is sticky beside the three situations
 *   (`[data-pp-step]`). Each one that crosses the line 60% down the
 *   viewport moves the passport on a stage and becomes the active card;
 *   scrolling back over the line steps it back.
 * - **Below lg:** no sticky column, so the passport plays its stages by its
 *   own position as it passes up the screen, and every card stays as is.
 *
 * Stages are attributes; the transitions are CSS (passports-specimen.module.css),
 * so each change eases in and reverses on the way back. Reverting (a
 * breakpoint change, unmount) restores the finished state the server renders.
 */
export function PassportsMotion({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const scopeRef = useGsap(({ scope }) => {
    if (!scope) return;
    const visual = scope.querySelector<HTMLElement>("[data-pp-visual]");
    const steps = gsap.utils.toArray<HTMLElement>("[data-pp-step]", scope);
    if (!visual || !steps.length) return;

    const setStage = (stage: number) => {
      visual.dataset.stage = String(stage);
    };
    const setActive = (active: number | "all") => {
      steps.forEach((step, i) => {
        step.dataset.active = String(active === "all" || i === active);
      });
    };
    const restore = () => {
      setStage(FINAL);
      setActive("all");
    };

    const mm = gsap.matchMedia();

    mm.add(DESKTOP, () => {
      const show = (passed: number) => {
        setStage(passed);
        setActive(passed - 1);
      };
      const triggers = steps.map((step, i) =>
        ScrollTrigger.create({
          trigger: step,
          start: "top 60%",
          onEnter: () => show(i + 1),
          onLeaveBack: () => show(i),
        }),
      );
      // Wherever the page opened (a refresh mid-section, an anchor), start
      // from the stage the scroll position has already reached.
      show(triggers.filter((t) => t.scroll() >= t.start).length);
      return restore;
    });

    mm.add(COMPACT, () => {
      setActive("all");
      const stageAt = (progress: number) =>
        progress < 0.2 ? 0 : progress < 0.45 ? 1 : progress < 0.7 ? 2 : FINAL;
      const trigger = ScrollTrigger.create({
        trigger: visual,
        start: "top 88%",
        end: "bottom 42%",
        onUpdate: (self) => setStage(stageAt(self.progress)),
      });
      setStage(stageAt(trigger.progress));
      return restore;
    });
  }, []);

  return (
    <div ref={scopeRef as React.Ref<HTMLDivElement>} className={className}>
      {children}
    </div>
  );
}
