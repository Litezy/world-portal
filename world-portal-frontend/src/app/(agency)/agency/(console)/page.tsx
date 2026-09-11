import { getAgencySession } from "@/app/api/agency/_session";
import { PageHeader } from "@/components/admin";
import { agencyOverview } from "@/content/agency";
import { AgencyOverviewView } from "@/features/agency/components/overview/overview-view";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({ title: "Agency overview", noIndex: true });

export default async function AgencyOverviewPage() {
  // The console layout has already redirected anyone without a session; this
  // read is only for the greeting, so it falls back rather than guarding again.
  const session = await getAgencySession();
  const firstName = session?.name.split(" ")[0] ?? "there";

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        lead={agencyOverview.headingLead}
        accent={firstName}
        body={agencyOverview.body}
      />
      <AgencyOverviewView />
    </div>
  );
}
