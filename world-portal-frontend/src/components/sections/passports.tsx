import { ServiceCards } from "@/components/sections/service-cards";
import { passports } from "@/content/landing";

/** Service — live. Nothing else can start until the passport exists. */
export function Passports() {
  return (
    <ServiceCards
      id="passports"
      eyebrow={passports.eyebrow}
      headingLead={passports.headingLead}
      headingAccent={passports.headingAccent}
      body={passports.body}
      items={passports.items}
      cta={passports.cta}
      tone="muted"
    />
  );
}
