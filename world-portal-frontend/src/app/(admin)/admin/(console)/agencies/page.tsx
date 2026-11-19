import { Suspense } from "react";

import { PageHeader } from "@/components/admin";
import { RoleGate } from "@/components/admin/role-gate";
import { agencies as copy } from "@/content/admin";
import { AdminAgenciesTable } from "@/features/agency/components/admin-agencies-table";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({ title: copy.metaTitle, noIndex: true });

export default function AdminAgenciesPage() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        lead={copy.headingLead}
        accent={copy.headingAccent}
        body={copy.body}
      />
      <RoleGate href="/admin/agencies">
        <Suspense>
          <AdminAgenciesTable />
        </Suspense>
      </RoleGate>
    </div>
  );
}
