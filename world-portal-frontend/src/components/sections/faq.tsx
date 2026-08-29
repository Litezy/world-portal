"use client";

import * as React from "react";

import { Plus } from "lucide-react";

import { Reveal } from "@/components/motion/reveal";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { SectionHeading } from "@/components/ui/section-heading";
import { faq } from "@/content/landing";
import { EASE_GLASS, gsap, prefersReducedMotion } from "@/lib/motion/gsap";
import { cn } from "@/lib/utils";

export function Faq() {
  // Accordion semantics: opening one closes the rest.
  const [openIndex, setOpenIndex] = React.useState(0);

  return (
    <Section id="faq" spacing="md" tone="muted">
      <Container>
        <div className="grid gap-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-16">
          <SectionHeading
            eyebrow={faq.eyebrow}
            lead={faq.headingLead}
            accent={faq.headingAccent}
            body={faq.body}
            size="md"
            className="lg:sticky lg:top-16 lg:self-start"
          />

          <Reveal stagger={0.08} as="ul" className="space-y-3">
            {faq.items.map((item, i) => (
              <li key={item.question}>
                <FaqRow
                  question={item.question}
                  answer={item.answer}
                  open={openIndex === i}
                  onToggle={() => setOpenIndex(openIndex === i ? -1 : i)}
                />
              </li>
            ))}
          </Reveal>
        </div>
      </Container>
    </Section>
  );
}

/**
 * Opening a row does four things at once: the panel unrolls to its measured
 * height, the answer's words cascade in, a brand rule wipes across under the
 * question, and the plus rotates into a minus. Height is animated from a
 * measured value rather than `auto` so it stays on the compositor.
 */
function FaqRow({
  question,
  answer,
  open,
  onToggle,
}: {
  question: string;
  answer: string;
  open: boolean;
  onToggle: () => void;
}) {
  const panelRef = React.useRef<HTMLDivElement>(null);
  const innerRef = React.useRef<HTMLParagraphElement>(null);
  const ruleRef = React.useRef<HTMLSpanElement>(null);
  const id = React.useId();

  // Split once, so the stagger has something to target without re-rendering.
  const words = React.useMemo(() => answer.split(" "), [answer]);

  React.useLayoutEffect(() => {
    const panel = panelRef.current;
    const inner = innerRef.current;
    const rule = ruleRef.current;
    if (!panel || !inner || !rule) return;

    if (prefersReducedMotion()) {
      gsap.set(panel, { height: open ? "auto" : 0, autoAlpha: open ? 1 : 0 });
      gsap.set(rule, { scaleX: open ? 1 : 0 });
      return;
    }

    const wordEls = inner.querySelectorAll("[data-word]");
    const ctx = gsap.context(() => {
      if (open) {
        gsap
          .timeline()
          .to(panel, {
            height: inner.offsetHeight,
            autoAlpha: 1,
            duration: 0.55,
            ease: EASE_GLASS,
          })
          .to(rule, { scaleX: 1, duration: 0.6, ease: EASE_GLASS }, 0)
          .from(
            wordEls,
            {
              yPercent: 110,
              autoAlpha: 0,
              duration: 0.5,
              stagger: 0.012,
              ease: "power3.out",
            },
            0.1,
          );
      } else {
        gsap
          .timeline()
          .to(panel, { height: 0, autoAlpha: 0, duration: 0.4, ease: "power3.inOut" })
          .to(rule, { scaleX: 0, duration: 0.3, ease: "power2.in" }, 0);
      }
    });

    return () => ctx.revert();
  }, [open]);

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl bg-card px-5 transition-shadow duration-500",
        open
          ? "shadow-[0_2px_4px_rgba(12,14,18,0.05),0_18px_40px_-22px_rgba(12,14,18,0.35)]"
          : "shadow-[0_1px_2px_rgba(12,14,18,0.04),0_10px_24px_-18px_rgba(12,14,18,0.25)]",
      )}
    >
      <h3>
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          aria-controls={id}
          className="flex w-full cursor-pointer items-center justify-between gap-6 py-5 text-left outline-none focus-visible:underline focus-visible:underline-offset-4"
        >
          <span className="text-[15px] font-semibold tracking-tight text-ink-900">
            {question}
          </span>
          <span
            aria-hidden="true"
            className={cn(
              "grid size-8 shrink-0 place-items-center rounded-full transition-[transform,background-color,color] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
              open
                ? "rotate-[135deg] bg-primary text-primary-foreground"
                : "rotate-0 bg-secondary text-ink-800",
            )}
          >
            <Plus className="size-4" strokeWidth={2.5} />
          </span>
        </button>
      </h3>

      {/* Brand rule that wipes across as the answer opens. */}
      <span
        ref={ruleRef}
        aria-hidden="true"
        className="block h-px origin-left scale-x-0 bg-primary"
      />

      <div
        ref={panelRef}
        id={id}
        role="region"
        hidden={!open}
        className="h-0 overflow-hidden opacity-0"
      >
        <p
          ref={innerRef}
          className="pt-4 pb-5 text-[13.5px] leading-relaxed text-muted-foreground"
        >
          {words.map((word, i) => (
            <span key={i} className="inline-block overflow-hidden align-bottom">
              <span data-word className="inline-block">
                {word}
                {i < words.length - 1 ? " " : ""}
              </span>
            </span>
          ))}
        </p>
      </div>
    </div>
  );
}
