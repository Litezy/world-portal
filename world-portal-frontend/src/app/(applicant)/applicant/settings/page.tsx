"use client";

import * as React from "react";
import { LogOut, Mail, ShieldCheck, User } from "lucide-react";

import { PageHeader } from "@/components/admin";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { ApplicantLoginModal } from "@/features/applicant/components/applicant-login-modal";
import { useApplicantAuthStore } from "@/features/applicant/store/applicant-auth-store";

export default function ApplicantSettingsPage() {
  const email = useApplicantAuthStore((s) => s.email);
  const profileId = useApplicantAuthStore((s) => s.profileId);
  const isAuthenticated = useApplicantAuthStore((s) => s.isAuthenticated);
  const logout = useApplicantAuthStore((s) => s.logout);

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
              Applicant Profile Information
            </CardTitle>
            <CardDescription className="text-[13px]">
              Your central account details used across visa applications and hired pro bookings.
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
                  Account Profile ID
                </span>
                <p className="font-mono text-[13px] font-semibold text-ink-900">
                  {profileId || "GUEST"}
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-border flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                Session state is persisted locally on this device.
              </span>
              <Button
                variant="outline"
                size="sm"
                className="text-destructive hover:bg-destructive/10"
                onClick={logout}
                leftIcon={<LogOut className="size-3.5" />}
              >
                Sign Out
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
            Log in with your email address to manage your profile and active sessions.
          </p>
          <div className="pt-2 flex justify-center">
            <Button
              variant="primary"
              size="md"
              onClick={() => setLoginModalOpen(true)}
              leftIcon={<Mail className="size-4" />}
            >
              Sign In with Email OTP
            </Button>
          </div>
        </Card>
      )}

      <ApplicantLoginModal open={loginModalOpen} onOpenChange={setLoginModalOpen} />
    </div>
  );
}
