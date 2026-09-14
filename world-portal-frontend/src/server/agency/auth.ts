import { isProduction, serverEnv } from "@/config/env";
import type { AgencyUser } from "@/features/agency/types";
import { createAgencySessionToken } from "@/server/agency/session";

const BACKEND_API_URL = process.env.BACKEND_API_URL || "http://localhost:4000/api";

type OtpEntry = {
  code: string;
  expiresAt: number;
};

// In-memory OTP store for agency passwordless auth
const otpStore = new Map<string, OtpEntry>();

export async function sendAgencyOtp(
  email: string,
  intent?: "login" | "signup",
): Promise<{ success: boolean; status?: number; message: string }> {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) {
    return { success: false, status: 400, message: "Please provide a valid email address." };
  }

  if (intent) {
    let existingAgency: any = null;
    try {
      const res = await fetch(`${BACKEND_API_URL}/agency/${encodeURIComponent(normalizedEmail)}`, { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        existingAgency = json.data ?? json;
      } else {
        const searchRes = await fetch(`${BACKEND_API_URL}/agency?search=${encodeURIComponent(normalizedEmail)}&limit=100`, { cache: "no-store" });
        if (searchRes.ok) {
          const searchJson = await searchRes.json();
          const payload = searchJson.data ?? searchJson;
          const list = Array.isArray(payload) ? payload : (Array.isArray(payload?.data) ? payload.data : []);
          existingAgency = list.find((a: any) => a.email?.toLowerCase() === normalizedEmail);
        }
      }
    } catch {
      // Backend error during check
    }

    if (intent === "login" && (!existingAgency || !existingAgency.id)) {
      return {
        success: false,
        status: 404,
        message: "No registered agency matches that email address. Sign up instead.",
      };
    }

    if (intent === "signup" && existingAgency && existingAgency.id) {
      return {
        success: false,
        status: 409,
        message: "An agency is already listed with that email. Sign in instead.",
      };
    }
  }

  // Generate 6-digit OTP
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes TTL

  otpStore.set(normalizedEmail, { code, expiresAt });

  console.log(`[AGENCY OTP] Generated OTP for ${normalizedEmail}: ${code} (expires in 10 minutes). Dev bypass: 000000`);

  return {
    success: true,
    message: `Verification code sent to ${normalizedEmail}.`,
  };
}

export function verifyAgencyOtp(email: string, otp: string): boolean {
  const normalizedEmail = email.trim().toLowerCase();
  const trimmedOtp = otp.trim();

  // Local development / non-production bypass code
  if (!isProduction && trimmedOtp === "000000") {
    return true;
  }

  const record = otpStore.get(normalizedEmail);
  if (!record) {
    return false;
  }

  if (Date.now() > record.expiresAt) {
    otpStore.delete(normalizedEmail);
    return false;
  }

  if (record.code === trimmedOtp) {
    // OTP used successfully, delete to prevent reuse
    otpStore.delete(normalizedEmail);
    return true;
  }

  return false;
}

export async function authenticateAgency(
  email: string,
  otp: string,
): Promise<{ user: AgencyUser | null; token: string | null; message: string | null }> {
  const needle = email.trim().toLowerCase();

  const isValidOtp = verifyAgencyOtp(needle, otp);
  if (!isValidOtp) {
    return {
      user: null,
      token: null,
      message: "Invalid or expired verification code.",
    };
  }

  try {
    // Query NestJS backend directly by ID or email
    const res = await fetch(`${BACKEND_API_URL}/agency/${encodeURIComponent(needle)}`, { cache: "no-store" });
    if (res.ok) {
      const resJson = await res.json();
      const match = resJson.data ?? resJson;
      if (match && match.id) {
        const user: AgencyUser = {
          id: match.users?.[0]?.id || `agu-${match.id}`,
          name: match.users?.[0]?.name || match.name,
          email: match.email || needle,
          role: "owner",
          agencyId: match.id,
          agencyName: match.name,
        };
        const { token } = createAgencySessionToken(user, serverEnv().SESSION_SECRET);
        return { user, token, message: null };
      }
    } else {
      const searchRes = await fetch(`${BACKEND_API_URL}/agency?search=${encodeURIComponent(needle)}&limit=100`, { cache: "no-store" });
      if (searchRes.ok) {
        const searchJson = await searchRes.json();
        const payload = searchJson.data ?? searchJson;
        const list = Array.isArray(payload) ? payload : (Array.isArray(payload?.data) ? payload.data : []);
        const match = list.find((a: any) => a.email?.toLowerCase() === needle);
        if (match) {
          const user: AgencyUser = {
            id: match.users?.[0]?.id || `agu-${match.id}`,
            name: match.users?.[0]?.name || match.name,
            email: match.email,
            role: "owner",
            agencyId: match.id,
            agencyName: match.name,
          };
          const { token } = createAgencySessionToken(user, serverEnv().SESSION_SECRET);
          return { user, token, message: null };
        }
      }
    }
  } catch {
    // Backend offline
  }

  return { user: null, token: null, message: "No registered agency matches that email address." };
}

export type RegisterAgencyInput = {
  agencyName: string;
  contactName: string;
  email: string;
  phone: string;
  countryCode: string;
  country: string;
  otp: string;
};

export async function registerAgency(
  input: RegisterAgencyInput,
): Promise<{ user: AgencyUser | null; token: string | null; message: string | null }> {
  const email = input.email.trim();

  const isValidOtp = verifyAgencyOtp(email, input.otp);
  if (!isValidOtp) {
    return {
      user: null,
      token: null,
      message: "Invalid or expired verification code.",
    };
  }

  try {
    const checkRes = await fetch(`${BACKEND_API_URL}/agency?search=${encodeURIComponent(email)}&limit=100`, { cache: "no-store" });
    if (checkRes.ok) {
      const checkJson = await checkRes.json();
      const payload = checkJson.data ?? checkJson;
      const list = Array.isArray(payload) ? payload : (Array.isArray(payload?.data) ? payload.data : []);
      const existing = list.find((a: any) => a.email?.toLowerCase() === email.toLowerCase());
      if (existing) {
        return {
          user: null,
          token: null,
          message: "An agency is already listed with that email. Sign in instead.",
        };
      }
    }
  } catch {
    // Ignore check failure
  }

  try {
    const res = await fetch(`${BACKEND_API_URL}/agency`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: input.agencyName.trim(),
        legalName: input.agencyName.trim(),
        registrationNumber: "",
        countryCode: input.countryCode.trim().toUpperCase(),
        country: input.country.trim(),
        cities: [input.country.trim()],
        categories: ["tour_guide"],
        summary: `Registered agency ${input.agencyName.trim()}`,
        about: `Registered agency ${input.agencyName.trim()}`,
        email,
        phone: input.phone.trim(),
        yearFounded: new Date().getFullYear(),
        staffCount: 1,
        languages: ["English"],
      }),
      cache: "no-store",
    });

    if (res.ok) {
      const resJson = await res.json();
      const data = resJson.data ?? resJson;
      const user: AgencyUser = {
        id: data.id ? `agu-${data.id}` : `agu-${Date.now()}`,
        name: input.contactName.trim(),
        email,
        role: "owner",
        agencyId: data.id || data.agencyId,
        agencyName: data.name || input.agencyName.trim(),
      };
      const { token } = createAgencySessionToken(user, serverEnv().SESSION_SECRET);
      return { user, token, message: null };
    }
  } catch {
    // Backend registration error
  }

  return {
    user: null,
    token: null,
    message: "Could not complete agency registration with backend. Please try again.",
  };
}
