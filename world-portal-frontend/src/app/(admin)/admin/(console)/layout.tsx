import { redirect } from "next/navigation";

import { AdminPaletteProvider } from "@/components/admin/admin-palette";
import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { AdminTopbar } from "@/components/layout/admin-topbar";
import { getAdminPalette } from "@/server/admin-palette";
import { getSession } from "@/server/auth";
import { toClientUser } from "@/server/auth/client-user";

export default async function ConsoleLayout({ children }: LayoutProps<"/admin">) {
  const session = await getSession();
  if (!session) redirect("/admin/login");
  // The sidebar and top bar are client components: their props are written
  // into the page, and the session also holds the API access token.
  const user = toClientUser(session);
  const palette = await getAdminPalette();

  return (
    <AdminPaletteProvider initial={palette}>
      <div className="flex min-h-dvh bg-background text-foreground">
        <AdminSidebar user={user} />
        <div className="flex min-w-0 flex-1 flex-col">
          <AdminTopbar user={user} />
          <main id="main" className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            <div className="mx-auto w-full max-w-[1440px]">{children}</div>
          </main>
        </div>
      </div>
    </AdminPaletteProvider>
  );
}
