"use client";

import * as React from "react";
import Link from "next/link";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  Copy,
  FileText,
  Search,
  ShieldCheck,
  User,
  Users,
} from "lucide-react";
import { type Resolver, type UseFormReturn, useForm, useWatch } from "react-hook-form";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toaster";
import { useApplicantSession } from "@/features/applicant/hooks/use-applicant-session";
import { useSubmitPassportEnquiry } from "@/features/passport/api/submit-passport";
import {
  passportStepValidation,
  passportVividFields,
  passportVividSteps,
} from "@/features/passport/vivid-fields";
import { DocumentField } from "@/features/visa/components/document-field";
import { registerVividForm } from "@/features/vivid/form-bridge";
import { findNationality, nationalities } from "@/lib/nationalities";
import { cn } from "@/lib/utils";
import {
  bookletTypeLabels,
  passportApplicationTypes,
  type PassportEnquiryInput,
  passportEnquirySchema,
  passportTypeLabels,
  validityLabels,
} from "@/validations/passport";

const typeHints: Record<(typeof passportApplicationTypes)[number], string> = {
  new: "I have never had a passport before",
  renewal: "My passport is expired or expiring soon",
  replacement: "My passport was lost, stolen or damaged",
};

const passportSteps = [
  { id: 0, title: "Category & Booklet", icon: ShieldCheck },
  { id: 1, title: "Personal Details", icon: User },
  { id: 2, title: "Next of Kin", icon: Users },
  { id: 3, title: "Documents & Review", icon: FileText },
];

export function PassportForm({
  defaultType,
}: {
  defaultType?: (typeof passportApplicationTypes)[number];
}) {
  const { email: accountEmail } = useApplicantSession();
  const [step, setStep] = React.useState(0);
  const [reference, setReference] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState(false);

  const form = useForm<PassportEnquiryInput>({
    resolver: zodResolver(passportEnquirySchema) as Resolver<PassportEnquiryInput>,
    mode: "onTouched",
    defaultValues: {
      applicationType: defaultType ?? "new",
      validity: "FIVE_YEARS",
      bookletType: "THIRTY_TWO_PAGES",
      surname: "",
      firstName: "",
      middleName: "",
      sex: "MALE",
      ninNumber: "",
      dateOfBirth: "",
      placeOfBirth: "",
      stateOfOrigin: "",
      homeTown: "",
      nationality: "Nigerian",
      permanentAddress: "",
      occupation: "",
      contactPhone: "",
      email: "",
      existingPassportNumber: "",
      maritalStatus: "Single",
      colourOfEyes: "",
      colourOfHair: "",
      height: "",
      maidenName: "",
      nextOfKinName: "",
      nextOfKinRelationship: "Spouse",
      nextOfKinPhone: "",
      nextOfKinAddress: "",
      passportPhotoUrl: "",
      ninDocumentUrl: "",
      birthCertificateUrl: "",
      notes: "",
      website: "",
    },
  });

  const selectedType = useWatch({ control: form.control, name: "applicationType" });
  const { mutateAsync, isPending } = useSubmitPassportEnquiry();

  // Filed under the WorldStreet account, whose email WorldStreet has already
  // verified — fill it in rather than ask for it again.
  React.useEffect(() => {
    if (accountEmail && form.getValues("email") !== accountEmail) {
      form.setValue("email", accountEmail, { shouldValidate: true });
    }
  }, [accountEmail, form]);

  async function nextStep() {
    const fieldsToValidate = passportStepValidation(step, selectedType);
    const isValid = await form.trigger(fieldsToValidate);
    if (isValid) {
      setStep((s) => Math.min(s + 1, passportSteps.length - 1));
    } else {
      toast.error("Please fill in all highlighted fields before continuing.");
    }
  }

  function prevStep() {
    setStep((s) => Math.max(s - 1, 0));
  }

  /** Submits and returns the reference, or null when it was refused. */
  async function submitApplication(values: PassportEnquiryInput): Promise<string | null> {
    try {
      const result = await mutateAsync(values);
      setReference(result.data.reference);
      return result.data.reference;
    } catch (error) {
      const fieldErrors = (error as { errors?: Record<string, string[]> }).errors;
      if (fieldErrors) {
        for (const [field, messages] of Object.entries(fieldErrors)) {
          form.setError(field as keyof PassportEnquiryInput, { message: messages[0] });
        }
        return null;
      }
      toast.error("Could not submit your application", {
        description:
          error instanceof Error ? error.message : "Please try again shortly.",
      });
      return null;
    }
  }

  async function onSubmit(values: PassportEnquiryInput) {
    await submitApplication(values);
  }

  // Vivid works this form through the bridge. The binding is registered once
  // and reads the latest render through this ref, so it is never stale.
  const vivid = React.useRef({ step, reference, submitApplication });
  React.useEffect(() => {
    vivid.current = { step, reference, submitApplication };
  });
  React.useEffect(
    () =>
      registerVividForm({
        id: "passport",
        title: "Passport application",
        fields: passportVividFields,
        stage: () => (vivid.current.reference ? "submitted" : "form"),
        steps: () => passportVividSteps,
        currentStep: () => vivid.current.step,
        getValues: () => form.getValues() as Record<string, unknown>,
        getErrors: () =>
          Object.fromEntries(
            passportVividFields.flatMap((f) => {
              const message = form.getFieldState(f.name as keyof PassportEnquiryInput).error
                ?.message;
              return message ? [[f.name, message]] : [];
            }),
          ),
        setValue: (name, value) =>
          form.setValue(name as keyof PassportEnquiryInput, value as never, {
            shouldDirty: true,
            shouldTouch: true,
          }),
        validate: (names) => form.trigger(names as (keyof PassportEnquiryInput)[]),
        validateStep: (i) =>
          form.trigger(passportStepValidation(i, form.getValues("applicationType"))),
        showStep: (i) => setStep(i),
        submit: async () => {
          if (!(await form.trigger())) {
            return { error: "Some fields are missing or invalid — call getFormState to see which." };
          }
          const ref = await vivid.current.submitApplication(form.getValues());
          return ref
            ? { reference: ref }
            : { error: "The application was not accepted. Call getFormState for the reasons." };
        },
        reference: () => vivid.current.reference,
      }),
    [form],
  );

  if (reference) {
    return (
      <Card
        variant="glass"
        radius="2xl"
        padding="none"
        className="p-8 text-center sm:p-12 max-w-2xl mx-auto"
      >
        <span className="mx-auto grid size-16 place-items-center rounded-full bg-success/15 text-success">
          <Check className="size-8" strokeWidth={2.5} />
        </span>
        <h2 className="mt-6 text-2xl sm:text-3xl font-semibold tracking-tight text-ink-900">
          Application Submitted Successfully
        </h2>
        <p className="mx-auto mt-3 max-w-md text-[14.5px] leading-relaxed text-muted-foreground">
          Your e-Passport application has been registered. An immigration consultant will
          review your submitted files and contact you shortly to confirm your biometrics appointment.
        </p>

        <div className="mt-8 flex items-center justify-between gap-4 rounded-xl border border-primary/40 bg-primary/10 px-5 py-4 max-w-md mx-auto">
          <span className="text-left">
            <span className="block text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
              Application Reference Number
            </span>
            <span className="font-mono text-lg font-bold text-ink-900">
              {reference}
            </span>
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            leftIcon={copied ? <Check /> : <Copy />}
            onClick={() => {
              void navigator.clipboard?.writeText(reference);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
          >
            {copied ? "Copied" : "Copy Reference"}
          </Button>
        </div>

        <div className="mt-9 flex flex-wrap justify-center gap-3">
          <Button asChild variant="primary" size="md">
            <Link href="/apply">
              Apply for Visa
              <ArrowRight />
            </Link>
          </Button>
          <Button asChild variant="outline" size="md">
            <Link href="/">Back to Home</Link>
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card variant="glass" radius="2xl" padding="none" className="p-6 sm:p-10 w-full">
      {/* Top Horizontal Step Bar */}
      <div className="mb-8 border-b border-border/60 pb-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {passportSteps.map((st) => {
            const active = step === st.id;
            const completed = step > st.id;

            return (
              <button
                key={st.id}
                type="button"
                onClick={() => {
                  if (completed) setStep(st.id);
                }}
                disabled={!completed && !active}
                className={cn(
                  "flex items-center gap-3 rounded-xl border p-3 text-left transition-all",
                  active
                    ? "border-primary bg-primary/15 text-primary font-semibold shadow-sm"
                    : completed
                    ? "border-border/60 bg-muted/20 text-foreground hover:bg-muted/40 cursor-pointer"
                    : "border-border/30 text-muted-foreground opacity-50 cursor-not-allowed",
                )}
              >
                <span
                  className={cn(
                    "grid size-7 place-items-center rounded-full text-xs font-bold shrink-0",
                    active
                      ? "bg-primary text-primary-foreground"
                      : completed
                      ? "bg-success/20 text-success"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  {completed ? <Check className="size-3.5" strokeWidth={3} /> : st.id + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <span className="block text-[13px] font-medium leading-tight truncate">
                    {st.title}
                  </span>
                  <span className="block text-[10.5px] text-muted-foreground mt-0.5">
                    Step {st.id + 1} of 4
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-6" noValidate>
          {/* Honeypot */}
          <input
            {...form.register("website")}
            type="text"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            className="sr-only"
          />

          {/* Step Header */}
          <div className="mb-2">
            <h2 className="text-xl font-semibold tracking-tight text-ink-900 flex items-center gap-2">
              {React.createElement(passportSteps[step].icon, { className: "size-5 text-primary" })}
              {passportSteps[step].title}
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              {step === 0 && "Select your passport category, booklet type, and validity."}
              {step === 1 && "Provide your full personal identification details and verify your email."}
              {step === 2 && "Emergency contact and next-of-kin information."}
              {step === 3 && "Upload biometric photograph and identity documents."}
            </p>
          </div>

          {/* STEP 0: Category & Booklet Options */}
          {step === 0 && (
            <div className="grid gap-6">
              <FormField
                control={form.control}
                name="applicationType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>Which passport service do you require?</FormLabel>
                    <div className="grid gap-3 sm:grid-cols-3">
                      {passportApplicationTypes.map((type) => {
                        const active = selectedType === type;
                        return (
                          <button
                            key={type}
                            type="button"
                            onClick={() => field.onChange(type)}
                            className={cn(
                              "rounded-xl border p-4 text-left transition-all duration-200",
                              active
                                ? "border-primary bg-primary/15 ring-2 ring-primary/40"
                                : "border-border/70 bg-ink-50/60 hover:border-primary/50 hover:bg-primary/5",
                            )}
                          >
                            <span className="block text-[14px] font-bold text-ink-900">
                              {passportTypeLabels[type]}
                            </span>
                            <span className="mt-1 block text-[12px] text-muted-foreground leading-relaxed">
                              {typeHints[type]}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {selectedType !== "new" && (
                <FormField
                  control={form.control}
                  name="existingPassportNumber"
                  render={({ field }) => (
                    <FormItem className="max-w-md">
                      <FormLabel required>Existing Passport Number</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g. A12345678"
                          className="font-mono uppercase"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <div className="grid gap-5 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="validity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel required>Passport Validity</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select validity" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="FIVE_YEARS">{validityLabels.FIVE_YEARS}</SelectItem>
                          <SelectItem value="TEN_YEARS">{validityLabels.TEN_YEARS}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="bookletType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel required>Booklet Type</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select booklet size" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="THIRTY_TWO_PAGES">{bookletTypeLabels.THIRTY_TWO_PAGES}</SelectItem>
                          <SelectItem value="SIXTY_FOUR_PAGES">{bookletTypeLabels.SIXTY_FOUR_PAGES}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          )}

          {/* STEP 1: Personal Details */}
          {step === 1 && (
            <div className="grid gap-5">
              <div className="grid gap-5 sm:grid-cols-3">
                <FormField
                  control={form.control}
                  name="surname"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel required>Surname (Last Name)</FormLabel>
                      <FormControl>
                        <Input placeholder="Okafor" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel required>First Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Chinedu" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="middleName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Middle Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Emeka" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-5 sm:grid-cols-3">
                <FormField
                  control={form.control}
                  name="sex"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel required>Sex / Gender</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select gender" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="MALE">Male</SelectItem>
                          <SelectItem value="FEMALE">Female</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="ninNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel required>NIN (11 Digits)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="12345678901"
                          maxLength={11}
                          className="font-mono"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="dateOfBirth"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel required>Date of Birth</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-5 sm:grid-cols-3">
                <FormField
                  control={form.control}
                  name="placeOfBirth"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel required>Place of Birth</FormLabel>
                      <FormControl>
                        <Input placeholder="City / Town of birth" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="stateOfOrigin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel required>State of Origin</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Enugu State" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="homeTown"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel required>Home Town</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Nsukka" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <PassportNationalitySelect form={form} />

                <FormField
                  control={form.control}
                  name="occupation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel required>Occupation</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Software Engineer" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="contactPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel required>Contact Phone Number</FormLabel>
                      <FormControl>
                        <Input type="tel" placeholder="+234 801 234 5678" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel required>Email Address</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="you@example.com" readOnly {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <p className="-mt-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <Check className="size-3.5 text-emerald-600" strokeWidth={3} />
                {accountEmail
                  ? "Verified by your WorldStreet account — updates about this application go here."
                  : "Loading your WorldStreet account…"}
              </p>

              <FormField
                control={form.control}
                name="permanentAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>Permanent Residential Address</FormLabel>
                    <FormControl>
                      <Textarea rows={2} placeholder="Full street address, city, state" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-5 sm:grid-cols-4">
                <FormField
                  control={form.control}
                  name="maritalStatus"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel required>Marital Status</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Single">Single</SelectItem>
                          <SelectItem value="Married">Married</SelectItem>
                          <SelectItem value="Divorced">Divorced</SelectItem>
                          <SelectItem value="Widowed">Widowed</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="colourOfEyes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Eye Colour</FormLabel>
                      <FormControl>
                        <Input placeholder="Brown" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="colourOfHair"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hair Colour</FormLabel>
                      <FormControl>
                        <Input placeholder="Black" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="height"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Height</FormLabel>
                      <FormControl>
                        <Input placeholder={`5'9"`} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          )}

          {/* STEP 2: Next of Kin */}
          {step === 2 && (
            <div className="grid gap-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="nextOfKinName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel required>Next of Kin Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Full name of emergency contact" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="nextOfKinRelationship"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel required>Relationship</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select relationship" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Spouse">Spouse</SelectItem>
                          <SelectItem value="Parent">Parent</SelectItem>
                          <SelectItem value="Sibling">Sibling</SelectItem>
                          <SelectItem value="Child">Child</SelectItem>
                          <SelectItem value="Guardian">Guardian / Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="nextOfKinPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>Next of Kin Phone Number</FormLabel>
                    <FormControl>
                      <Input type="tel" placeholder="+234 809 876 5432" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="nextOfKinAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>Next of Kin Full Address</FormLabel>
                    <FormControl>
                      <Textarea rows={2} placeholder="Residential address of next of kin" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}

          {/* STEP 3: Documents & Review */}
          {step === 3 && (
            <div className="grid gap-6">
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">Biometric Attachments:</span> Upload clear PDF or image files. Passport photograph (white background) and NIN document are strictly required. Birth certificate is optional.
              </div>

              <div className="grid gap-5">
                <FormField
                  control={form.control}
                  name="passportPhotoUrl"
                  render={({ field, fieldState }) => (
                    <DocumentField
                      vividTarget="passportPhotoUrl"
                      label="Passport Photograph (White Background)"
                      hint="Recent passport photo with plain white background."
                      required
                      value={field.value}
                      onChange={field.onChange}
                      error={fieldState.error?.message}
                    />
                  )}
                />

                <FormField
                  control={form.control}
                  name="ninDocumentUrl"
                  render={({ field, fieldState }) => (
                    <DocumentField
                      vividTarget="ninDocumentUrl"
                      label="NIN Document / Slip"
                      hint="Official National Identification Number (NIN) slip or card."
                      required
                      value={field.value}
                      onChange={field.onChange}
                      error={fieldState.error?.message}
                    />
                  )}
                />

                <FormField
                  control={form.control}
                  name="birthCertificateUrl"
                  render={({ field, fieldState }) => (
                    <DocumentField
                      vividTarget="birthCertificateUrl"
                      label="Birth Certificate / Declaration of Age (Optional)"
                      hint="Optional attachment for verification."
                      required={false}
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      error={fieldState.error?.message}
                    />
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Additional Instructions / Notes (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={3}
                        placeholder="Urgency notes, special processing requests, or extra info..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Badge variant="muted" size="sm" className="mx-auto mt-2">
                No payment required now — fee is confirmed after initial verification
              </Badge>
            </div>
          )}

          {/* Action Navigation Controls */}
          <div className="flex items-center justify-between gap-3 pt-6 border-t border-border/60">
            {step > 0 ? (
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={prevStep}
                leftIcon={<ArrowLeft />}
                data-vivid-target="form-back"
              >
                Back
              </Button>
            ) : (
              <div />
            )}

            {step < passportSteps.length - 1 ? (
              <Button
                type="button"
                variant="primary"
                size="md"
                onClick={nextStep}
                rightIcon={<ArrowRight />}
                data-vivid-target="form-continue"
              >
                Continue to {passportSteps[step + 1].title}
              </Button>
            ) : (
              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={isPending}
                loadingText="Submitting Application..."
                data-vivid-target="form-submit"
                data-vivid-guard
              >
                Submit Passport Application
              </Button>
            )}
          </div>
        </form>
      </Form>
    </Card>
  );
}

function PassportNationalitySelect({
  form,
}: {
  form: UseFormReturn<PassportEnquiryInput>;
}) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");

  const filteredNationalities = React.useMemo(() => {
    if (!query.trim()) return nationalities;
    const q = query.toLowerCase();
    return nationalities.filter(
      (n) =>
        n.name.toLowerCase().includes(q) ||
        n.country.toLowerCase().includes(q) ||
        n.code.toLowerCase().includes(q),
    );
  }, [query]);

  return (
    <FormField
      control={form.control}
      name="nationality"
      render={({ field }) => {
        const selected = findNationality(field.value);

        return (
          <FormItem className="flex flex-col">
            <FormLabel required>Nationality</FormLabel>
            <Popover
              open={open}
              onOpenChange={(next) => {
                setOpen(next);
                if (!next) setQuery("");
              }}
            >
              <PopoverTrigger asChild>
                <FormControl>
                  <button
                    type="button"
                    className={cn(
                      "flex h-11 w-full items-center justify-between gap-2 rounded-xl border border-border/70 bg-ink-50/70 px-3.5 text-left transition-[color,box-shadow,background-color] outline-none",
                      "focus-visible:border-ring/60 focus-visible:bg-white focus-visible:ring-[3px] focus-visible:ring-ring/25",
                      !field.value && "text-muted-foreground/70",
                    )}
                  >
                    <span className="flex min-w-0 items-center gap-2.5">
                      {selected ? (
                        <>
                          <span aria-hidden="true" className="text-lg leading-none">
                            {selected.flag}
                          </span>
                          <span className="truncate text-[14px] text-ink-900">
                            {selected.name}
                          </span>
                        </>
                      ) : (
                        <span className="truncate text-[14px]">
                          {field.value || "Select nationality"}
                        </span>
                      )}
                    </span>
                    <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
                  </button>
                </FormControl>
              </PopoverTrigger>

              <PopoverContent
                align="start"
                className="w-[var(--radix-popover-trigger-width)] p-0 z-[100]"
              >
                <div className="border-b border-border p-2">
                  <Input
                    autoFocus
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search nationality..."
                    leftIcon={<Search />}
                    size="sm"
                  />
                </div>

                <ul className="max-h-64 overflow-y-auto p-1" role="listbox">
                  {filteredNationalities.length === 0 ? (
                    <li className="px-3 py-6 text-center text-[13px] text-muted-foreground">
                      No nationality matches “{query}”.
                    </li>
                  ) : (
                    filteredNationalities.map((n) => (
                      <li key={n.code + n.name}>
                        <button
                          type="button"
                          role="option"
                          aria-selected={field.value === n.name}
                          onClick={() => {
                            form.setValue("nationality", n.name, {
                              shouldValidate: true,
                              shouldDirty: true,
                            });
                            setOpen(false);
                            setQuery("");
                          }}
                          className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-[14px] transition-colors hover:bg-secondary"
                        >
                          <span aria-hidden="true" className="text-base leading-none">
                            {n.flag}
                          </span>
                          <span className="flex-1 truncate text-ink-900">
                            {n.name} <span className="text-muted-foreground text-xs font-normal">({n.country})</span>
                          </span>
                          {field.value === n.name ? (
                            <Check className="size-4 text-primary" strokeWidth={3} />
                          ) : null}
                        </button>
                      </li>
                    ))
                  )}
                </ul>
              </PopoverContent>
            </Popover>
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
}
