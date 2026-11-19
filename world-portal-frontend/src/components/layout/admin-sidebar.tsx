import { AdminSidebarContent } from "@/components/layout/admin-sidebar-content";
import type { ClientAdminUser } from "@/types";

/** Desktop: a fixed column a step apart from the page. Phones use the drawer. */
export function AdminSidebar({ user }: { user: ClientAdminUser }) {
  return (
    <aside className="sticky top-0 hidden h-dvh w-[260px] shrink-0 border-r border-border/70 bg-sidebar text-foreground lg:flex">
      <AdminSidebarContent user={user} />
    </aside>
  );
}
