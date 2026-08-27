import type { Metadata } from "next";

import { siteConfig } from "@/config/site";
import { absoluteUrl } from "@/lib/utils";

type SeoInput = {
  title?: string;
  description?: string;
  path?: string;
  image?: string;
  noIndex?: boolean;
  keywords?: string[];
};

/** Per-page metadata that inherits the site defaults set in the root layout. */
export function buildMetadata({
  title,
  description = siteConfig.description,
  path = "/",
  image,
  noIndex = false,
  keywords,
}: SeoInput = {}): Metadata {
  const url = absoluteUrl(path);
  // The root layout declares `title.template = "%s | World Portal"`, so a page
  // returns its bare title and lets the template add the suffix exactly once.
  // The social cards get the fully-resolved string, since no template runs there.
  const resolvedTitle = title ? `${title} | ${siteConfig.name}` : siteConfig.name;
  // Omitted -> Next falls back to app/opengraph-image.tsx.
  const images = image
    ? [{ url: absoluteUrl(image), width: 1200, height: 630, alt: resolvedTitle }]
    : undefined;

  return {
    // Omitted entirely when a page has no title of its own, so the root
    // layout's `title.default` applies rather than being overwritten.
    ...(title ? { title } : {}),
    description,
    keywords,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      siteName: siteConfig.name,
      locale: siteConfig.locale,
      title: resolvedTitle,
      description,
      url,
      images,
    },
    twitter: {
      card: "summary_large_image",
      title: resolvedTitle,
      description,
      images,
    },
    robots: noIndex ? { index: false, follow: false } : { index: true, follow: true },
  };
}

/** JSON-LD for the agency itself — improves rich results for local search. */
export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "TravelAgency",
    name: siteConfig.name,
    description: siteConfig.description,
    url: siteConfig.url,
    email: siteConfig.contact.email,
    telephone: siteConfig.contact.phone,
    address: {
      "@type": "PostalAddress",
      streetAddress: siteConfig.contact.address,
    },
    sameAs: Object.values(siteConfig.social),
  };
}
