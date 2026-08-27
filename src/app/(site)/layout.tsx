import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

export default function SiteLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      {/* The header is absolutely positioned over the hero, so this wrapper is
          the containing block and no top padding is needed. */}
      <div className="relative flex-1">
        <SiteHeader />
        <main id="main">{children}</main>
      </div>
      <SiteFooter />
    </>
  );
}
