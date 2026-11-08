import { ImageResponse } from "next/og";

import { LOGO_GRID, WING_LOWER, WING_UPPER } from "@/components/common/logo-geometry";
import { siteConfig } from "@/config/site";

// Generated at request time — no static og.png to keep in sync.
export const alt = `${siteConfig.name} — ${siteConfig.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: 80,
        // The one blue-to-cyan gradient allowed per the brand guide, mirroring
        // the logo's own transition — used exactly once, on this standalone image.
        background: "linear-gradient(135deg, #0050C0 0%, #00B8F8 100%)",
        color: "white",
        fontFamily: "sans-serif",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
        {/* The mark in its one-colour-field form, as on the app icon: a white
            upper wing and a pale cyan lower one, since the full-colour wings
            would disappear into this gradient. */}
        <svg
          width={150}
          height={(150 * LOGO_GRID.height) / LOGO_GRID.width}
          viewBox={`0 0 ${LOGO_GRID.width} ${LOGO_GRID.height}`}
        >
          <path d={WING_LOWER} fill="#7DDCFF" />
          <path d={WING_UPPER} fill="#FFFFFF" />
        </svg>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 40, fontWeight: 700, letterSpacing: 0.5 }}>
            {siteConfig.name.toUpperCase()}
          </div>
          <div style={{ fontSize: 20, color: "rgba(255,255,255,0.78)" }}>
            {`by ${siteConfig.parent.toLowerCase()}`}
          </div>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <div style={{ fontSize: 68, fontWeight: 700, lineHeight: 1.1, maxWidth: 900 }}>
          {siteConfig.tagline}
        </div>
        <div
          style={{
            fontSize: 30,
            lineHeight: 1.4,
            maxWidth: 880,
            color: "rgba(255,255,255,0.82)",
          }}
        >
          {siteConfig.description}
        </div>
      </div>
    </div>,
    size,
  );
}
