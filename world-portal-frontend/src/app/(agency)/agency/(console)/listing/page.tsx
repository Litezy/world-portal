import { ListingFlow } from "@/features/agency/components/listing/listing-flow";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({ title: "Your listing", noIndex: true });

/**
 * Where an agency lists itself.
 *
 * The whole screen is client-side: it is one long autosaving form whose
 * document checklist is derived from the services picked two steps earlier,
 * and it owns the header because the listing's status badge changes the
 * moment the listing is submitted.
 */
export default function AgencyListingPage() {
  return <ListingFlow />;
}
