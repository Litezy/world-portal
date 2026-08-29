import Image from "next/image";
import Link from "next/link";

import { CircleCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/components/ui/section-heading";
import { packages } from "@/content/landing";
import { formatCurrency } from "@/lib/utils";

/**
 * Full-bleed photograph with the offer sitting on it as a single sheet of
 * water glass — the clearest demonstration of the glass treatment on the page.
 */
export function Packages() {
  const { offer } = packages;
  // "$1,450" -> ["$", "1,450"] so the symbol can be set smaller than the figure.
  const formatted = formatCurrency(offer.price);
  const currency = formatted.replace(/[\d.,\s]/g, "");
  const amount = formatted.replace(/[^\d.,]/g, "");

  return (
    <section id="packages" className="relative isolate overflow-hidden">
      <Image
        src={packages.background.src}
        alt={packages.background.alt}
        fill
        sizes="100vw"
        className="-z-20 object-cover"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(8,14,24,0.34)_0%,rgba(8,14,24,0.10)_40%,rgba(8,14,24,0.22)_100%)]"
      />

      <div className="mx-auto flex max-w-[1200px] flex-col items-center px-5 py-20 sm:px-8 lg:py-28">
        <SectionHeading
          eyebrow={packages.eyebrow}
          lead={packages.headingLead}
          accent={packages.headingAccent}
          body={packages.body}
          align="center"
          onDark
          size="md"
        />

        <Card
          variant="glass"
          radius="2xl"
          padding="none"
          className="mt-12 w-full max-w-[440px] p-7 sm:p-8"
        >
          <Badge variant="solid" size="md" dot dotClassName="bg-ink-900/70">
            {offer.badge}
          </Badge>

          <h3 className="mt-5 text-[22px] font-semibold tracking-tight text-ink-900">
            {offer.name}
          </h3>
          <p className="mt-1 text-[13px] text-muted-foreground">{offer.duration}</p>

          <p className="mt-6 flex items-start text-ink-900">
            <span className="heading-serif mt-2 text-2xl font-normal">{currency}</span>
            <span className="heading-serif text-[52px] leading-[0.95] font-normal tracking-[-0.01em]">
              {amount}
            </span>
            <span className="mt-auto pb-2 pl-1 text-[12px] text-muted-foreground">
              {offer.priceUnit}
            </span>
          </p>

          <p className="mt-7 text-[13px] font-medium text-ink-900">
            {offer.includesLabel}
          </p>
          <ul className="mt-3 space-y-2.5">
            {offer.includes.map((item) => (
              <li key={item} className="flex items-center gap-2.5 text-[13.5px]">
                <CircleCheck
                  className="size-[17px] shrink-0 text-ink-700"
                  strokeWidth={1.6}
                />
                <span className="text-ink-800">{item}</span>
              </li>
            ))}
          </ul>

          <Button asChild variant="ink" size="block" className="mt-8">
            <Link href={offer.cta.href}>{offer.cta.label}</Link>
          </Button>
        </Card>
      </div>
    </section>
  );
}
