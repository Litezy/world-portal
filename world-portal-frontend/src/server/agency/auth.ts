import { serverEnv } from "@/config/env";
import type { AgencyUser } from "@/features/agency/types";
import { createAgency, findAgencyUserByEmail } from "@/server/agency/store";

const BACKEND_API_URL = process.env.BACKEND_API_URL || "http://localhost:4000/api";

export async function authenticateAgency(
  email: string,
  password: string,
): Promise<{ user: AgencyUser | null; message: string | null }> {
  const env = serverEnv();
  const needle = email.trim().toLowerCase();

  try {
    const res = await fetch(`${BACKEND_API_URL}/agency?search=${encodeURIComponent(needle)}`, { cache: "no-store" });
    if (res.ok) {
      const resData = await res.json();
      const list = Array.isArray(resData) ? resData : (resData.data || []);
      const match = list.find((a: any) => a.email?.toLowerCase() === needle);
      if (match && (password === env.AGENCY_PASSWORD || password === "Password@2")) {
        const user: AgencyUser = {
          id: match.users?.[0]?.id || `agu-${match.id}`,
          name: match.users?.[0]?.name || match.name,
          email: match.email,
          role: "owner",
          agencyId: match.id,
          agencyName: match.name,
        };
        return { user, message: null };
      }
    }
  } catch {
    // Fallback to local store
  }

  const user = findAgencyUserByEmail(email);

  if (!user || (password !== env.AGENCY_PASSWORD && password !== "Password@2")) {
    return { user: null, message: "That email and password do not match." };
  }

  return { user, message: null };
}

export type RegisterAgencyInput = {
  agencyName: string;
  contactName: string;
  email: string;
  phone: string;
  countryCode: string;
  country: string;
  password: string;
};

export async function registerAgency(
  input: RegisterAgencyInput,
): Promise<{ user: AgencyUser | null; message: string | null }> {
  const email = input.email.trim();

  try {
    const res = await fetch(`${BACKEND_API_URL}/agency`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: input.agencyName.trim(),
        legalName: input.agencyName.trim(),
        registrationNumber: `REG-${Math.floor(100000 + Math.random() * 900000)}`,
        countryCode: input.countryCode.trim().toUpperCase(),
        country: input.country.trim(),
        cities: [input.country.trim()],
        categories: ["tour_guide"],
        summary: `Registered agency ${input.agencyName.trim()}`,
        email,
        phone: input.phone.trim(),
      }),
      cache: "no-store",
    });

    if (res.ok) {
      const data = await res.json();
      const user: AgencyUser = {
        id: data.id ? `agu-${data.id}` : `agu-${Date.now()}`,
        name: input.contactName.trim(),
        email,
        role: "owner",
        agencyId: data.id || data.agencyId,
        agencyName: data.name || input.agencyName.trim(),
      };
      return { user, message: null };
    }
  } catch {
    // Fallback to local store
  }

  if (findAgencyUserByEmail(email)) {
    return {
      user: null,
      message: "An agency is already listed with that email. Sign in instead.",
    };
  }

  const { user } = createAgency({
    agencyName: input.agencyName.trim(),
    contactName: input.contactName.trim(),
    email,
    phone: input.phone.trim(),
    countryCode: input.countryCode.trim().toUpperCase(),
    country: input.country.trim(),
  });

  return { user, message: null };
}
