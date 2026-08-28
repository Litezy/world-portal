import { EnquiryDetail } from "@/features/enquiries/components/enquiry-detail";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({ title: "Enquiry", noIndex: true });

export default async function EnquiryPage({
  params,
}: PageProps<"/admin/enquiries/[id]">) {
  const { id } = await params;
  return <EnquiryDetail id={id} />;
}
