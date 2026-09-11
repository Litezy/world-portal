import { AssignmentDetail } from "@/features/agency/components/assignments/assignment-detail";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({ title: "Assignment", noIndex: true });

export default async function AgencyAssignmentPage({
  params,
}: PageProps<"/agency/assignments/[id]">) {
  const { id } = await params;
  return <AssignmentDetail id={id} />;
}
