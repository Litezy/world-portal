import { cookies } from "next/headers";

import { ADMIN_PALETTE_COOKIE, parseAdminPalette } from "@/config/admin-palette";

/** The colour choice the signed-in browser last made (E-Embassy blue by default). */
export async function getAdminPalette() {
  const store = await cookies();
  return parseAdminPalette(store.get(ADMIN_PALETTE_COOKIE)?.value);
}
