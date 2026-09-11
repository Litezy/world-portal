import { Suspense } from "react";

import { PageHeader } from "@/components/admin";
import { agencyStaff as copy } from "@/content/agency";
import { AddStaffDialog } from "@/features/agency/components/staff/add-staff-dialog";
import { StaffTable } from "@/features/agency/components/staff/staff-table";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({ title: "Staff", noIndex: true });

export default function AgencyStaffPage() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        lead={copy.headingLead}
        accent={copy.headingAccent}
        body={copy.body}
        actions={<AddStaffDialog />}
      />
      <Suspense>
        <StaffTable />
      </Suspense>
    </div>
  );
}
