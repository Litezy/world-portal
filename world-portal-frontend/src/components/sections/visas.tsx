import { ServiceCards } from "@/components/sections/service-cards";
import { visas } from "@/content/landing";

/** Service — live. The three routes into a visa. */
export function Visas() {
  return (
    <ServiceCards
      id="visas"
      eyebrow={visas.eyebrow}
      headingLead={visas.headingLead}
      headingAccent={visas.headingAccent}
      body={visas.body}
      items={visas.items}
      cta={visas.cta}
      secondaryCta={visas.secondaryCta}
    />
  );
}
