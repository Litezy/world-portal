"use client";

import * as React from "react";
import { ArrowUpRight, LogOut, Mail, ShieldCheck, User } from "lucide-react";

import { PageHeader } from "@/components/admin";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { WORLDSTREET_URL } from "@/config/auth";
import { applicantSettings, worldStreetSignIn } from "@/content/applicant";
import { WorldStreetSignInDialog } from "@/features/applicant/components/worldstreet-sign-in-dialog";
import { useApplicantSession } from "@/features/applicant/hooks/use-applicant-session";

export default function ApplicantSettingsPage() {
  const { email, displayName, isAuthenticated, signOut } = useApplicantSession();

  const [loginModalOpen, setLoginModalOpen] = React.useState(false);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        lead="Account Settings &"
        accent="Profile Preferences"
        body="Manage your verified email identity, session persistence, security preferences, and travel notifications."
      />

      {isAuthenticated ? (
        <div className="grid gap-6 max-w-3xl">
          <Card variant="solid" radius="lg" padding="none" className="p-6 space-y-4 border border-border">
            <CardTitle className="text-base font-semibold text-ink-900 flex items-center gap-2">
              <User className="size-5 text-primary" />
              {applicantSettings.identityTitle}
            </CardTitle>
            <CardDescription className="text-[13px]">
              {applicantSettings.identityBody}
            </CardDescription>

            <div className="grid gap-4 pt-2 sm:grid-cols-2">
              <div className="rounded-xl border border-border bg-secondary/30 p-3.5 space-y-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Verified Email
                </span>
                <p className="text-[14px] font-semibold text-ink-900 flex items-center gap-2">
                  <Mail className="size-4 text-primary" />
                  {email}
                </p>
              </div>

              <div className="rounded-xl border border-border bg-secondary/30 p-3.5 space-y-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Name
                </span>
                <p className="text-[14px] font-semibold text-ink-900">{displayName}</p>
              </div>
            </div>

            <div className="pt-4 border-t border-border flex items-center justify-between">
              <a
                href={WORLDSTREET_URL}
                className="inline-flex items-center gap-1 text-xs font-medium text-primary underline-offset-4 hover:underline"
              >
                {applicantSettings.manageLabel}
                <ArrowUpRight className="size-3.5" />
              </a>
              <Button
                variant="outline"
                size="sm"
                className="text-destructive hover:bg-destructive/10"
                onClick={() => void signOut()}
                leftIcon={<LogOut className="size-3.5" />}
              >
                {worldStreetSignIn.signOutLabel}
              </Button>
            </div>
          </Card>
        </div>
      ) : (
        <Card variant="solid" radius="lg" padding="none" className="p-12 text-center space-y-4 max-w-2xl border border-border">
          <div className="mx-auto grid size-12 place-items-center rounded-full bg-primary/10 text-primary">
            <ShieldCheck className="size-6" />
          </div>
          <h2 className="text-[20px] font-semibold text-ink-900">
            Sign in to view account settings
          </h2>
          <p className="text-[13.5px] text-muted-foreground max-w-sm mx-auto">
            {applicantSettings.signedOutBody}
          </p>
          <div className="pt-2 flex justify-center">
            <Button
              variant="primary"
              size="md"
              onClick={() => setLoginModalOpen(true)}
              leftIcon={<Mail className="size-4" />}
            >
              {worldStreetSignIn.title}
            </Button>
          </div>
        </Card>
      )}

      <WorldStreetSignInDialog open={loginModalOpen} onOpenChange={setLoginModalOpen} />
    </div>
  );
}
