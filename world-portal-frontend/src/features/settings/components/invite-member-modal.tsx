"use client";

import * as React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { UserPlus } from "lucide-react";
import { useForm } from "react-hook-form";

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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { internalApi } from "@/lib/api-client";

type InviteFormValues = {
  firstName: string;
  lastName: string;
  email: string;
  role: "MANAGER" | "STAFF" | "PARTNER";
  phone?: string;
};

export function InviteMemberModal() {
  const [open, setOpen] = React.useState(false);
  const queryClient = useQueryClient();

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<InviteFormValues>({
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      role: "STAFF",
      phone: "",
    },
  });

  const selectedRole = watch("role");

  const inviteMutation = useMutation({
    mutationFn: (values: InviteFormValues) =>
      internalApi.post<{ success: boolean; data: any }>("/admin/team", values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "team"] });
      reset();
      setOpen(false);
    },
  });

  const onSubmit = (values: InviteFormValues) => {
    inviteMutation.mutate(values);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="primary" size="sm" className="gap-2">
          <UserPlus className="size-4" />
          Invite Team Member
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="size-5 text-primary" />
            Invite Admin / Staff Member
          </DialogTitle>
          <DialogDescription>
            Grant system access to processing staff, managers, or external partner agencies.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          {inviteMutation.isError && (
            <Alert variant="destructive">
              <AlertDescription>
                {inviteMutation.error instanceof Error
                  ? inviteMutation.error.message
                  : "Failed to send invitation."}
              </AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                placeholder="Jane"
                {...register("firstName", { required: "First name is required" })}
              />
              {errors.firstName && (
                <p className="text-[11px] text-destructive">{errors.firstName.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                placeholder="Doe"
                {...register("lastName", { required: "Last name is required" })}
              />
              {errors.lastName && (
                <p className="text-[11px] text-destructive">{errors.lastName.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email">Work Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="jane@worldportal.travel"
              {...register("email", { required: "Email is required" })}
            />
            {errors.email && (
              <p className="text-[11px] text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="role">Role & Access Level</Label>
            <Select
              value={selectedRole}
              onValueChange={(val: "MANAGER" | "STAFF" | "PARTNER") => setValue("role", val)}
            >
              <SelectTrigger id="role" className="w-full">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MANAGER">Manager (Full System & Finance Access)</SelectItem>
                <SelectItem value="STAFF">Staff (Visa & Passport Verification)</SelectItem>
                <SelectItem value="PARTNER">Partner (Agency Submission Portal)</SelectItem>

              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-border/60">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={inviteMutation.isPending}>
              Send Invitation
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
