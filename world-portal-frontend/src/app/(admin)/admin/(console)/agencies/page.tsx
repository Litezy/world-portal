import { Suspense } from "react";

import { PageHeader } from "@/components/admin";
import { AdminAgenciesTable } from "@/features/agency/components/admin-agencies-table";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({ title: "Agencies Management", noIndex: true });

export default function AdminAgenciesPage() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        lead="Agency Directory &"
        accent="Verification Console"
        body="Inspect registered partner agencies, verify compliance paperwork, review service offerings, and manage active listing statuses."
      />
      <Suspense>
        <AdminAgenciesTable />
      </Suspense>
    </div>
  );
}
