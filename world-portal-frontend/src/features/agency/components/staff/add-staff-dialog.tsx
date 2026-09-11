"use client";

import * as React from "react";

import { UserPlus } from "lucide-react";
import { Controller, useForm } from "react-hook-form";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { agencyStaff as copy } from "@/content/agency";
import { useCreateStaff } from "@/features/agency/api/use-staff";
import { allCategories, categoryCatalog } from "@/features/agency/catalog";
import type { AgencyCategory } from "@/features/agency/types";
import { newStaffSchema } from "@/validations/agency";

type StaffFormValues = {
  name: string;
  role: string;
  category: AgencyCategory;
  phone: string;
  languages: string;
  experienceYears: number;
};

/**
 * Adding someone to the books.
 *
 * The dialog is portalled out of the card, which matters: `.glass-3d` clips its
 * children, so a popover or select rendered inside one would be cut off.
 *
 * One schema, both ends: the form is checked against `newStaffSchema` — the
 * same object the route handler parses — so a rule can never be enforced in
 * one place and not the other. Languages are typed as a line and split here,
 * which is the only shape difference between the field and the payload.
 */
export function AddStaffDialog() {
  const [open, setOpen] = React.useState(false);
  const [backgroundChecked, setBackgroundChecked] = React.useState(false);
  const create = useCreateStaff();

  const {
    control,
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<StaffFormValues>({
    defaultValues: {
      name: "",
      role: "",
      category: allCategories[0],
      phone: "",
      languages: "",
      experienceYears: 1,
    },
  });

  const close = (next: boolean) => {
    setOpen(next);
    if (!next) {
      reset();
      setBackgroundChecked(false);
      create.reset();
    }
  };

  const onSubmit = handleSubmit((values) => {
    const parsed = newStaffSchema.safeParse({
      ...values,
      languages: values.languages
        .split(",")
        .map((language) => language.trim())
        .filter(Boolean),
      backgroundChecked,
    });

    if (!parsed.success) {
      // The schema's wording is the wording — nothing is paraphrased here.
      for (const issue of parsed.error.issues) {
        const field = issue.path[0];
        if (typeof field === "string") {
          setError(field as keyof StaffFormValues, { message: issue.message });
        }
      }
      return;
    }

    create.mutate(parsed.data, { onSuccess: () => close(false) });
  });

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogTrigger asChild>
        <Button variant="primary" size="sm">
          <UserPlus className="size-4" />
          {copy.add}
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{copy.add}</DialogTitle>
          <DialogDescription>{copy.body}</DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          {create.isError ? (
            <Alert variant="destructive">
              <AlertDescription>
                {create.error instanceof Error
                  ? create.error.message
                  : "That could not be saved."}
              </AlertDescription>
            </Alert>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="staff-name">{copy.fields.name}</Label>
              <Input
                id="staff-name"
                aria-invalid={Boolean(errors.name)}
                {...register("name")}
              />
              <FieldError message={errors.name?.message} />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="staff-role">{copy.fields.role}</Label>
              <Input
                id="staff-role"
                aria-invalid={Boolean(errors.role)}
                {...register("role")}
              />
              <FieldError message={errors.role?.message} />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="staff-category">{copy.fields.category}</Label>
              <Controller
                control={control}
                name="category"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="staff-category" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {allCategories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {categoryCatalog[category].label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="staff-phone">{copy.fields.phone}</Label>
              <Input
                id="staff-phone"
                type="tel"
                aria-invalid={Boolean(errors.phone)}
                {...register("phone")}
              />
              <FieldError message={errors.phone?.message} />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="staff-languages">{copy.fields.languages}</Label>
              <Input
                id="staff-languages"
                aria-invalid={Boolean(errors.languages)}
                {...register("languages")}
              />
              <FieldError message={errors.languages?.message} />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="staff-experience">{copy.fields.experienceYears}</Label>
              <Input
                id="staff-experience"
                type="number"
                min={0}
                max={60}
                aria-invalid={Boolean(errors.experienceYears)}
                {...register("experienceYears", { valueAsNumber: true })}
              />
              <FieldError message={errors.experienceYears?.message} />
            </div>
          </div>

          <label className="flex items-center gap-3 rounded-xl border border-border/70 p-3">
            <Checkbox
              checked={backgroundChecked}
              onCheckedChange={(checked) => setBackgroundChecked(checked === true)}
            />
            <span className="text-[13.5px]">{copy.fields.backgroundChecked}</span>
          </label>

          {/* No cancel button: the dialog's own close control does that job,
              and there is no word for it in the content file to borrow. */}
          <DialogFooter>
            <Button type="submit" size="sm" isLoading={create.isPending}>
              {copy.add}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-[11.5px] text-destructive">{message}</p>;
}
