import Link from "next/link";

import { ArrowLeft } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { ApplicationForm } from "@/features/visa/components/application-form";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Start a visa application",
  description:
    "Submit your visa application to World Portal — upload your documents, submit in one sitting, and track the decision with your reference.",
  path: "/apply",
});

export default function ApplyPage() {
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
            Visa application
          </Badge>
          <h1 className="text-[32px] leading-[1.1] font-semibold tracking-[-0.03em] text-balance text-ink-900 sm:text-[42px]">
            Start your application{" "}
            <span className="heading-serif font-normal">in one sitting.</span>
          </h1>
          <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">
            Four short steps and your documents. Nothing is payable now — a consultant
            reviews your file first and comes back with a fixed quote. Takes about ten
            minutes.
          </p>
        </div>

        <div className="mt-12">
          <ApplicationForm />
        </div>
      </Container>
    </Section>
  );
}
