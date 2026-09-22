"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type ApplicantSession = {
  email: string | null;
  profileId: string | null;
  token: string | null;
  isAuthenticated: boolean;
};

type ApplicantAuthState = ApplicantSession & {
  login: (email: string, token?: string, profileId?: string) => void;
  logout: () => void;
};

const memoryStorage: Storage = {
  length: 0,
  clear: () => {},
  getItem: () => null,
  key: () => null,
  removeItem: () => {},
  setItem: () => {},
};

function safeStorage(): Storage {
  if (typeof window === "undefined") return memoryStorage;
  try {
    const probe = "__e-embassy.applicant_probe__";
    window.localStorage.setItem(probe, probe);
    window.localStorage.removeItem(probe);
    return window.localStorage;
  } catch {
    return memoryStorage;
  }
}

export const useApplicantAuthStore = create<ApplicantAuthState>()(
  persist(
    (set) => ({
      email: null,
      profileId: null,
      token: null,
      isAuthenticated: false,
      login: (email: string, token?: string, profileId?: string) => {
        const raw = email.toLowerCase().trim();
        const cleanedEmail = raw ? (raw.includes("@") ? raw : `${raw}@example.com`) : "applicant@example.com";
        set({
          email: cleanedEmail,
          token: token || `token_${Date.now()}`,
          profileId: profileId || null,
          isAuthenticated: true,
        });
      },
      logout: () => {
        set({
          email: null,
          profileId: null,
          token: null,
          isAuthenticated: false,
        });
      },
    }),
    {
      name: "e-embassy.applicant_session",
      version: 1,
      storage: createJSONStorage(safeStorage),
      partialize: (s) => ({
        email: s.email,
        profileId: s.profileId,
        token: s.token,
        isAuthenticated: s.isAuthenticated,
      }),
    }
  )
);
