import { Suspense } from "react";

import { PageHeader } from "@/components/admin";
import { RoleGate } from "@/components/admin/role-gate";
import { professionals as copy } from "@/content/admin";
import { AdminProfessionalsTable } from "@/features/hire/components/admin-professionals-table";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({ title: copy.metaTitle, noIndex: true });

export default function AdminProfessionalsPage() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        lead={copy.headingLead}
        accent={copy.headingAccent}
        body={copy.body}
      />
      <RoleGate href="/admin/professionals">
        <Suspense>
          <AdminProfessionalsTable />
        </Suspense>
      </RoleGate>
    </div>
  );
}
