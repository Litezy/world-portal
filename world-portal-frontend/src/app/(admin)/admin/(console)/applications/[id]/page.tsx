import { ApplicationDetail } from "@/features/applications/components/application-detail";
import { buildMetadata } from "@/lib/seo";
import { DESK_ROLES, getSession } from "@/server/auth";
import type { AdminRole } from "@/types";

export const metadata = buildMetadata({ title: "Application", noIndex: true });

export default async function ApplicationPage({
  params,
}: PageProps<"/admin/applications/[id]">) {
  const { id } = await params;
  // Partners can read a file but not work it: the action routes need MANAGER
  // or STAFF, so their buttons are not shown.
  const session = await getSession();
  const canAct =
    !!session && (DESK_ROLES as readonly AdminRole[]).includes(session.role);
  return <ApplicationDetail id={id} canAct={canAct} />;
}
