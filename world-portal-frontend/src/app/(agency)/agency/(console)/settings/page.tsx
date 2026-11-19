import { getAgencySession } from "@/app/api/agency/_session";
import { PageHeader } from "@/components/admin";
import { agencySettings as copy } from "@/content/agency";
import { AgencySettingsView } from "@/features/agency/components/settings/settings-view";
import { buildMetadata } from "@/lib/seo";
import { toClientAgencyUser } from "@/server/agency/client-user";

export const metadata = buildMetadata({ title: "Agency settings", noIndex: true });

export default async function AgencySettingsPage() {
  const session = await getAgencySession();
  // The view wants the person, not the cookie's claims.
  const user = session ? toClientAgencyUser(session) : undefined;

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
