"use client";

import * as React from "react";
import { ApplicantSidebar } from "@/components/layout/applicant-sidebar";
import { ApplicantTopbar } from "@/components/layout/applicant-topbar";

export default function ApplicantStandaloneLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
