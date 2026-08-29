import * as React from "react";
import Link from "next/link";

import { ArrowLeft } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { FullPageSpinner } from "@/components/ui/spinner";
import { TrackPanel } from "@/features/visa/components/track-panel";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Track your application",
  description:
    "Check the status of a World Portal visa application using the reference from your confirmation.",
  path: "/track",
  noIndex: true,
});

export default function TrackPage() {
  return (
    <Section spacing="md">
      <Container size="prose">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-[13px] font-medium text-muted-foreground transition-colors hover:text-ink-900"
        >
          <ArrowLeft className="size-4" />
          Back to World Portal
        </Link>

        <div className="mt-6">
          <Badge variant="eyebrow" dot className="mb-4">
            Track
          </Badge>
          <h1 className="text-[32px] leading-[1.1] font-semibold tracking-[-0.03em] text-balance text-ink-900 sm:text-[42px]">
            Where is my <span className="heading-serif font-normal">application?</span>
          </h1>
          <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">
            Enter the reference from your confirmation to see the current status, what
            has been paid, and anything your consultant has flagged.
          </p>
        </div>

        <div className="mt-10">
          {/* useSearchParams needs a Suspense boundary to stay statically rendered. */}
          <React.Suspense fallback={<FullPageSpinner label="Loading tracker" />}>
            <TrackPanel />
          </React.Suspense>
        </div>
      </Container>
    </Section>
  );
}
