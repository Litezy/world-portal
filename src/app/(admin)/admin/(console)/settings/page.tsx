import { redirect } from "next/navigation";

import { DetailItem, DetailList, PageHeader, UserAvatar } from "@/components/admin";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { settings } from "@/content/admin";
import { NotificationSettings } from "@/features/settings/components/notification-settings";
import { SignOutButton } from "@/features/settings/components/sign-out-button";
import { buildMetadata } from "@/lib/seo";
import { getSession } from "@/server/auth";

export const metadata = buildMetadata({ title: "Settings", noIndex: true });

export default async function SettingsPage() {
  const session = await getSession();
  if (!session) redirect("/admin/login");
  const { exp: _exp, ...user } = session;

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        lead={settings.headingLead}
        accent={settings.headingAccent}
        body={settings.body}
      />

      <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
        <Card variant="solid" radius="lg" padding="none" className="gap-0 p-6">
          <CardTitle className="text-base">{settings.profile.title}</CardTitle>
          <CardDescription className="text-[13px]">
            {settings.profile.body}
          </CardDescription>

          <div className="mt-6 flex items-center gap-4">
            <UserAvatar user={user} size="lg" className="ring-border" />
            <div className="min-w-0">
              <p className="truncate text-[15px] font-semibold">{user.name}</p>
              <p className="truncate text-[13px] text-muted-foreground">{user.email}</p>
            </div>
          </div>

          <DetailList className="mt-8 sm:grid-cols-2">
            <DetailItem label="Role">
              <Badge variant="muted" size="sm" className="capitalize">
                {user.role}
              </Badge>
            </DetailItem>
            <DetailItem label="Console access">Full</DetailItem>
          </DetailList>
        </Card>

        <div className="flex flex-col gap-4">
          <Card variant="solid" radius="lg" padding="none" className="gap-0 p-6">
            <CardTitle className="text-base">{settings.notifications.title}</CardTitle>
            <CardDescription className="text-[13px]">
              {settings.notifications.body}
            </CardDescription>
            <div className="mt-6">
              <NotificationSettings />
            </div>
          </Card>

          <Card variant="solid" radius="lg" padding="none" className="gap-4 p-6">
            <div>
              <CardTitle className="text-base">{settings.danger.title}</CardTitle>
              <CardDescription className="text-[13px]">
                {settings.danger.body}
              </CardDescription>
            </div>
            <SignOutButton />
          </Card>
        </div>
      </div>
    </div>
  );
}
