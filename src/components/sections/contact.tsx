import Link from "next/link";

import { ArrowRight, Check, Mail, MessageCircle, Phone } from "lucide-react";

import { ParallaxImage } from "@/components/motion/parallax-image";
import { Reveal } from "@/components/motion/reveal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/components/ui/section-heading";
import { siteConfig } from "@/config/site";
import { contact } from "@/content/landing";

const channels = [
  {
    Icon: Phone,
    label: siteConfig.contact.phone,
    href: `tel:${siteConfig.contact.phone.replace(/\s/g, "")}`,
  },
  {
    Icon: Mail,
    label: siteConfig.contact.email,
    href: `mailto:${siteConfig.contact.email}`,
  },
];

/**
 * The closing call to action, and the one place that covers every service.
 *
 * The main button opens the trip planner rather than any single application,
 * because most people do not know whether their problem is a passport, a visa
 * or both. The list underneath is the direct door for anyone who does.
 */
export function Contact() {
  return (
    <section id="start-here" className="relative isolate overflow-hidden">
      <ParallaxImage
        src={contact.background.src}
        alt={contact.background.alt}
        fill
        sizes="100vw"
        strength={12}
        className="absolute inset-0 -z-20"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[linear-gradient(100deg,rgba(8,10,16,0.80)_0%,rgba(8,10,16,0.58)_45%,rgba(8,10,16,0.36)_100%)]"
      />

      <div className="mx-auto grid max-w-[1200px] gap-12 px-5 py-20 sm:px-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1fr)] lg:items-center lg:gap-16 lg:py-28">
        <Reveal stagger={0.1}>
          <SectionHeading
            eyebrow={contact.eyebrow}
            lead={contact.headingLead}
            accent={contact.headingAccent}
            body={contact.body}
            onDark
            size="md"
          />

          <ul className="mt-8 space-y-2.5">
            {contact.assurances.map((item) => (
              <li
                key={item}
                className="flex items-center gap-2.5 text-[13.5px] text-white/85"
              >
                <span className="grid size-5 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
                  <Check className="size-3" strokeWidth={3} />
                </span>
                {item}
              </li>
            ))}
          </ul>

          <p className="mt-10 text-[13px] font-medium text-white/70">
            {contact.getInTouch}
          </p>
          <ul className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-3">
            {channels.map(({ Icon, label, href }) => (
              <li key={label}>
                <a
                  href={href}
                  className="group inline-flex items-center gap-3 text-[13.5px] text-white/85 transition-colors hover:text-white"
                >
                  <span className="glass-dark grid size-9 place-items-center rounded-full transition-transform duration-300 group-hover:-translate-y-0.5">
                    <Icon className="size-4" />
                  </span>
                  {label}
                </a>
              </li>
            ))}
            <li>
              <a
                href={`https://wa.me/${siteConfig.contact.whatsapp.replace(/\D/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-[13px] font-medium text-[#3ddc84] transition-opacity hover:opacity-80"
              >
                <MessageCircle className="size-4" />
                {contact.whatsappLabel}
              </a>
            </li>
          </ul>
        </Reveal>

        <Reveal stagger={0.12}>
          {/* Dark glass so the card sits into the photograph behind it rather
              than punching a white hole through it. */}
          <Card
            variant="ghost"
            radius="2xl"
            padding="none"
            className="glass-frost-dark gap-0 p-7 sm:p-8"
          >
            <h3 className="text-[22px] font-semibold tracking-tight text-white">
              {contact.primary.title}
            </h3>
            <p className="mt-2.5 text-[14px] leading-relaxed text-white/75">
              {contact.primary.body}
            </p>

            <Button asChild variant="primary" size="block" className="mt-6">
              <Link href={contact.primary.href}>
                {contact.primary.cta}
                <ArrowRight />
              </Link>
            </Button>

            <p className="mt-7 border-t border-white/15 pt-6 text-[12px] font-medium tracking-wide text-white/55 uppercase">
              Or go straight to a service
            </p>
            <ul className="mt-3 grid gap-1">
              {contact.services.map((service) => (
                <li key={service.href}>
                  <Link
                    href={service.href}
                    className="group -mx-2 flex items-center justify-between gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-white/10"
                  >
                    <span className="text-[13.5px] font-medium text-white/90">
                      {service.label}
                    </span>
                    <span className="flex items-center gap-2">
                      {service.status === "soon" ? (
                        <Badge
                          variant="outline"
                          size="sm"
                          className="border-white/25 text-white/70"
                        >
                          Soon
                        </Badge>
                      ) : null}
                      <ArrowRight className="size-3.5 text-white/55 transition-transform duration-300 group-hover:translate-x-0.5" />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        </Reveal>
      </div>
    </section>
  );
}
