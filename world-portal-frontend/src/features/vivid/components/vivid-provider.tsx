"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";

import { useUser } from "@clerk/nextjs";

import { WorldStreetSignInDialog } from "@/features/applicant/components/worldstreet-sign-in-dialog";
import { embassyFunctions } from "@/features/vivid/functions";

import { SiraVividProvider } from "./sira-provider";
import VividSpotlight from "./vivid-spotlight";
import { VividVoiceControl } from "./vivid-voice-control";

/**
 * The consoles are other audiences — E-Embassy staff and agencies — and Vivid
 * is the applicant's assistant, so the orb never shows there.
 */
const HIDDEN_PREFIXES = ["/admin", "/agency"];

/**
 * Mounts Vivid's voice stack on E-Embassy. The persona and the
 * `features/vivid/functions` tools go to Sira when a session is minted
 * (`app/api/vivid/sira-session`); tool calls come back over the session's
 * WebSocket and run here, or on /api/vivid/function for server tools.
 *
 * Vivid needs a WorldStreet session. A signed-out visitor who taps the orb is
 * offered WorldStreet sign-in, which brings them back to the same page.
 */
export function VividVoiceProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "/";
  const router = useRouter();
  const { user, isSignedIn } = useUser();
  const [signInOpen, setSignInOpen] = React.useState(false);

  const hidden = HIDDEN_PREFIXES.some(
    (base) => pathname === base || pathname.startsWith(`${base}/`),
  );

  // navigateToPage dispatches vivid:navigate; the router does the rest.
  React.useEffect(() => {
    const onNavigate = (e: Event) => {
      const path = (e as CustomEvent<{ path?: string }>).detail?.path;
      if (path && path !== pathname) router.push(path);
    };
    window.addEventListener("vivid:navigate", onNavigate);
    return () => window.removeEventListener("vivid:navigate", onNavigate);
  }, [router, pathname]);

  const vividUser = user
    ? {
        id: user.id,
        firstName: user.firstName || user.username || undefined,
        lastName: user.lastName || undefined,
        email: user.primaryEmailAddress?.emailAddress || undefined,
      }
    : null;

  return (
    <SiraVividProvider
      user={vividUser}
      isSignedIn={Boolean(isSignedIn)}
      requireAuth
      pathname={pathname}
      functions={embassyFunctions}
      onAuthRequired={() => setSignInOpen(true)}
    >
      {children}
      {hidden ? null : (
        <>
          <VividVoiceControl />
          <VividSpotlight />
          <WorldStreetSignInDialog open={signInOpen} onOpenChange={setSignInOpen} />
        </>
      )}
    </SiraVividProvider>
  );
}
