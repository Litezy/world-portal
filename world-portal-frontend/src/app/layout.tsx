import type { Metadata, Viewport } from "next";

import { ClerkProvider } from "@clerk/nextjs";

import { Analytics } from "@/components/common/analytics";
import { JsonLd } from "@/components/common/json-ld";
import { Providers } from "@/components/providers";
import { WORLDSTREET_SIGN_IN_URL, WORLDSTREET_SIGN_UP_URL } from "@/config/auth";
import { siteConfig } from "@/config/site";
import { fontVariables } from "@/lib/fonts";
import { organizationJsonLd } from "@/lib/seo";

import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.name} — ${siteConfig.tagline}`,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  referrer: "origin-when-cross-origin",
  openGraph: {
    type: "website",
    siteName: siteConfig.name,
    locale: siteConfig.locale,
    url: siteConfig.url,
    title: `${siteConfig.name} — ${siteConfig.tagline}`,
    description: siteConfig.description,
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteConfig.name} — ${siteConfig.tagline}`,
    description: siteConfig.description,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // WorldStreet's Clerk instance. Its session cookie is shared across
    // *.worldstreetgold.com, so a WorldStreet user arrives already signed in.
    <ClerkProvider
      signInUrl={WORLDSTREET_SIGN_IN_URL}
      signUpUrl={WORLDSTREET_SIGN_UP_URL}
      telemetry={false}
    >
      <html lang="en" suppressHydrationWarning className={fontVariables}>
        <body className="flex min-h-dvh flex-col">
          <a
            href="#main"
            className="glass-primary sr-only rounded-full px-5 py-2.5 text-sm font-medium focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[60]"
          >
            Skip to content
          </a>
          <Providers>{children}</Providers>
          <JsonLd data={organizationJsonLd()} />
          <Analytics />
        </body>
      </html>
    </ClerkProvider>
  );
}
