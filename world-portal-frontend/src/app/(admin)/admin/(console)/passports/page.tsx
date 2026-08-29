import { Suspense } from "react";

import { PageHeader } from "@/components/admin";
import { passports } from "@/content/admin";
import { PassportsTable } from "@/features/passports/components/passports-table";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({ title: "Passports", noIndex: true });

export default function PassportsPage() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        lead={passports.headingLead}
        accent={passports.headingAccent}
        body={passports.body}
      />
      <Suspense>
        <PassportsTable />
      </Suspense>
    </div>
  );
}
