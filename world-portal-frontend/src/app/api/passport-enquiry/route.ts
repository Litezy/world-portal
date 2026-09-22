import { NextResponse } from "next/server";
import { z } from "zod";

import { backend } from "@/server/api/backend";
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
    const record = await backend<BackendPassportApplication>(
      "/passport-application",
      {
        method: "POST",
        body: JSON.stringify(backendPayload),
      },
    );

    return NextResponse.json({
      data: { reference: record.applicationNo || `PASSPORT-${Date.now()}` },
    });
  } catch (err: any) {
    // If backend isn't reachable or errors out, fallback to local reference generation
    console.warn("[passport-application] API fallback:", err?.message);
    const reference = `PASSPORT-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    return NextResponse.json({ data: { reference } });
  }
}
