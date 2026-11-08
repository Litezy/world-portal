"use client";

import * as React from "react";

import { Reveal } from "@/components/motion/reveal";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { SectionHeading } from "@/components/ui/section-heading";
import { siteConfig } from "@/config/site";
import { faq } from "@/content/landing";
import { Icon } from "@/ds/components/icon";
import { EASE_GLASS, gsap, prefersReducedMotion } from "@/lib/motion/gsap";
import { cn } from "@/lib/utils";

/**
 * The design system's accordion (`.cx-accordion`: hairline rows, an index,
 * a plus that turns into a close) drawn with real buttons rather than its
 * native `<details>`, because the page relies on `aria-expanded` and on
 * opening one answer closing the others (e2e/smoke.spec.ts).
 *
 * The page's last beat before the footer, and deliberately the calm one:
 * after the stage, the deck, the drifting wall, the light and the kinetic
 * close, nothing here moves on its own. The open row is the only thing that
 * changes — its index turns gold (the section's one gold touch) and its
 * question comes up to full ink while the closed ones rest a step quieter.
 */
export function Faq() {
  // Accordion semantics: opening one closes the rest.
  const [openIndex, setOpenIndex] = React.useState(0);

  return (
    <Section id="faq" spacing="lg">
      <Container>
        <div className="grid gap-12 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.4fr)] lg:gap-20">
          <SectionHeading
            eyebrow={faq.eyebrow}
            lead={faq.headingLead}
            accent={faq.headingAccent}
            body={faq.body}
            size="md"
            className="lg:sticky lg:top-28 lg:self-start"
          >
            <p className="mt-8 text-[14px] leading-relaxed text-muted-foreground">
              {faq.more.lead}{" "}
              <a
                href={`https://wa.me/${siteConfig.contact.whatsapp.replace(/\D/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-sm font-semibold text-foreground underline decoration-hairline decoration-2 underline-offset-4 transition-colors duration-300 hover:decoration-ember focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none"
              >
                {faq.more.cta}
              </a>
            </p>
          </SectionHeading>

          <Reveal stagger={0.06} as="ul" className="border-t border-hairline">
            {faq.items.map((item, i) => (
              <li key={item.question} className="border-b border-hairline">
                <FaqRow
                  index={i}
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
 * Opening a row unrolls the panel to its measured height while the answer
 * rises into place. The height is released to `auto` once it lands, so a
 * resize can never clip an open answer. The first render sets the final
 * state without a tween: the open answer is already open in the server HTML.
 */
function FaqRow({
  index,
  question,
  answer,
  open,
  onToggle,
}: {
  index: number;
  question: string;
  answer: string;
  open: boolean;
  onToggle: () => void;
}) {
  const panelRef = React.useRef<HTMLDivElement>(null);
  const innerRef = React.useRef<HTMLParagraphElement>(null);
  const firstRun = React.useRef(true);
  const id = React.useId();
  const buttonId = `${id}-q`;
  const panelId = `${id}-a`;

  React.useLayoutEffect(() => {
    const panel = panelRef.current;
    const inner = innerRef.current;
    if (!panel || !inner) return;

    if (firstRun.current || prefersReducedMotion()) {
      firstRun.current = false;
      gsap.set(panel, { height: open ? "auto" : 0, autoAlpha: open ? 1 : 0 });
      return;
    }

    // Tween from wherever the panel is now, so a fast second click reverses
    // a half-open row instead of snapping it.
    if (open) {
      gsap.fromTo(
        panel,
        { height: panel.offsetHeight },
        {
          height: inner.offsetHeight,
          autoAlpha: 1,
          duration: 0.55,
          ease: EASE_GLASS,
          onComplete: () => {
            gsap.set(panel, { height: "auto" });
          },
        },
      );
      gsap.fromTo(inner, { y: 14 }, { y: 0, duration: 0.6, ease: EASE_GLASS });
    } else {
      gsap.fromTo(
        panel,
        { height: panel.offsetHeight },
        { height: 0, autoAlpha: 0, duration: 0.4, ease: "power3.inOut" },
      );
    }

    return () => {
      gsap.killTweensOf([panel, inner]);
    };
  }, [open]);

  return (
    <div>
      <h3>
        <button
          id={buttonId}
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          aria-controls={panelId}
          className={cn(
            "group grid w-full cursor-pointer grid-cols-[2.25rem_minmax(0,1fr)_2.5rem] items-center gap-x-3 py-6 text-left outline-none sm:grid-cols-[3rem_minmax(0,1fr)_2.75rem] sm:gap-x-4 sm:py-7",
            "rounded-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-background",
          )}
        >
          <span
            aria-hidden="true"
            className={cn(
              "text-[13px] font-medium tabular-nums transition-colors duration-300 sm:text-sm",
              open ? "text-gold-ink" : "text-text-3",
            )}
          >
            {String(index + 1).padStart(2, "0")}
          </span>
          <span
            className={cn(
              "text-[17px] leading-snug font-semibold tracking-[-0.015em] transition-colors duration-300 sm:text-[19px]",
              open
                ? "text-foreground"
                : "text-foreground/80 group-hover:text-foreground",
            )}
          >
            {question}
          </span>
          <span
            aria-hidden="true"
            className={cn(
              "grid size-10 place-items-center justify-self-end rounded-full transition-[transform,background-color,color,box-shadow] duration-500 ease-cx sm:size-11",
              open
                ? "rotate-45 bg-ember text-on-primary shadow-cta"
                : "bg-surface-2 text-foreground group-hover:bg-surface-3",
            )}
          >
            <Icon name="plus" tone="current" size={18} />
          </span>
        </button>
      </h3>

      <div
        ref={panelRef}
        id={panelId}
        role="region"
        aria-labelledby={buttonId}
        className={cn("overflow-hidden", !open && "invisible h-0 opacity-0")}
      >
        <p
          ref={innerRef}
          className="pr-12 pb-7 pl-[calc(2.25rem+0.75rem)] text-[15px] leading-relaxed text-pretty text-foreground/75 sm:pr-16 sm:pl-[calc(3rem+1rem)] sm:text-base"
        >
          {answer}
        </p>
      </div>
    </div>
  );
}
