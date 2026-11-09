import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Emits .next/standalone — a self-contained server bundle the
  // Docker image runs directly, without node_modules in the runtime layer.
  // Skipped on Vercel (which sets VERCEL=1): its own Next.js builder packages
  // the server, and the standalone trace breaks that build
  // ("next-server.js.nft.json" not found).
  output: process.env.VERCEL ? undefined : "standalone",

  // `next dev` only: let a phone on the same Wi-Fi or tailnet open the dev
  // site by IP. Next 16 otherwise answers its script files with 403, so the
  // page renders but never runs (2026-11-09, http://192.168.1.5:3005).
  allowedDevOrigins: ["192.168.*.*", "10.*.*.*", "100.*.*.*"],

  images: {
    formats: ["image/avif", "image/webp"],
    // Next 16 only serves listed qualities (anything else is coerced to the
    // nearest). 75 is the default; 90 is for the hero's full-bleed plates,
    // whose smooth sky bands and blocks visibly at 75.
    qualities: [75, 90],
    // Add the CDN/CMS hosts that will serve destination imagery.
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "res.cloudinary.com" },
    ],
  },

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            // Microphone for this origin only: Vivid, the voice assistant,
            // listens once the applicant taps the orb. Camera stays off.
            key: "Permissions-Policy",
            value: "camera=(), microphone=(self), geolocation=(), interest-cohort=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
