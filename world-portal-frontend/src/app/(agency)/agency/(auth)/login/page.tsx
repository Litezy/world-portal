import { Suspense } from "react";
import Link from "next/link";

import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/components/ui/section-heading";
import { agencyAuth } from "@/content/agency";
import { AgencyLoginForm } from "@/features/agency/components/auth/login-form";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({ title: "Agency sign in", noIndex: true });

export default function AgencyLoginPage() {
  const copy = agencyAuth.login;

  return (
    <Card variant="solid" radius="2xl" padding="lg" className="w-full max-w-md">
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
        <AgencyLoginForm />
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
