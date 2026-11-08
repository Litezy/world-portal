import { Logo } from "@/components/common/logo";
import { SiteFooterPlane } from "@/components/motion/site-footer-plane";
import { locales, mainNav } from "@/config/navigation";
import { siteConfig } from "@/config/site";
import { Icon, type IconName } from "@/ds/components/icon";
import { cn } from "@/lib/utils";

const socials: { label: string; href: string; icon: IconName }[] = [
  { label: "Facebook", href: siteConfig.social.facebook, icon: "facebook" },
  { label: "Instagram", href: siteConfig.social.instagram, icon: "instagram" },
];

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-semibold tracking-[0.16em] text-text-3 uppercase">
      {children}
    </p>
  );
}

/**
 * The band that closes every public page.
 *
 * It follows the page theme: a pale sky-blue band with ink type in light (the
 * default), the elevated surface with white type in dark. Its rounded top lets
 * the page show round it either way. `data-brand` is re-stated so it is
 * branded under the `(app)` layout too, which has no `data-brand` wrapper of
 * its own.
 *
 * Its glyphs use the `current` duotone tone (blue in light, white in dark)
 * rather than the brand gradient: the gradient is defined by the landing
 * layout, and this footer also closes the `(app)` pages, where it is not.
 *
 * The signature is the oversized ghost EXPLORE, cropped by the bottom edge:
 * `leading-[0.8]` puts the Playfair cap baseline on the line-box floor, and the
 * negative margin then cuts the letters off at the footer's edge.
 *
 * It is also the page's bookend: `SiteFooterPlane` brings a small plane (the
 * logo's wings) in over the last stretch of scroll and lands it on the top
 * bar of the wordmark's final E — the hero's paper plane, home again. Its
 * anchor is in `em`, so it stays on the letter at every width.
 */
export function SiteFooter() {
  return (
    <footer
      data-brand="e-embassy"
      className="relative isolate overflow-hidden rounded-t-[28px] bg-brand-50 text-foreground shadow-[inset_0_1px_0_0_rgb(0_80_192/0.1)] lg:rounded-t-[40px] dark:bg-elevated dark:shadow-[inset_0_1px_0_0_rgb(255_255_255/0.08)]"
    >
      <div className="mx-auto max-w-[1420px] px-5 pt-14 sm:px-8 lg:px-12 lg:pt-20">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-sm">
            <Logo tone="dark" markClassName="h-11 sm:h-12" />
            <p className="mt-5 text-[15px] leading-relaxed text-muted-foreground">
              {siteConfig.tagline}
            </p>
          </div>

          <ul className="flex items-center gap-2">
            {socials.map(({ label, href, icon }) => (
              <li key={label}>
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className={cn("cx-btn cx-btn--ghost cx-btn--icon")}
                >
                  <Icon name={icon} tone="current" size={20} />
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-12 grid gap-12 border-t border-hairline pt-12 lg:mt-16 lg:grid-cols-12 lg:gap-8 lg:pt-14">
          <nav aria-label="Footer" className="lg:col-span-6">
            <ul className="grid grid-flow-col grid-cols-2 grid-rows-4 gap-x-6 sm:gap-x-12">
              {mainNav.map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    className="inline-block py-1 text-[24px] leading-[1.2] font-semibold tracking-[-0.025em] text-foreground/55 transition-[color,translate] duration-300 ease-cx hover:translate-x-1 hover:text-foreground sm:text-[30px] lg:text-[34px]"
                  >
                    {item.title}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="space-y-4 lg:col-span-3 lg:pt-2">
            <Label>Contact us</Label>
            <ul className="space-y-3">
              {[
                {
                  icon: "phone" as const,
                  label: siteConfig.contact.phone,
                  href: `tel:${siteConfig.contact.phone.replace(/\s/g, "")}`,
                },
                {
                  icon: "mail" as const,
                  label: siteConfig.contact.email,
                  href: `mailto:${siteConfig.contact.email}`,
                },
              ].map(({ icon, label, href }) => (
                <li key={href}>
                  <a
                    href={href}
                    className="group inline-flex items-center gap-3 text-[15px] text-foreground/85 transition-colors hover:text-foreground"
                  >
                    <span className="cx-itile cx-itile--glass cx-itile--sm transition-colors duration-300 group-hover:bg-foreground/10">
                      <Icon
                        name={icon}
                        tone="current"
                        className="text-brand-600 dark:text-white"
                      />
                    </span>
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-4 lg:col-span-3 lg:pt-2">
            <Label>Location</Label>
            <div className="flex items-start gap-3">
              <span className="cx-itile cx-itile--glass cx-itile--sm">
                <Icon
                  name="map-pin"
                  tone="current"
                  className="text-brand-600 dark:text-white"
                />
              </span>
              <div className="pt-2">
                <address className="text-[15px] leading-relaxed text-foreground/85 not-italic">
                  {siteConfig.contact.address}
                </address>
                <p className="mt-1 text-[13px] text-text-3">
                  {siteConfig.contact.hours}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-14 flex flex-col-reverse gap-4 border-t border-hairline py-6 text-[13px] text-text-3 sm:flex-row sm:items-center sm:justify-between lg:mt-20">
          <p>
            © {new Date().getFullYear()} — {siteConfig.name}
          </p>
          <div className="flex items-center gap-5">
            <a
              href="#"
              className="inline-flex h-10 items-center transition-colors hover:text-foreground"
            >
              Privacy
            </a>
            <ul className="flex items-center gap-1 rounded-pill bg-surface-2 p-1">
              {locales.map((l) => (
                <li key={l.value}>
                  <button
                    type="button"
                    className={cn(
                      "h-9 cursor-pointer rounded-pill px-3.5 text-[12.5px] font-medium transition-colors duration-300 hover:text-foreground sm:h-8",
                      l.active ? "bg-surface-3 text-foreground" : "text-text-3",
                    )}
                  >
                    {l.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Oversized ghost wordmark, cropped by the bottom edge. */}
      <p
        aria-hidden="true"
        className="heading-serif pointer-events-none relative mt-6 -mb-[0.22em] w-full bg-linear-to-b from-brand-600/[0.13] to-brand-600/[0.01] bg-clip-text text-center text-[19.9vw] leading-[0.8] font-normal tracking-[-0.02em] text-transparent select-none dark:from-white/[0.17] dark:to-white/[0.01]"
      >
        {siteConfig.wordmark}
        {/* The landing spot: the cap line (0.15em under the line box's top)
            over the final E's top bar. */}
        <SiteFooterPlane className="right-[6.5%] bottom-[calc(100%-0.15em)]" />
      </p>
    </footer>
  );
}
