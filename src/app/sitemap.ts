import type { MetadataRoute } from "next";

import { siteConfig } from "@/config/site";
import { servicePages } from "@/content/services";

/** Public pages only — /track is a private lookup and stays out. */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  const url = (path: string) => new URL(path, siteConfig.url).toString();

  return [
    { url: url("/"), lastModified, changeFrequency: "weekly", priority: 1 },
    { url: url("/start"), lastModified, changeFrequency: "monthly", priority: 0.9 },
    { url: url("/passport"), lastModified, changeFrequency: "monthly", priority: 0.9 },
    { url: url("/apply"), lastModified, changeFrequency: "monthly", priority: 0.9 },
    ...servicePages.map((s) => ({
      url: url(`/services/${s.slug}`),
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
}
