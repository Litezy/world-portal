import { PassportDetail } from "@/features/passports/components/passport-detail";
import { buildMetadata } from "@/lib/seo";
import { DESK_ROLES, getSession } from "@/server/auth";
import type { AdminRole } from "@/types";

export const metadata = buildMetadata({ title: "Passport application", noIndex: true });

export default async function PassportPage({
  params,
}: PageProps<"/admin/passports/[id]">) {
  const { id } = await params;
  // Partners can read a file but not work it: the action routes need MANAGER
  // or STAFF, so their buttons are not shown.
  const session = await getSession();
  const canAct =
    !!session && (DESK_ROLES as readonly AdminRole[]).includes(session.role);
  return <PassportDetail id={id} canAct={canAct} />;
}
