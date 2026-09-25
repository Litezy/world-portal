import * as React from "react";
import { unstable_rethrow } from "next/navigation";

import { ApplicantSidebar } from "@/components/layout/applicant-sidebar";
import { ApplicantTopbar } from "@/components/layout/applicant-topbar";
import { applicantBackend } from "@/server/applicant/backend";

/**
 * Onboarding is joining: every WorldStreet account may use E-Embassy, and the
 * first visit here records that it has. The call is idempotent — a returning
 * applicant simply re-joins — and it also attaches any application they filed
 * with the same verified email before accounts existed.
 *
 * A failed join never blocks the page. `src/proxy.ts` has already required a
 * WorldStreet session to reach this layout; the pages below surface their own
 * errors, including a suspended account, from the calls they make.
 */
async function joinEmbassy() {
  try {
    await applicantBackend("/me/join", { method: "POST" });
  } catch (error) {
    // Next signals "this page is dynamic" by throwing from auth(); swallowing
    // that would prerender the applicant area statically and never join.
    unstable_rethrow(error);
    console.warn(
      "[applicant] join failed:",
      error instanceof Error ? error.message : error,
    );
  }
}

export default async function ApplicantStandaloneLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await joinEmbassy();

  return (
    <div className="flex min-h-dvh bg-background text-foreground">
      {/* Standalone 264px Left Sidebar matching /agency & /admin */}
      <ApplicantSidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar matching /agency & /admin */}
        <ApplicantTopbar />

        <main id="main" className="flex-1 px-4 py-6 sm:px-6 lg:px-6 lg:py-8">
          <div className="mx-auto w-full max-w-[1440px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
