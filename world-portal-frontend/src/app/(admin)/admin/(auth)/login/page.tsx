import { Suspense } from "react";

import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/components/ui/section-heading";
import { login } from "@/content/admin";
import { LoginForm } from "@/features/auth/components/login-form";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({ title: "Sign in", noIndex: true });

export default function LoginPage() {
  return (
    <Card variant="solid" radius="2xl" padding="lg" className="w-full max-w-md">
      <SectionHeading
        as="h1"
        size="sm"
        eyebrow={login.eyebrow}
        lead={login.headingLead}
        accent={login.headingAccent}
        body={login.body}
        className="[&_p]:text-sm"
      />
      <Suspense>
        <LoginForm />
      </Suspense>
    </Card>
  );
}
