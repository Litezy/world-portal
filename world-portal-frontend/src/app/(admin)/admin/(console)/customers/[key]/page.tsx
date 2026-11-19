import { CustomerDetail } from "@/features/customers/components/customer-detail";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({ title: "Applicant", noIndex: true });

export default async function CustomerPage({
  params,
}: PageProps<"/admin/customers/[key]">) {
  const { key } = await params;
  return <CustomerDetail customerKey={key} />;
}
