import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { AgencySidebar } from "@/components/layout/agency-sidebar";
import { AgencyTopbar } from "@/components/layout/agency-topbar";
import { serverEnv } from "@/config/env";
import type { AgencyUser } from "@/features/agency/types";
import {
  AGENCY_SESSION_COOKIE,
  verifyAgencySessionToken,
} from "@/server/agency/session";

export default async function AgencyConsoleLayout({
  children,
}: LayoutProps<"/agency">) {
  // Defence in depth: the proxy already guards `/agency/:path*`, but a layout
  // that trusts it would serve the whole dashboard if that matcher ever moved.
  const store = await cookies();
  const session = verifyAgencySessionToken(
    store.get(AGENCY_SESSION_COOKIE)?.value,
    serverEnv().SESSION_SECRET,
  );
  if (!session) redirect("/agency/login");

  const user: AgencyUser = {
    id: session.id,
    name: session.name,
    email: session.email,
    role: session.role,
    agencyId: session.agencyId,
    agencyName: session.agencyName,
  };

  return (
    <div className="flex min-h-dvh bg-background text-foreground">
      <AgencySidebar user={user} />
      <div className="flex min-w-0 flex-1 flex-col">
        <AgencyTopbar user={user} />
        <main id="main" className="flex-1 px-4 py-6 sm:px-6 lg:px-6 lg:py-8">
          <div className="mx-auto w-full max-w-[1440px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
