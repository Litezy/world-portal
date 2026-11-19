import Link from "next/link";

import { ShieldAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { homeFor, navItemFor } from "@/config/admin-navigation";
import { roleGate as copy, roleLabels } from "@/content/admin";
import { getSession } from "@/server/auth";

/**
 * Server-side page guard for the console. A role that can't use a page sees
 * why — which role it needs and where to go instead — rather than a screen of
 * failed requests. Roles come from the page's nav entry, so the sidebar and
 * the gate can never disagree. (The console layout has already required a
 * session; the service still enforces its own roles behind this.)
 */
export async function RoleGate({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  const session = await getSession();
  const item = navItemFor(href);
  if (!session || !item || item.roles.includes(session.role)) return children;

  const needs = item.roles.map((role) => roleLabels[role]).join(" or ");
  return (
    <EmptyState
      icon={ShieldAlert}
      title={copy.title}
      description={copy.body(roleLabels[session.role], needs)}
      action={
        <Button asChild variant="outline" size="sm">
          <Link href={homeFor(session.role)}>{copy.back}</Link>
        </Button>
      }
    />
  );
}
