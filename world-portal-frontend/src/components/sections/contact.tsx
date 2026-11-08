import Link from "next/link";

import { ParallaxImage } from "@/components/motion/parallax-image";
import { ContactKinetic, KineticWords } from "@/components/sections/contact-kinetic";
import { SectionHeading } from "@/components/ui/section-heading";
import { siteConfig } from "@/config/site";
import { contact } from "@/content/landing";
import { Chip } from "@/ds/components/chip";
import { Icon, type IconName } from "@/ds/components/icon";
import { cn } from "@/lib/utils";

/** One duotone glyph per service door, keyed by the route it opens. */
const SERVICE_ICONS: Record<string, IconName> = {
  "/passport": "id-card",
  "/apply": "certificate",
  "/services/flights": "ticket",
  "/services/hotels": "building",
  "/services/experiences": "compass",
  "/track": "route",
};

/** The assurances' glyphs, in the order landing.ts lists them. */
const ASSURANCE_ICONS: IconName[] = ["clock", "tag", "shield-check"];

const channels: {
  icon: IconName;
  label: string;
  href: string;
  external?: boolean;
}[] = [
  {
    icon: "phone",
    label: siteConfig.contact.phone,
    href: `tel:${siteConfig.contact.phone.replace(/\s/g, "")}`,
  },
  {
    icon: "mail",
    label: siteConfig.contact.email,
    href: `mailto:${siteConfig.contact.email}`,
  },
  {
    icon: "whatsapp",
    label: contact.whatsappLabel,
    href: `https://wa.me/${siteConfig.contact.whatsapp.replace(/\D/g, "")}`,
    external: true,
  },
];

/**
 * The closing call to action, and the one place that covers every service.
 *
 * The main button opens the trip planner rather than any single application,
 * because most people do not know whether their problem is a passport, a visa
 * or both. The tiles underneath are the direct door for anyone who does.
 *
 * The section follows the page theme, the way the hero does: navy type on a
 * pale-sky scrim in light (the default), white type on an ink scrim in dark.
 * The chips, the channel pills and the card are theme-following glass.
 *
 * The photograph is a warm sunset, graded in three layers: the image
 * desaturated, a brand wash in `color` blend mode that swaps its hue while
 * keeping its light, and a scrim that is heaviest behind the copy. In light
 * the image is brightened and washed toward pale sky blue under a white
 * scrim; in dark it is dimmed into the brand's blue hour under an ink one.
 * The crop keeps the temple and loses the corner.
 *
 * It is the page's kinetic close (`ContactKinetic`): the headline assembles
 * word by word as it comes up the screen, a gold star lands after "go.", and
 * the service doors arrive one by one in the card. All scrubbed, so it
 * rewinds; the markup itself is the assembled state.
 */
export function Contact() {
  return (
    <section
      id="start-here"
      data-brand="e-embassy"
      className="relative isolate overflow-hidden bg-brand-50 text-foreground dark:bg-ink-950"
    >
      <ParallaxImage
        src={contact.background.src}
        alt={contact.background.alt}
        fill
        sizes="100vw"
        strength={10}
        // Taller than the band, so the section clips the photograph's bottom
        // edge (and the photographer's mark in its corner) at every drift.
        className="absolute inset-x-0 top-0 -bottom-1/4 -z-30"
        imageClassName="object-[68%_30%] brightness-[1.12] saturate-[0.45] dark:brightness-[0.82] dark:saturate-[0.7]"
      />
      {/* Grade: brand hue, the photograph's own light. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-20 bg-linear-to-br from-cyan-300 via-brand-300 to-brand-500 opacity-60 mix-blend-color dark:from-brand-500 dark:via-brand-800 dark:to-brand-950 dark:opacity-80"
      />
      {/* Scrim: heaviest behind the copy, a floor so the band ends cleanly. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-linear-to-b from-white/85 via-white/70 to-white/90 lg:bg-linear-to-r lg:from-white/92 lg:via-white/65 lg:to-white/15 dark:from-ink-950/60 dark:via-ink-950/40 dark:to-ink-950/85 dark:lg:from-ink-950/85 dark:lg:via-ink-950/45 dark:lg:to-ink-950/15"
      />
      <div
        aria-hidden="true"
        className="grain absolute inset-x-0 bottom-0 -z-10 h-2/5 bg-linear-to-t from-white/70 to-transparent dark:from-ink-950/70"
      />

      <ContactKinetic className="mx-auto grid max-w-[1200px] gap-14 px-5 py-24 sm:px-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,28rem)] lg:items-center lg:gap-16 lg:py-36">
        <div data-kinetic-copy="">
          <SectionHeading
            eyebrow={contact.eyebrow}
            lead={<KineticWords text={contact.headingLead} />}
            accent={
              <>
                <KineticWords text={contact.headingAccent} />
                {/* The band's one gold touch: the destination, starred. */}
                {/* Raised with a relative offset, not vertical-align, so it
                    never makes its line taller than the others. */}
                <span
                  data-kinetic-star=""
                  aria-hidden="true"
                  className="relative -top-[0.62em] ml-[0.1em] inline-block align-baseline leading-none text-gold"
                >
                  <Icon name="star" tone="current" size={30} />
                </span>
              </>
            }
            body={contact.body}
            size="lg"
          />

          <ul
            data-kinetic-line=""
            className="mt-10 grid max-w-xl gap-4 sm:grid-cols-3 sm:gap-0"
          >
            {contact.assurances.map((item, i) => (
              <li
                key={item}
                className="flex items-center gap-3 sm:flex-col sm:items-start sm:border-l sm:border-foreground/12 sm:px-5 sm:first:border-l-0 sm:first:pl-0"
              >
                <Icon name={ASSURANCE_ICONS[i] ?? "check-circle"} size={24} />
                <span className="text-[14px] leading-snug font-medium text-foreground/85">
                  {item}
                </span>
              </li>
            ))}
          </ul>

          <div data-kinetic-line="" className="mt-12">
            <p className="text-[12px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
              {contact.getInTouch}
            </p>
            <ul className="mt-4 flex flex-wrap gap-2">
              {channels.map(({ icon, label, href, external }) => (
                <li key={href}>
                  <a
                    href={href}
                    {...(external
                      ? { target: "_blank", rel: "noopener noreferrer" }
                      : null)}
                    className={cn(
                      "cx-btn cx-btn--glass h-11 gap-2 px-4 text-[14px] font-medium",
                    )}
                  >
                    <Icon name={icon} tone="current" />
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div>
          {/* Theme-following frost (white in light, smoked in dark), so the
              card sits into the photograph behind it. `.glass-frost` here is
              what e2e/glass.spec.ts checks for a real backdrop blur. */}
          <div
            data-kinetic-card=""
            className="glass glass-frost rounded-card p-6 sm:p-8"
          >
            <h3 className="text-[26px] leading-tight font-semibold tracking-[-0.02em] text-foreground">
              {contact.primary.title}
            </h3>
            <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
              {contact.primary.body}
            </p>

            <Link
              href={contact.primary.href}
              className={cn("cx-btn cx-btn--lg cx-btn--block cx-btn--arrow mt-7")}
            >
              {contact.primary.cta}
              <Icon name="arrow-right" tone="current" />
            </Link>

            <div className="mt-8 flex items-center gap-4">
              <p className="shrink-0 text-[11.5px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                Or go straight to a service
              </p>
              <span aria-hidden="true" className="h-px flex-1 bg-foreground/12" />
            </div>

            <ul className="mt-4 grid grid-cols-2 gap-2">
              {contact.services.map((service) => {
                const soon = service.status === "soon";
                return (
                  <li key={service.href} data-kinetic-item="">
                    <Link
                      href={service.href}
                      className={cn(
                        "group flex h-full min-h-24 flex-col justify-between gap-3 rounded-[14px] bg-foreground/[0.05] p-3.5 transition-colors duration-300 ease-cx hover:bg-foreground/[0.09] focus-visible:bg-foreground/[0.09]",
                      )}
                    >
                      <span className="flex items-start justify-between gap-2">
                        <Icon
                          name={SERVICE_ICONS[service.href] ?? "arrow-right"}
                          size={26}
                        />
                        {soon ? (
                          <Chip className="h-5 px-2 text-[11px]">Soon</Chip>
                        ) : (
                          <Icon
                            name="arrow-up-right"
                            tone="current"
                            size={16}
                            className="text-foreground/45 transition-transform duration-300 ease-cx group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-foreground"
                          />
                        )}
                      </span>
                      <span
                        className={cn(
                          "text-[14px] leading-snug font-semibold tracking-[-0.01em]",
                          soon ? "text-foreground/70" : "text-foreground",
                        )}
                      >
                        {service.label}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </ContactKinetic>
    </section>
  );
}
