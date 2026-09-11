import { getAgencySession } from "@/app/api/agency/_session";
import { PageHeader } from "@/components/admin";
import { agencySettings as copy } from "@/content/agency";
import { AgencySettingsView } from "@/features/agency/components/settings/settings-view";
import type { AgencyUser } from "@/features/agency/types";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({ title: "Agency settings", noIndex: true });

export default async function AgencySettingsPage() {
  const session = await getAgencySession();
  // `exp` is a cookie concern; the view wants the person, not the claim.
  const user: AgencyUser | undefined = session
    ? {
        id: session.id,
        name: session.name,
        email: session.email,
        role: session.role,
        agencyId: session.agencyId,
        agencyName: session.agencyName,
      }
    : undefined;

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        lead={copy.headingLead}
        accent={copy.headingAccent}
        body={copy.body}
      />
      <AgencySettingsView user={user} />
    </div>
  );
}
