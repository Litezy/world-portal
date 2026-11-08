import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { IconDefs } from "@/ds/components/icon";

export default function SiteLayout({ children }: LayoutProps<"/">) {
  return (
    // data-brand puts the landing page (header and footer included) on the
    // WorldStreet design system in E-Embassy's own colours, defined in
    // src/app/e-embassy-brand.css. `contents` keeps the wrapper out of the
    // body's flex column, so the layout is exactly as it was.
    <div className="contents" data-brand="e-embassy">
      {/* The blue icon gradient, defined INSIDE the brand wrapper: an SVG
          gradient resolves its colours where it is defined, not where it is
          used, so outside this div it would paint the system's default. */}
      <IconDefs brand="e-embassy" />
      {/* The header is absolutely positioned over the hero, so this wrapper is
          the containing block and no top padding is needed. */}
      <div className="relative flex-1">
        <SiteHeader />
        <main id="main">{children}</main>
      </div>
      <SiteFooter />
    </div>
  );
}
