import { redirect } from "next/navigation";

import { PageHeader } from "@/components/admin";
import { finance as copy } from "@/content/admin";
import { FinanceView } from "@/features/finance/components/finance-view";
import { buildMetadata } from "@/lib/seo";
import { getSession } from "@/server/auth";

export const metadata = buildMetadata({ title: "Financial Operations", noIndex: true });

export default async function FinancePage() {
  const session = await getSession();
  if (!session) redirect("/admin/login");

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        lead={copy.headingLead}
        accent={copy.headingAccent}
        body={copy.body}
      />
      <FinanceView />
    </div>
  );
}
