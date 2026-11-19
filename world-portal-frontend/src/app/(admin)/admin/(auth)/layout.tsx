import { AdminPaletteProvider, AppearanceMenu } from "@/components/admin/admin-palette";
import { getAdminPalette } from "@/server/admin-palette";

/**
 * The way in: one centred card on the page colour, after WS Predict Admin.
 * The colour choice applies here too, so the sign-in matches the desk.
 */
export default async function AuthLayout({ children }: LayoutProps<"/admin">) {
  const palette = await getAdminPalette();

  return (
    <AdminPaletteProvider initial={palette}>
      <div className="relative isolate flex min-h-dvh flex-col bg-background text-foreground">
        {/* A soft pool of the brand colour behind the card, top and bottom. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_45%_at_50%_0%,var(--primary-subtle),transparent_70%),radial-gradient(50%_35%_at_50%_100%,var(--muted),transparent_70%)] opacity-80"
        />
        <div className="flex justify-end p-4">
          <AppearanceMenu compact align="end" />
        </div>
        <main className="flex flex-1 items-center justify-center px-4 pb-16">
          {children}
        </main>
      </div>
    </AdminPaletteProvider>
  );
}
