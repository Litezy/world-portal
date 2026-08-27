import { Suspense } from "react";

import { PageHeader } from "@/components/admin";
import { customers } from "@/content/admin";
import { CustomersTable } from "@/features/customers/components/customers-table";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({ title: "Customers", noIndex: true });

export default function CustomersPage() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        lead={customers.headingLead}
        accent={customers.headingAccent}
        body={customers.body}
      />
      <Suspense>
        <CustomersTable />
      </Suspense>
    </div>
  );
}
