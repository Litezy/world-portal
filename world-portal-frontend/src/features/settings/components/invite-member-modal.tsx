"use client";

import * as React from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { UserPlus } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
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
import { team } from "@/content/admin";
import { useInviteMember } from "@/features/admin/api/use-team";
import { type InviteMemberInput, inviteMemberSchema } from "@/validations/admin";

const copy = team.invite;
const ROLES = ["STAFF", "MANAGER", "PARTNER"] as const;

function FieldError({ id, message }: { id: string; message?: string }) {
  return message ? (
    <p id={id} className="text-[11.5px] text-destructive-text">
      {message}
    </p>
  ) : null;
}

/** One zod schema for this form and `/api/admin/team` (CLAUDE.md: one schema per form). */
export function InviteMemberModal() {
  const [open, setOpen] = React.useState(false);
  const invite = useInviteMember();

  const form = useForm<InviteMemberInput>({
    resolver: zodResolver(inviteMemberSchema),
    defaultValues: { firstName: "", lastName: "", email: "", role: "STAFF", phone: "" },
  });
  const { errors } = form.formState;

  const onSubmit = form.handleSubmit(async (values) => {
    await invite.mutateAsync(values);
    toast.success(copy.sent(values.email));
    form.reset();
    setOpen(false);
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) invite.reset();
      }}
    >
      <DialogTrigger asChild>
        <Button variant="primary" size="sm" className="gap-2">
          <UserPlus className="size-4" />
          {copy.trigger}
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{copy.title}</DialogTitle>
          <DialogDescription>{copy.body}</DialogDescription>
        </DialogHeader>

        <form onSubmit={(e) => void onSubmit(e)} className="space-y-4" noValidate>
          {invite.isError ? (
            <Alert variant="destructive">
              <AlertDescription>
                {invite.error instanceof Error
                  ? invite.error.message
                  : team.genericError}
              </AlertDescription>
            </Alert>
          ) : null}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="invite-first">{copy.firstName}</Label>
              <Input
                id="invite-first"
                aria-invalid={Boolean(errors.firstName)}
                aria-describedby="invite-first-error"
                {...form.register("firstName")}
              />
              <FieldError id="invite-first-error" message={errors.firstName?.message} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="invite-last">{copy.lastName}</Label>
              <Input
                id="invite-last"
                aria-invalid={Boolean(errors.lastName)}
                aria-describedby="invite-last-error"
                {...form.register("lastName")}
              />
              <FieldError id="invite-last-error" message={errors.lastName?.message} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="invite-email">{copy.email}</Label>
            <Input
              id="invite-email"
              type="email"
              autoComplete="off"
              aria-invalid={Boolean(errors.email)}
              aria-describedby="invite-email-error"
              {...form.register("email")}
            />
            <FieldError id="invite-email-error" message={errors.email?.message} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="invite-role">{copy.role}</Label>
            <Controller
              control={form.control}
              name="role"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="invite-role" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.map((role) => (
                      <SelectItem key={role} value={role}>
                        {copy.roles[role]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="flex justify-end gap-2 border-t border-border/60 pt-4">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              {copy.cancel}
            </Button>
            <Button type="submit" variant="primary" isLoading={invite.isPending}>
              {copy.submit}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
