import Link from "next/link";

import { ArrowLeft, ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { hire } from "@/content/hire";
import { HireBrowser } from "@/features/hire/components/hire-browser";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Hire a pro",
  description:
    "Photographers, private chefs, interpreters, security, childcare and fixers at your destination — vetted, with clear rates, added straight to your trip basket.",
  path: "/hire",
});

export default function HirePage() {
  return (
    <Section spacing="md">
      <Container>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-[13px] font-medium text-muted-foreground transition-colors hover:text-ink-900"
        >
          <ArrowLeft className="size-4" />
          Back to E-Embassy
        </Link>

        <div className="mt-6 max-w-2xl">
          <Badge variant="eyebrow" dot className="mb-4">
            {hire.eyebrow}
          </Badge>
          <h1 className="text-[32px] leading-[1.1] font-semibold tracking-[-0.03em] text-balance text-ink-900 sm:text-[42px]">
            {hire.headingLead}{" "}
            <span className="heading-serif font-normal">{hire.headingAccent}</span>
          </h1>
          <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">
            {hire.body}
          </p>
          <p className="mt-4 flex items-start gap-2 text-[12.5px] text-muted-foreground">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
            {hire.note}
          </p>
        </div>

        <div className="mt-12">
          <HireBrowser />
        </div>
      </Container>
    </Section>
  );
}
