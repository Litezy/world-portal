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
      <main id="main" className="flex-1">
        {children}
      </main>
      <SiteFooter />
    </>
  );
}
