import { PageHeader } from "@/components/admin";
import { overview } from "@/content/admin";
import { DashboardOverview } from "@/features/dashboard/components/dashboard-overview";
import { buildMetadata } from "@/lib/seo";
import { getSession } from "@/server/auth";

export const metadata = buildMetadata({ title: "Overview", noIndex: true });

export default async function AdminOverviewPage() {
  const session = await getSession();
  const firstName = session?.name.split(" ")[0] ?? "there";

  return (
    <div className="flex flex-col gap-8">
      <PageHeader lead={overview.headingLead} accent={firstName} body={overview.body} />
      <DashboardOverview />
    </div>
  );
}
