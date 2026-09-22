import { Suspense } from "react";

import { PageHeader } from "@/components/admin";
import { AdminProfessionalsTable } from "@/features/hire/components/admin-professionals-table";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({ title: "Professionals Management", noIndex: true });

export default function AdminProfessionalsPage() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        lead="Professional Services &"
        accent="Moderation Console"
        body="Inspect registered destination professionals, verify identity & qualifications, toggle profile verification badges, and manage category listings."
      />
      <Suspense>
        <AdminProfessionalsTable />
      </Suspense>
    </div>
  );
}
