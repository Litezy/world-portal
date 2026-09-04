import { redirect } from "next/navigation";

import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { AdminTopbar } from "@/components/layout/admin-topbar";
import { getSession } from "@/server/auth";

export default async function ConsoleLayout({ children }: LayoutProps<"/admin">) {
  const session = await getSession();
  if (!session) redirect("/admin/login");
  const { exp: _exp, ...user } = session;

  return (
    <div className="flex min-h-dvh bg-background text-foreground">

      <AdminSidebar user={user} />
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminTopbar user={user} />
        <main id="main" className="flex-1 px-4 py-6 sm:px-6 lg:px-6 lg:py-8">
          <div className="mx-auto w-full max-w-[1440px]">{children}</div>
        </main>

      </div>
    </div>
  );
}
