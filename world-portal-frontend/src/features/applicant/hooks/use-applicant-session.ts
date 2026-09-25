"use client";

import { useClerk, useUser } from "@clerk/nextjs";

export type ApplicantSession = {
  /** False until Clerk has resolved the session — render nothing auth-specific yet. */
  isLoaded: boolean;
  isAuthenticated: boolean;
  /** The WorldStreet account's primary email, lower-cased. */
  email: string | null;
  displayName: string;
  monogram: string;
  imageUrl: string | null;
  /** Ends the WorldStreet session — on every WorldStreet service, not just here. */
  signOut: () => Promise<void>;
};

/**
 * The signed-in applicant, read from the shared WorldStreet (Clerk) session.
 * E-Embassy stores none of this; it is WorldStreet's identity.
 */
export function useApplicantSession(): ApplicantSession {
  const { isLoaded, isSignedIn, user } = useUser();
  const clerk = useClerk();

  const email = user?.primaryEmailAddress?.emailAddress?.toLowerCase() ?? null;
  const displayName =
    user?.fullName?.trim() ||
    user?.firstName ||
    (email ? email.split("@")[0] : "Applicant");
  const monogram =
    [user?.firstName, user?.lastName]
      .filter(Boolean)
      .map((part) => part!.charAt(0))
      .join("")
      .toUpperCase() || displayName.slice(0, 2).toUpperCase();

  return {
    isLoaded,
    isAuthenticated: Boolean(isSignedIn),
    email,
    displayName,
    monogram,
    imageUrl: user?.imageUrl ?? null,
    signOut: () => clerk.signOut({ redirectUrl: "/" }),
  };
}
