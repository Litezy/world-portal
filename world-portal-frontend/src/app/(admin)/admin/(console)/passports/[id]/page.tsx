import { PassportDetail } from "@/features/passports/components/passport-detail";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({ title: "Passport application", noIndex: true });

export default async function PassportPage({
  params,
}: PageProps<"/admin/passports/[id]">) {
  const { id } = await params;
  return <PassportDetail id={id} />;
}
