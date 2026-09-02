import Link from "next/link";

import { ArrowLeft } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { TripPlanner } from "@/features/trip/components/trip-planner";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Start my trip",
  description:
    "Answer a few questions about where you are going and what you already have. We will tell you exactly which steps apply to you, in the order they have to happen.",
  path: "/start",
});

export default function StartPage() {
  return (
    <Section spacing="md">
      <Container size="prose">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-[13px] font-medium text-muted-foreground transition-colors hover:text-ink-900"
        >
          <ArrowLeft className="size-4" />
          Back to E-Embassy
        </Link>

        <div className="mt-6">
          <Badge variant="eyebrow" dot className="mb-4">
            Start my trip
          </Badge>
          <h1 className="text-[32px] leading-[1.1] font-semibold tracking-[-0.03em] text-balance text-ink-900 sm:text-[42px]">
            Tell us where you are going{" "}
            <span className="heading-serif font-normal">and we will do the rest.</span>
          </h1>
          <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">
            You do not need to know whether your problem is a passport, a visa or both.
            Four quick questions and we will lay out exactly what applies to you, in the
            order it has to happen. Nothing to pay.
          </p>
        </div>

        <div className="mt-10">
          <TripPlanner />
        </div>
      </Container>
    </Section>
  );
}
