"use client";

import Script from "next/script";

import { env } from "@/config/env";

/** No-ops until NEXT_PUBLIC_GA_ID is set, so dev and preview stay clean. */
export function Analytics() {
  if (!env.NEXT_PUBLIC_GA_ID) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${env.NEXT_PUBLIC_GA_ID}`}
        strategy="afterInteractive"
      />
      <Script id="ga-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${env.NEXT_PUBLIC_GA_ID}', { anonymize_ip: true });
        `}
      </Script>
    </>
  );
}
