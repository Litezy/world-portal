"use client";

import * as React from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { Calendar, Mail, Send } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

import { Alert, AlertDescription } from "@/components/ui/alert";
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
import { appointmentInvite as copy } from "@/content/admin";
import { useInviteApplicant } from "@/features/applications/api/use-invite-applicant";
import { useInvitePassportApplicant } from "@/features/passports/api/use-invite-passport";
import { type InviteApplicantInput, inviteApplicantSchema } from "@/validations/admin";

type Props = {
  id: string;
  applicantName: string;
  applicantEmail: string;
  status: string;
  type?: "visa" | "passport";
};

const OTHER = "__other";

/** Half-hour slots across the working day, in the form the email prints. */
const TIME_SLOTS = Array.from({ length: 18 }, (_, i) => {
  const minutes = 8 * 60 + i * 30;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const suffix = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${m.toString().padStart(2, "0")} ${suffix}`;
});

/** `YYYY-MM-DD` for a local date, `days` from today. */
function localDay(days = 0) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function blankInvite(): InviteApplicantInput {
  return {
    purpose: copy.purposes[0],
    date: localDay(3),
    time: "10:00 AM",
    location: copy.defaultVenue,
    note: "",
  };
}

function FieldError({ id, message }: { id: string; message?: string }) {
  return message ? (
    <p id={id} className="text-[11.5px] text-destructive-text">
      {message}
    </p>
  ) : null;
}

/**
 * Invites the applicant in person. Offered once a file is under review —
 * before that there is nothing to see them about.
 */
export function InviteApplicantModal({
  id,
  applicantName,
  applicantEmail,
  status,
  type = "visa",
}: Props) {
  const [open, setOpen] = React.useState(false);
  const visaInvite = useInviteApplicant(id);
  const passportInvite = useInvitePassportApplicant(id);
  const invite = type === "passport" ? passportInvite : visaInvite;

  const form = useForm<InviteApplicantInput>({
    resolver: zodResolver(inviteApplicantSchema),
    defaultValues: blankInvite(),
  });
  const { errors } = form.formState;
  // Which list entry is picked; "something else" opens a free-text purpose.
  const [purposeChoice, setPurposeChoice] = React.useState<string>(copy.purposes[0]);

  if (status === "SUBMITTED" || status === "EVALUATED") return null;

  const submit = form.handleSubmit(async (values) => {
    try {
      await invite.mutateAsync({
        purpose: values.purpose,
        date: values.date,
        time: values.time,
        location: values.location,
        note: values.note || undefined,
      });
      toast.success(copy.done(applicantEmail));
      setOpen(false);
    } catch {
      // Shown in the dialog so nothing typed is lost.
    }
  });

  return (
    <Card
      variant="solid"
      radius="lg"
      padding="none"
      className="border-info/30 bg-info-wash p-6"
    >
      <div className="flex items-center gap-2.5 text-info-text">
        <Calendar className="size-5 shrink-0" aria-hidden />
        <CardTitle className="text-base font-semibold">{copy.title}</CardTitle>
      </div>
      <CardDescription className="mt-1 text-[12.5px] text-muted-foreground">
        {copy.body(applicantName)}
      </CardDescription>

      <div className="mt-4 flex items-center justify-between gap-3 border-t border-info/20 pt-4">
        <span className="text-xs text-muted-foreground">{copy.hint}</span>

        <Dialog
          open={open}
          onOpenChange={(next) => {
            setOpen(next);
            if (next) {
              form.reset(blankInvite());
              setPurposeChoice(copy.purposes[0]);
              invite.reset();
            }
          }}
        >
          <DialogTrigger asChild>
            <Button
              size="sm"
              variant="primary"
              className="shrink-0 gap-1.5 font-medium"
            >
              <Mail className="size-4" />
              {copy.trigger}
            </Button>
          </DialogTrigger>

          <DialogContent className="max-w-md p-6">
            <DialogHeader className="border-b border-border/60 pb-4">
              <DialogTitle className="flex items-center gap-2 text-base font-semibold">
                <Calendar className="size-4 text-info-text" aria-hidden />
                {copy.dialogTitle}
              </DialogTitle>
              <DialogDescription className="mt-0.5 text-xs">
                {copy.dialogBody(applicantEmail)}
              </DialogDescription>
            </DialogHeader>

            <form
              onSubmit={(e) => void submit(e)}
              className="mt-4 space-y-4"
              noValidate
            >
              {invite.isError ? (
                <Alert variant="destructive">
                  <AlertDescription>
                    {invite.error instanceof Error ? invite.error.message : copy.failed}
                  </AlertDescription>
                </Alert>
              ) : null}

              <div className="space-y-1.5">
                <Label htmlFor="invite-purpose">{copy.purpose}</Label>
                <Select
                  value={purposeChoice}
                  onValueChange={(value) => {
                    setPurposeChoice(value);
                    form.setValue("purpose", value === OTHER ? "" : value);
                  }}
                >
                  <SelectTrigger id="invite-purpose" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {copy.purposes.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                    <SelectItem value={OTHER}>{copy.otherPurpose}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {purposeChoice === OTHER ? (
                <div className="space-y-1.5">
                  <Label htmlFor="invite-custom">{copy.customPurpose}</Label>
                  <Input
                    id="invite-custom"
                    placeholder={copy.customPurposePlaceholder}
                    aria-invalid={Boolean(errors.purpose)}
                    aria-describedby="invite-custom-error"
                    {...form.register("purpose")}
                  />
                  <FieldError
                    id="invite-custom-error"
                    message={errors.purpose?.message}
                  />
                </div>
              ) : null}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="invite-date">{copy.date}</Label>
                  <Input
                    id="invite-date"
                    type="date"
                    min={localDay(0)}
                    aria-invalid={Boolean(errors.date)}
                    aria-describedby="invite-date-error"
                    {...form.register("date")}
                  />
                  <FieldError id="invite-date-error" message={errors.date?.message} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="invite-time">{copy.time}</Label>
                  <Controller
                    control={form.control}
                    name="time"
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger id="invite-time" className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TIME_SLOTS.map((slot) => (
                            <SelectItem key={slot} value={slot}>
                              {slot}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="invite-venue">{copy.venue}</Label>
                <Input
                  id="invite-venue"
                  aria-invalid={Boolean(errors.location)}
                  aria-describedby="invite-venue-error"
                  {...form.register("location")}
                />
                <FieldError
                  id="invite-venue-error"
                  message={errors.location?.message}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="invite-note">{copy.note}</Label>
                <Textarea
                  id="invite-note"
                  rows={3}
                  placeholder={copy.notePlaceholder}
                  aria-invalid={Boolean(errors.note)}
                  aria-describedby="invite-note-error"
                  {...form.register("note")}
                />
                <FieldError id="invite-note-error" message={errors.note?.message} />
              </div>

              <div className="flex justify-end gap-3 border-t border-border/60 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setOpen(false)}
                  disabled={invite.isPending}
                >
                  {copy.cancel}
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={invite.isPending}
                  leftIcon={<Send className="size-3.5" />}
                >
                  {copy.submit}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </Card>
  );
}
