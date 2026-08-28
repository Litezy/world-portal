import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

/**
 * Layout for pages with no hero. The header is a solid sticky bar rather than
 * an overlay, so its white type stays legible against a light page.
 */
export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <SiteHeader variant="solid" />
      {/* The bar is fixed, so pages have to clear it themselves. */}
      <main id="main" className="flex-1 pt-[72px] lg:pt-20">
        {children}
      </main>
      <SiteFooter />
    </>
  );
}
