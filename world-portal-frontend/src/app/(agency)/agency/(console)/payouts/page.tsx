import { Suspense } from "react";

import { PageHeader } from "@/components/admin";
import { agencyPayouts as copy } from "@/content/agency";
import { PayoutsView } from "@/features/agency/components/payouts/payouts-view";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({ title: "Payouts", noIndex: true });

export default function AgencyPayoutsPage() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        lead={copy.headingLead}
        accent={copy.headingAccent}
        body={copy.body}
      />
      <Suspense>
        <PayoutsView />
      </Suspense>
    </div>
  );
}
