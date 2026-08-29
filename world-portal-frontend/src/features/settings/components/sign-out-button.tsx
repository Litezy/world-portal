"use client";

import { LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import { settings } from "@/content/admin";
import { useLogout } from "@/features/auth/api/use-logout";

export function SignOutButton() {
  const logout = useLogout();

  return (
    <Button
      variant="outline"
      size="md"
      className="w-fit"
      isLoading={logout.isPending}
      loadingText="Signing out"
      onClick={() => logout.mutate()}
    >
      <LogOut />
      {settings.danger.action}
    </Button>
  );
}
