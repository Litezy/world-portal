import { Suspense } from "react";
import Link from "next/link";

import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/components/ui/section-heading";
import { agencyAuth } from "@/content/agency";
import { AgencySignupForm } from "@/features/agency/components/auth/signup-form";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({ title: "List your agency", noIndex: true });

export default function AgencySignupPage() {
  const copy = agencyAuth.signup;

  return (
    <Card variant="solid" radius="2xl" padding="lg" className="w-full max-w-xl">
      <SectionHeading
        as="h1"
        size="sm"
        eyebrow={copy.eyebrow}
        lead={copy.headingLead}
        accent={copy.headingAccent}
        body={copy.body}
        className="[&_p]:text-sm"
      />
      <Suspense>
        <AgencySignupForm />
      </Suspense>
      <p className="text-center text-[13px] text-muted-foreground">
        {copy.switchPrompt}{" "}
        <Link
          href={copy.switchHref}
          className="font-semibold text-primary underline-offset-4 hover:underline"
        >
          {copy.switchCta}
        </Link>
      </p>
    </Card>
  );
}
