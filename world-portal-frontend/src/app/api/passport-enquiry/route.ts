import { NextResponse } from "next/server";

import { z } from "zod";

import { BackendError } from "@/server/api/backend";
import { applicantBackend } from "@/server/applicant/backend";
import type { BackendPassportApplication } from "@/server/data/backend-types";
import { passportEnquirySchema } from "@/validations/passport";

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = passportEnquirySchema.safeParse(payload);

  if (!parsed.success) {
    const { fieldErrors } = z.flattenError(parsed.error);
    return NextResponse.json(
      { message: "Please check the highlighted fields.", errors: fieldErrors },
      { status: 422 },
    );
  }

  // Honeypot tripped — accept silently so the bot learns nothing.
  if (parsed.data.website) {
    return NextResponse.json({ data: { reference: "OK" } }, { status: 202 });
  }

  const data = parsed.data;

  const categoryMap = {
    new: "FRESH",
    renewal: "RENEWAL",
    replacement: "DAMAGE",
  } as const;

  const backendPayload = {
    passportCategory: categoryMap[data.applicationType] ?? "FRESH",
    surname: data.surname,
    firstName: data.firstName,
    middleName: data.middleName || undefined,
    sex: data.sex,
    ninNumber: data.ninNumber,
    dateOfBirth: data.dateOfBirth,
    placeOfBirth: data.placeOfBirth,
    existingPassportNumber: data.existingPassportNumber || undefined,
    homeTown: data.homeTown,
    stateOfOrigin: data.stateOfOrigin,
    permanentAddress: data.permanentAddress,
    occupation: data.occupation,
    contactPhone: data.contactPhone,
    email: data.email,
    maritalStatus: data.maritalStatus,
    colourOfEyes: data.colourOfEyes || undefined,
    colourOfHair: data.colourOfHair || undefined,
    height: data.height || undefined,
    maidenName: data.maidenName || undefined,
    nextOfKinName: data.nextOfKinName,
    nextOfKinPhone: data.nextOfKinPhone,
    nextOfKinRelationship: data.nextOfKinRelationship,
    nextOfKinAddress: data.nextOfKinAddress,
    validity: data.validity,
    bookletType: data.bookletType,
    birthCertificateUrl: data.birthCertificateUrl || undefined,
    ninDocumentUrl: data.ninDocumentUrl,
    passportPhotoUrl: data.passportPhotoUrl,
  };

  try {
    // Filed as the signed-in WorldStreet applicant, under their verified email.
    const record = await applicantBackend<BackendPassportApplication>(
      "/passport-application",
      {
        method: "POST",
        body: JSON.stringify(backendPayload),
      },
    );

    // The record exists, so its own id is a truthful reference if the service
    // ever omits the application number — never a made-up one.
    return NextResponse.json({
      data: { reference: record.applicationNo || record.id },
    });
  } catch (err: unknown) {
    // A definite refusal — no session, a suspended account, a rejected field —
    // must reach the form as it is.
    if (err instanceof BackendError && err.status >= 400 && err.status < 500) {
      return NextResponse.json(
        { message: err.message, errors: err.errors },
        { status: err.status },
      );
    }
    // The outcome is unknown: the service may be down, or it may have filed
    // the application and failed (or timed out) before answering. Never
    // invent a reference (the console would never see that application),
    // and never promise "nothing was submitted": a retry after a lost reply
    // files the same person twice. The service emails a confirmation when
    // it files one, so that is what to check before trying again.
    console.warn(
      "[passport-application] outcome unknown:",
      err instanceof Error ? err.message : err,
    );
    return NextResponse.json(
      {
        message:
          "We couldn't confirm your application went through. Check your email for a confirmation from E-Embassy before you try again, so it isn't filed twice. If nothing arrives within an hour, try again.",
      },
      { status: 503 },
    );
  }
}
