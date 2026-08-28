import { Suspense } from "react";

import { PageHeader } from "@/components/admin";
import { enquiries } from "@/content/admin";
import { EnquiriesTable } from "@/features/enquiries/components/enquiries-table";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({ title: "Enquiries", noIndex: true });

export default function EnquiriesPage() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        lead={enquiries.headingLead}
        accent={enquiries.headingAccent}
        body={enquiries.body}
      />
      <Suspense>
        <EnquiriesTable />
      </Suspense>
    </div>
  );
}
