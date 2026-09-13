import { Suspense } from "react";

import { PageHeader } from "@/components/admin";
import { agencyAssignments as copy } from "@/content/agency";
import { AssignmentsTable } from "@/features/agency/components/assignments/assignments-table";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({ title: "Assignments", noIndex: true });

export default function AgencyAssignmentsPage() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        lead={copy.headingLead}
        accent={copy.headingAccent}
        body={copy.body}
      />
      {/* useListParams reads useSearchParams — it needs a boundary to suspend in. */}
      <Suspense>
        <AssignmentsTable />
      </Suspense>
    </div>
  );
}
