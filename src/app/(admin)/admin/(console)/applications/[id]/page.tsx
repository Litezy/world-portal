import { ApplicationDetail } from "@/features/applications/components/application-detail";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({ title: "Application", noIndex: true });

export default async function ApplicationPage({
  params,
}: PageProps<"/admin/applications/[id]">) {
  const { id } = await params;
  return <ApplicationDetail id={id} />;
}
