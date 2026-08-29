import { FacebookIcon, InstagramIcon } from "@/components/common/brand-icons";
import { Logo } from "@/components/common/logo";
import { locales, mainNav } from "@/config/navigation";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

const socials = [
  { label: "Facebook", href: siteConfig.social.facebook, Icon: FacebookIcon },
  { label: "Instagram", href: siteConfig.social.instagram, Icon: InstagramIcon },
];

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-medium tracking-[0.18em] text-white/40 uppercase">
      {children}
    </p>
  );
}

/**
 * Black footer. The nav list is oversized with only the first item at full
 * brightness, and an enormous ghosted DISCOVER is cropped by the bottom edge.
 */
export function SiteFooter() {
  return (
    <footer className="relative isolate overflow-hidden bg-ink-950 text-white">
      <div className="mx-auto max-w-[1420px] px-5 pt-14 sm:px-8 lg:px-12 lg:pt-16">
        <Logo />

        <div className="mt-8 grid gap-12 lg:grid-cols-[1.1fr_1fr_auto] lg:gap-8">
          <nav aria-label="Footer">
            <ul className="space-y-1">
              {mainNav.map((item, i) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    className={cn(
                      "inline-block text-[28px] leading-[1.28] font-semibold tracking-[-0.02em] transition-colors duration-300 hover:text-white lg:text-[32px]",
                      i === 0 ? "text-white" : "text-white/35",
                    )}
                  >
                    {item.title}
                  </a>
                </li>
              ))}
            </ul>

            <ul className="mt-8 flex items-center gap-2.5 lg:hidden">
              {socials.map(({ label, href, Icon }) => (
                <li key={label}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="grid size-9 place-items-center rounded-full bg-white text-ink-950 transition-transform duration-300 hover:-translate-y-0.5"
                  >
                    <Icon className="size-4" />
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="space-y-8 lg:pt-2">
            <div className="space-y-3">
              <Label>Contact us</Label>
              <div className="space-y-1 text-sm">
                <a
                  href={`tel:${siteConfig.contact.phone.replace(/\s/g, "")}`}
                  className="block text-white/85 transition-colors hover:text-white"
                >
                  {siteConfig.contact.phone}
                </a>
                <a
                  href={`mailto:${siteConfig.contact.email}`}
                  className="block text-white/85 transition-colors hover:text-white"
                >
                  {siteConfig.contact.email}
                </a>
              </div>
            </div>

            <div className="space-y-3">
              <Label>Location</Label>
              <address className="text-sm text-white/85 not-italic">
                {siteConfig.contact.address}
              </address>
              <p className="text-xs text-white/40">{siteConfig.contact.hours}</p>
            </div>
          </div>

          <ul className="hidden items-start gap-2.5 lg:flex">
            {socials.map(({ label, href, Icon }) => (
              <li key={label}>
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="grid size-9 place-items-center rounded-full bg-white text-ink-950 transition-transform duration-300 hover:-translate-y-0.5"
                >
                  <Icon className="size-4" />
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-14 flex flex-wrap items-center justify-between gap-4 text-xs text-white/45 lg:mt-20">
          <p>
            © {new Date().getFullYear()} — {siteConfig.name}
          </p>
          <div className="flex items-center gap-6">
            <a href="#" className="transition-colors hover:text-white">
              Privacy
            </a>
            <ul className="flex items-center gap-3">
              {locales.map((l) => (
                <li key={l.value}>
                  <button
                    type="button"
                    className={cn(
                      "transition-colors hover:text-white",
                      l.active && "text-white/80",
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
        className="heading-serif pointer-events-none mt-4 -mb-[0.22em] w-full text-center text-[19.9vw] leading-[0.8] font-normal tracking-[-0.02em] text-white/[0.07] select-none"
      >
        {siteConfig.wordmark}
      </p>
    </footer>
  );
}
