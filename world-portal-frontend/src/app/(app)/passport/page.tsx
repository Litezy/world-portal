import Link from "next/link";

import { ArrowLeft, Check } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { PassportForm } from "@/features/passport/components/passport-form";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Passport application",
  description:
    "Apply for a first passport, renew one that is expiring, or replace one that was lost or damaged. World Portal handles the forms, photos and appointment.",
  path: "/passport",
});

const whatYouNeed = [
  "Proof of who you are — birth certificate or a national ID card",
  "Proof of where you live — a recent utility bill or bank statement",
  "Two passport photographs, taken against a plain white background",
  "Your old passport, if you have ever had one",
];

const steps = [
  {
    title: "Send us your details",
    body: "The short form below. No documents needed yet, and nothing to pay.",
  },
  {
    title: "We tell you exactly what to bring",
    body: "Requirements differ by country and by passport type. We send you one checklist, specific to you.",
  },
  {
    title: "We book your appointment",
    body: "We fill in the application, submit it, and book the biometrics slot at your nearest office.",
  },
  {
    title: "You collect your passport",
    body: "We track it and tell you the day it is ready. Then your visa can start.",
  },
];

export default function PassportPage() {
  return (
    <Section spacing="md">
      <Container>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-[13px] font-medium text-muted-foreground transition-colors hover:text-ink-900"
        >
          <ArrowLeft className="size-4" />
          Back to World Portal
        </Link>

        <div className="mt-6 max-w-2xl">
          <Badge variant="eyebrow" dot className="mb-4">
            Passport application
          </Badge>
          <h1 className="text-[32px] leading-[1.1] font-semibold tracking-[-0.03em] text-balance text-ink-900 sm:text-[42px]">
            Get the passport{" "}
            <span className="heading-serif font-normal">before anything else.</span>
          </h1>
          <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">
            A passport is proof of who you are, issued by your own country. Every visa
            is stamped inside it, so nothing else can start until you have one with
            enough time left on it. Tell us your situation and we will take it from
            there.
          </p>
        </div>

        <div className="mt-12 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-14">
          <div className="grid gap-6">
            <Card variant="solid" radius="2xl" padding="lg" className="gap-0">
              <h2 className="text-[18px] font-semibold tracking-tight text-ink-900">
                What you will need
              </h2>
              <ul className="mt-4 grid gap-3">
                {whatYouNeed.map((item) => (
                  <li key={item} className="flex items-start gap-2.5">
                    <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
                      <Check className="size-3" strokeWidth={3} />
                    </span>
                    <span className="text-[13.5px] leading-relaxed text-ink-800">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-5 text-[12.5px] leading-relaxed text-muted-foreground">
                Not sure you have all of these? Send the form anyway — we will tell you
                what is missing and how to get it.
              </p>
            </Card>

            <Card variant="solid" radius="2xl" padding="lg" className="gap-0">
              <h2 className="text-[18px] font-semibold tracking-tight text-ink-900">
                How it goes
              </h2>
              <ol className="mt-5 grid gap-5">
                {steps.map((step, i) => (
                  <li key={step.title} className="flex gap-3.5">
                    <span className="grid size-7 shrink-0 place-items-center rounded-full bg-secondary text-[12px] font-semibold text-ink-800">
                      {i + 1}
                    </span>
                    <div>
                      <p className="text-[14.5px] font-semibold tracking-tight text-ink-900">
                        {step.title}
                      </p>
                      <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
                        {step.body}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </Card>
          </div>

          <div id="form">
            <PassportForm />
          </div>
        </div>
      </Container>
    </Section>
  );
}
