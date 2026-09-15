"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { KeyRound, Mail, ShieldCheck, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useApplicantAuthStore } from "@/features/applicant/store/applicant-auth-store";

export function ApplicantLoginModal({
  open,
  onOpenChange,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}) {
  const router = useRouter();
  const login = useApplicantAuthStore((s) => s.login);

  const [email, setEmail] = React.useState("");
  const [step, setStep] = React.useState<"EMAIL" | "OTP">("EMAIL");
  const [otpCode, setOtpCode] = React.useState("");

  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [successMsg, setSuccessMsg] = React.useState<string | null>(null);

  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!email.trim() || !email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    setError(null);
    setSuccessMsg(null);
    setIsLoading(true);

    try {
      const res = await fetch("/api/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const body = await res.json();
      if (!res.ok) {
        throw new Error(body.error || "Failed to send verification code");
      }

      setStep("OTP");
      setSuccessMsg("Verification code sent to your email.");
    } catch (err: any) {
      setError(err.message || "Failed to send verification code.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!otpCode.trim() || otpCode.trim().length !== 6) {
      setError("Please enter the 6-digit verification code.");
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch("/api/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), code: otpCode.trim() }),
      });
      const body = await res.json();
      if (!res.ok) {
        throw new Error(body.message || body.error || "Invalid verification code");
      }

      // Login success -> persist applicant session & redirect to /applicant/applications
      login(email.trim(), body.token, body.profileId);
      onOpenChange(false);
      if (onSuccess) {
        onSuccess();
      } else {
        router.push("/applicant/applications");
      }
    } catch (err: any) {
      setError(err.message || "Invalid or expired verification code.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-6">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="eyebrow" dot>
              Applicant Login
            </Badge>
          </div>
          <DialogTitle className="text-[20px] font-semibold text-ink-900">
            {step === "EMAIL" ? "Sign in to continue" : "Enter Verification Code"}
          </DialogTitle>
          <DialogDescription className="text-[13px] text-muted-foreground">
            {step === "EMAIL"
              ? "Sign in with your email address to proceed to checkout and save your trip bookings."
              : `We sent a 6-digit code to ${email}.`}
          </DialogDescription>
        </DialogHeader>

        {step === "EMAIL" ? (
          <form onSubmit={handleSendOtp} className="mt-4 flex flex-col gap-4">
            <div>
              <label
                htmlFor="applicant-email"
                className="mb-1.5 block text-[12.5px] font-medium text-ink-800"
              >
                Email Address
              </label>
              <Input
                id="applicant-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                leftIcon={<Mail />}
                required
              />
            </div>

            {error ? (
              <p className="text-[12.5px] font-medium text-destructive">{error}</p>
            ) : null}

            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isLoading}
              loadingText="Sending Code…"
              fullWidth
              leftIcon={<Sparkles className="size-4" />}
            >
              Continue with Email OTP
            </Button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="mt-4 flex flex-col gap-4">
            <div>
              <label
                htmlFor="applicant-otp"
                className="mb-1.5 block text-[12.5px] font-medium text-ink-800"
              >
                6-Digit Code
              </label>
              <Input
                id="applicant-otp"
                value={otpCode}
                onChange={(e) =>
                  setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                placeholder="123456"
                maxLength={6}
                className="font-mono text-center tracking-widest text-[18px]"
                leftIcon={<KeyRound />}
                required
              />
            </div>

            {error ? (
              <p className="text-[12.5px] font-medium text-destructive">{error}</p>
            ) : null}
            {successMsg ? (
              <p className="text-[12.5px] font-medium text-success">{successMsg}</p>
            ) : null}

            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isLoading}
              loadingText="Verifying…"
              fullWidth
              leftIcon={<ShieldCheck className="size-4" />}
            >
              Verify & Proceed
            </Button>

            <button
              type="button"
              onClick={() => setStep("EMAIL")}
              className="text-[12.5px] text-muted-foreground hover:text-ink-900 transition-colors"
            >
              ← Change email address
            </button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
