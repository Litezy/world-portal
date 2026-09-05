"use client";

import * as React from "react";
import { Calendar, Mail, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toaster";
import { useInviteApplicant } from "../api/use-invite-applicant";

type Props = {
  id: string;
  applicantName: string;
  applicantEmail: string;
  status: string;
};

const PURPOSE_OPTIONS = [
  "Biometric Data Capture",
  "Document Verification",
  "Visa Interview",
  "Passport Submission / Pick-up",
  "Medical & Security Screening",
  "Custom Purpose",
];

const DEFAULT_LOCATION = "Embassy Headquarters, Room 302";

export function InviteApplicantModal({
  id,
  applicantName,
  applicantEmail,
  status,
}: Props) {
  const [open, setOpen] = React.useState(false);
  const [selectedPurposeOption, setSelectedPurposeOption] = React.useState(
    PURPOSE_OPTIONS[0],
  );
  const [customPurpose, setCustomPurpose] = React.useState("");
  const [date, setDate] = React.useState("");
  const [time, setTime] = React.useState("10:00 AM");
  const [location, setLocation] = React.useState(DEFAULT_LOCATION);
  const [note, setNote] = React.useState("");
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const inviteMutation = useInviteApplicant(id);

  // Default date to 3 business days from today
  React.useEffect(() => {
    if (open && !date) {
      const nextDate = new Date();
      nextDate.setDate(nextDate.getDate() + 3);
      setDate(nextDate.toISOString().split("T")[0]);
    }
  }, [open, date]);

  // Invitations should ONLY be allowed from UNDER_REVIEW status onwards
  if (status === "SUBMITTED" || status === "EVALUATED") {
    return null;
  }

  const finalPurpose =
    selectedPurposeOption === "Custom Purpose"
      ? customPurpose.trim()
      : selectedPurposeOption;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!finalPurpose) {
      setErrorMsg("Please specify the invitation purpose.");
      return;
    }

    if (!date) {
      setErrorMsg("Please select an appointment date.");
      return;
    }

    if (!time) {
      setErrorMsg("Please enter an appointment time.");
      return;
    }

    if (!location.trim()) {
      setErrorMsg("Please enter the appointment location / venue.");
      return;
    }

    try {
      await inviteMutation.mutateAsync({
        purpose: finalPurpose,
        date,
        time,
        location: location.trim(),
        note: note.trim() || undefined,
      });

      toast.success("Invitation sent", {
        description: `An appointment invitation email has been dispatched to ${applicantEmail}.`,
      });
      setOpen(false);
    } catch (err: any) {
      setErrorMsg(
        err?.message || "Failed to send invitation. Please try again.",
      );
    }
  };

  return (
    <Card
      variant="solid"
      radius="lg"
      padding="none"
      className="p-6 border-blue-500/30 bg-blue-500/5"
    >
      <div className="flex items-center gap-2.5 text-blue-600 dark:text-blue-400">
        <Calendar className="size-5 shrink-0" />
        <CardTitle className="text-base font-semibold">
          Applicant Appointment Invitation
        </CardTitle>
      </div>
      <CardDescription className="mt-1 text-[12.5px] text-muted-foreground">
        Invite <strong>{applicantName}</strong> for biometrics capture, interview,
        or document verification.
      </CardDescription>

      <div className="mt-4 flex items-center justify-between gap-3 border-t border-blue-500/20 pt-4">
        <span className="text-xs text-muted-foreground">
          Dispatches email notification with venue & time details.
        </span>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button
              size="sm"
              variant="primary"
              className="gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium shrink-0"
            >
              <Mail className="size-4" />
              Invite Applicant
            </Button>
          </DialogTrigger>

          <DialogContent className="max-w-md p-6 backdrop-blur-2xl">
            <DialogHeader className="border-b border-border/60 pb-4">
              <DialogTitle className="text-base font-semibold flex items-center gap-2">
                <Calendar className="size-4 text-blue-600" />
                Invite Applicant for Appointment
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Send an official invitation email to <strong>{applicantEmail}</strong>.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              {errorMsg && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
                  {errorMsg}
                </div>
              )}

              {/* Purpose */}
              <div className="space-y-1.5">
                <Label htmlFor="purpose-select">Purpose *</Label>
                <Select
                  value={selectedPurposeOption}
                  onValueChange={setSelectedPurposeOption}
                >
                  <SelectTrigger id="purpose-select">
                    <SelectValue placeholder="Select purpose" />
                  </SelectTrigger>
                  <SelectContent>
                    {PURPOSE_OPTIONS.map((opt) => (
                      <SelectItem key={opt} value={opt}>
                        {opt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedPurposeOption === "Custom Purpose" && (
                <div className="space-y-1.5">
                  <Label htmlFor="custom-purpose">Custom Purpose *</Label>
                  <Input
                    id="custom-purpose"
                    placeholder="e.g. Biometrics Data Capture"
                    value={customPurpose}
                    onChange={(e) => setCustomPurpose(e.target.value)}
                    required
                  />
                </div>
              )}

              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="date">Appointment Date *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="time">Time *</Label>
                  <Input
                    id="time"
                    type="text"
                    placeholder="e.g. 10:30 AM"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Location */}
              <div className="space-y-1.5">
                <Label htmlFor="location">Location / Venue *</Label>
                <Input
                  id="location"
                  placeholder="e.g. Embassy Headquarters, Room 302"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  required
                />
              </div>

              {/* Optional Note */}
              <div className="space-y-1.5">
                <Label htmlFor="note">Optional Instructions / Notes</Label>
                <Textarea
                  id="note"
                  placeholder="e.g. Please bring original passport, physical passport photos, and bank reference."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                  className="text-xs"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border/60">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setOpen(false)}
                  disabled={inviteMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={inviteMutation.isPending}
                  loadingText="Sending..."
                  className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5"
                >
                  <Send className="size-3.5" />
                  Send Invitation
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </Card>
  );
}
