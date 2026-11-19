import { isProduction, serverEnv } from "@/config/env";
import type { AgencyUser } from "@/features/agency/types";
import { createAgencySessionToken } from "@/server/agency/session";
import { serviceKeyHeaders } from "@/server/api/service-key";

const BACKEND_API_URL = process.env.BACKEND_API_URL || "http://localhost:4000/api";

/**
 * The API's /agency routes answer only this server (and desk staff), so the
 * lookups sign-in and signup make send the service key. The OTP routes are
 * public, but they are called with the key too, plus the visitor's IP
 * (`visitor`, from `visitorIpHeaders()`), so the API rate-limits each visitor
 * rather than this server's one address.
 */
function agencyLookup(): RequestInit {
  return { headers: serviceKeyHeaders(), cache: "no-store" };
}

/**
 * How long the signed session lasts. The routes pass the same number they give
 * the cookie, so a short cookie never carries a long-lived token.
 */
export type AgencySessionOptions = { ttlSeconds?: number };

/** The fields sign-in reads from an agency the API returns. */
type AgencyRecord = {
  id?: string;
  name?: string;
  email?: string | null;
  users?: { id?: string; name?: string }[];
};

export async function sendAgencyOtp(
  email: string,
  intent?: "login" | "signup",
  visitor: Record<string, string> = {},
): Promise<{ success: boolean; status?: number; message: string }> {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) {
    return {
      success: false,
      status: 400,
      message: "Please provide a valid email address.",
    };
  }

  // Sign-in answers the same whether or not the email has an agency, and only
  // a real account is sent a code. Signup always sends one: the owner of a
  // taken email hears "already listed" only after entering it (registerAgency).
  if (intent === "login") {
    const exists = await agencyExists(normalizedEmail);
    if (exists === null) return COULD_NOT_SEND;
    if (!exists) return SIGN_IN_CODE_ANSWER;
    const sent = await deliverCode(normalizedEmail, visitor);
    return sent ? SIGN_IN_CODE_ANSWER : COULD_NOT_SEND;
  }

  return (await deliverCode(normalizedEmail, visitor))
    ? {
        success: true,
        message: `Verification code sent to ${normalizedEmail}.`,
      }
    : COULD_NOT_SEND;
}

const SIGN_IN_CODE_ANSWER = {
  success: true,
  message: "If an agency is registered with that email, a code is on its way.",
};

/** An outage, said the same way whoever asked. */
const COULD_NOT_SEND = {
  success: false,
  status: 503,
  message: "Could not send the verification code. Please try again.",
};

/**
 * Whether an agency holds `email`: `null` when the service couldn't say, so an
 * outage is reported as one rather than read as "no such agency".
 */
async function agencyExists(email: string): Promise<boolean | null> {
  try {
    const res = await fetch(
      `${BACKEND_API_URL}/agency/${encodeURIComponent(email)}`,
      agencyLookup(),
    );
    if (res.ok) {
      const json = await res.json();
      const found: AgencyRecord | null = json.data ?? json;
      return Boolean(found?.id);
    }
    if (res.status !== 404) return null;

    const searchRes = await fetch(
      `${BACKEND_API_URL}/agency?search=${encodeURIComponent(email)}&limit=100`,
      agencyLookup(),
    );
    if (!searchRes.ok) return null;
    const searchJson = await searchRes.json();
    const payload = searchJson.data ?? searchJson;
    const list: AgencyRecord[] = Array.isArray(payload)
      ? payload
      : Array.isArray(payload?.data)
        ? payload.data
        : [];
    return list.some((a) => Boolean(a.id) && a.email?.toLowerCase() === email);
  } catch {
    return null;
  }
}

/** Asks the API to email a code. True only once delivery is confirmed. */
async function deliverCode(
  normalizedEmail: string,
  visitor: Record<string, string>,
): Promise<boolean> {
  try {
    const response = await fetch(`${BACKEND_API_URL}/otp/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...serviceKeyHeaders(),
        ...visitor,
      },
      body: JSON.stringify({ email: normalizedEmail, purpose: "AGENCY_AUTH" }),
      cache: "no-store",
    });
    const json = await response.json();
    const result = json.data ?? json;
    return response.ok && result.success === true;
  } catch {
    // Delivery must succeed before the UI claims a code was sent.
    return false;
  }
}

export async function verifyAgencyOtp(
  email: string,
  otp: string,
  visitor: Record<string, string> = {},
): Promise<boolean> {
  const normalizedEmail = email.trim().toLowerCase();
  const trimmedOtp = otp.trim();

  // Retain the intentional local development shortcut pending parent auth.
  if (!isProduction && trimmedOtp === "000000") return true;

  try {
    const response = await fetch(`${BACKEND_API_URL}/otp/verify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...serviceKeyHeaders(),
        ...visitor,
      },
      body: JSON.stringify({ email: normalizedEmail, code: trimmedOtp }),
      cache: "no-store",
    });
    const json = await response.json();
    const result = json.data ?? json;
    return response.ok && result.verified === true;
  } catch {
    return false;
  }
}

export async function authenticateAgency(
  email: string,
  otp: string,
  visitor: Record<string, string> = {},
  { ttlSeconds }: AgencySessionOptions = {},
): Promise<{ user: AgencyUser | null; token: string | null; message: string | null }> {
  const needle = email.trim().toLowerCase();

  const isValidOtp = await verifyAgencyOtp(needle, otp, visitor);
  if (!isValidOtp) {
    return {
      user: null,
      token: null,
      message: "Invalid or expired verification code.",
    };
  }

  try {
    // Query NestJS backend directly by ID or email
    const res = await fetch(
      `${BACKEND_API_URL}/agency/${encodeURIComponent(needle)}`,
      agencyLookup(),
    );
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
        const { token } = createAgencySessionToken(
          user,
          serverEnv().SESSION_SECRET,
          ttlSeconds,
        );
        return { user, token, message: null };
      }
    } else {
      const searchRes = await fetch(
        `${BACKEND_API_URL}/agency?search=${encodeURIComponent(needle)}&limit=100`,
        agencyLookup(),
      );
      if (searchRes.ok) {
        const searchJson = await searchRes.json();
        const payload = searchJson.data ?? searchJson;
        const list = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.data)
            ? payload.data
            : [];
        const match = list.find((a: AgencyRecord) => a.email?.toLowerCase() === needle);
        if (match) {
          const user: AgencyUser = {
            id: match.users?.[0]?.id || `agu-${match.id}`,
            name: match.users?.[0]?.name || match.name,
            email: match.email,
            role: "owner",
            agencyId: match.id,
            agencyName: match.name,
          };
          const { token } = createAgencySessionToken(
            user,
            serverEnv().SESSION_SECRET,
            ttlSeconds,
          );
          return { user, token, message: null };
        }
      }
    }
  } catch {
    // Backend offline
  }

  return {
    user: null,
    token: null,
    message: "No registered agency matches that email address.",
  };
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
  visitor: Record<string, string> = {},
  { ttlSeconds }: AgencySessionOptions = {},
): Promise<{ user: AgencyUser | null; token: string | null; message: string | null }> {
  const email = input.email.trim();

  const isValidOtp = await verifyAgencyOtp(email, input.otp, visitor);
  if (!isValidOtp) {
    return {
      user: null,
      token: null,
      message: "Invalid or expired verification code.",
    };
  }

  try {
    const checkRes = await fetch(
      `${BACKEND_API_URL}/agency?search=${encodeURIComponent(email)}&limit=100`,
      agencyLookup(),
    );
    if (checkRes.ok) {
      const checkJson = await checkRes.json();
      const payload = checkJson.data ?? checkJson;
      const list = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.data)
          ? payload.data
          : [];
      const existing = list.find(
        (a: AgencyRecord) => a.email?.toLowerCase() === email.toLowerCase(),
      );
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
      headers: { "Content-Type": "application/json", ...serviceKeyHeaders() },
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
      const { token } = createAgencySessionToken(
        user,
        serverEnv().SESSION_SECRET,
        ttlSeconds,
      );
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
