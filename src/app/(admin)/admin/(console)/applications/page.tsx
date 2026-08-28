import { Suspense } from "react";

import { PageHeader } from "@/components/admin";
import { applications } from "@/content/admin";
import { ApplicationsTable } from "@/features/applications/components/applications-table";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({ title: "Applications", noIndex: true });

export default function ApplicationsPage() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        lead={applications.headingLead}
        accent={applications.headingAccent}
        body={applications.body}
      />
      <Suspense>
        <ApplicationsTable />
      </Suspense>
    </div>
  );
}
