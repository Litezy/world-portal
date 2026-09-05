import Link from "next/link";

import { ArrowLeft, Check, ShieldCheck, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { PassportForm } from "@/features/passport/components/passport-form";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Passport Application",
  description:
    "Apply for a first passport, renew an expiring passport, or replace a lost or damaged passport. E-Embassy handles forms, photo verification, and biometric appointment scheduling.",
  path: "/passport",
});

const whatYouNeed = [
  "National ID Number (NIN) or Birth Certificate",
  "Proof of Address — recent utility bill or official ID card",
  "Passport photo (white background, clear biometric standard)",
  "Existing passport details (if renewing or replacing)",
];

const steps = [
  {
    title: "Fill the application form",
    body: "Complete the guided application details. No physical document visits needed yet.",
  },
  {
    title: "Requirement verification",
    body: "Our consultants review your submitted details and verify document validity.",
  },
  {
    title: "Biometric appointment booking",
    body: "We schedule your official biometric data capture appointment at the nearest center.",
  },
  {
    title: "Passport issuance & tracking",
    body: "Track your passport processing in real-time until collection.",
  },
];

export default function PassportPage() {
  return (
    <Section spacing="md">
      <Container className="max-w-5xl">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-[13px] font-medium text-muted-foreground transition-colors hover:text-ink-900"
        >
          <ArrowLeft className="size-4" />
          Back to E-Embassy
        </Link>

        <div className="mt-6 max-w-3xl">
          <Badge variant="eyebrow" dot className="mb-4">
            Official Passport Processing
          </Badge>
          <h1 className="text-[32px] leading-[1.1] font-semibold tracking-[-0.03em] text-balance text-ink-900 sm:text-[42px]">
            Get your passport{" "}
            <span className="heading-serif font-normal">processed stress-free.</span>
          </h1>
          <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
            Complete the official e-Passport application form below.
          </p>
        </div>

        {/* Passport Application Form - Front and Center */}
        <div id="form" className="mt-8">
          <PassportForm />
        </div>

        {/* Info Cards Grid Below Form */}
        <div className="mt-14 grid gap-6 md:grid-cols-2">
          <Card variant="solid" radius="2xl" padding="lg" className="gap-0 bg-muted/20 border-border/70">
            <h2 className="text-[17px] font-semibold tracking-tight text-ink-900 flex items-center gap-2">
              <ShieldCheck className="size-5 text-primary" />
              What You Will Need
            </h2>
            <ul className="mt-4 grid gap-3">
              {whatYouNeed.map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-primary/15 text-primary">
                    <Check className="size-3" strokeWidth={3} />
                  </span>
                  <span className="text-[13.5px] leading-relaxed text-ink-800">
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </Card>

          <Card variant="solid" radius="2xl" padding="lg" className="gap-0 bg-muted/20 border-border/70">
            <h2 className="text-[17px] font-semibold tracking-tight text-ink-900 flex items-center gap-2">
              <Sparkles className="size-5 text-primary" />
              How It Works
            </h2>
            <ol className="mt-4 grid gap-3">
              {steps.map((step, i) => (
                <li key={step.title} className="flex items-start gap-3">
                  <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary/10 text-[11.5px] font-bold text-primary mt-0.5">
                    {i + 1}
                  </span>
                  <div>
                    <p className="text-[13.5px] font-semibold text-ink-900">
                      {step.title}
                    </p>
                    <p className="text-[12.5px] leading-normal text-muted-foreground mt-0.5">
                      {step.body}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </Card>
        </div>
      </Container>
    </Section>
  );
}
