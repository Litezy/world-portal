import { Check, Mail, Phone } from "lucide-react";

import { ParallaxImage } from "@/components/motion/parallax-image";
import { Reveal } from "@/components/motion/reveal";
import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/components/ui/section-heading";
import { siteConfig } from "@/config/site";
import { contact } from "@/content/landing";
import { BookingForm } from "@/features/booking/components/booking-form";

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

export function Contact() {
  return (
    <section id="contact" className="relative isolate overflow-hidden">
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
        className="absolute inset-0 -z-10 bg-[linear-gradient(100deg,rgba(8,10,16,0.76)_0%,rgba(8,10,16,0.52)_45%,rgba(8,10,16,0.28)_100%)]"
      />

      <div className="mx-auto grid max-w-[1200px] gap-12 px-5 py-20 sm:px-8 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1fr)] lg:items-center lg:gap-16 lg:py-28">
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
          <ul className="mt-4 space-y-3">
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
          </ul>
        </Reveal>

        <Card variant="glass" radius="2xl" padding="none" className="w-full p-6 sm:p-8">
          <BookingForm />
        </Card>
      </div>
    </section>
  );
}
