import { UserAvatar } from "@/components/admin/user-avatar";
import { roleLabels } from "@/content/admin";
import { cn } from "@/lib/utils";
import type { AdminUser } from "@/types";

/** Who is signed in, and as what — the sidebar footer and the mobile drawer. */
export function AdminUserCard({
  user,
  className,
  children,
}: {
  user: AdminUser;
  className?: string;
  /** e.g. a sign-out action. */
  children?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl border border-border/60 bg-muted/50 p-3",
        className,
      )}
    >
      <UserAvatar user={user} size="sm" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-semibold text-foreground">
          {user.name}
        </p>
        <p className="truncate text-[11px] font-medium text-muted-foreground">
          {roleLabels[user.role]}
        </p>
      </div>
      {children}
    </div>
  );
}
