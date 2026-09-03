import { redirect } from "next/navigation";

import { DetailItem, DetailList, PageHeader, UserAvatar } from "@/components/admin";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { roleLabels, settings } from "@/content/admin";
import { InviteMemberModal } from "@/features/settings/components/invite-member-modal";
import { NotificationSettings } from "@/features/settings/components/notification-settings";
import { SignOutButton } from "@/features/settings/components/sign-out-button";
import { TeamList } from "@/features/settings/components/team-list";
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

      <Tabs defaultValue="team" className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="team">Team & Access</TabsTrigger>
          <TabsTrigger value="profile">Profile & Security</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        <div className="mt-6">
          {/* Tab 1: Team & Access Management */}
          <TabsContent value="team" className="m-0 space-y-6">
            <Card variant="solid" radius="lg" padding="none">
              <CardHeader className="flex flex-row items-center justify-between p-6 pb-4">
                <div>
                  <CardTitle className="text-base">{settings.team.title}</CardTitle>
                  <CardDescription className="text-[13px]">
                    Manage admin users, processing staff, and partner access permissions.
                  </CardDescription>
                </div>
                {user.role === "MANAGER" && <InviteMemberModal />}
              </CardHeader>
              <CardContent className="p-6 pt-0">
                <TeamList />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 2: Profile & Security */}
          <TabsContent value="profile" className="m-0 space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card variant="solid" radius="lg" padding="none" className="p-6">
                <CardTitle className="text-base">{settings.profile.title}</CardTitle>
                <CardDescription className="text-[13px]">
                  {settings.profile.body}
                </CardDescription>

                <div className="mt-6 flex items-center gap-4">
                  <UserAvatar user={user} size="lg" className="ring-border" />
                  <div className="min-w-0">
                    <p className="truncate text-[15px] font-semibold text-foreground">{user.name}</p>
                    <p className="truncate text-[13px] text-muted-foreground">{user.email}</p>
                  </div>
                </div>

                <DetailList className="mt-8 sm:grid-cols-2">
                  <DetailItem label="Role">
                    <Badge variant="softNeutral" size="sm">
                      {roleLabels[user.role]}
                    </Badge>
                  </DetailItem>
                  <DetailItem label="Signed in as">{user.email}</DetailItem>
                </DetailList>
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
          </TabsContent>

          {/* Tab 3: Notifications */}
          <TabsContent value="notifications" className="m-0">
            <Card variant="solid" radius="lg" padding="none" className="p-6 max-w-2xl">
              <CardTitle className="text-base">{settings.notifications.title}</CardTitle>
              <CardDescription className="text-[13px]">
                {settings.notifications.body}
              </CardDescription>
              <div className="mt-6">
                <NotificationSettings />
              </div>
            </Card>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
