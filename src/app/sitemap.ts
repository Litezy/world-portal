import type { MetadataRoute } from "next";

import { siteConfig } from "@/config/site";

/** Single-page site — the in-page anchors are not separate URLs. */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: siteConfig.url,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
  ];
}
