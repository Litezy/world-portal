import { redirect } from "next/navigation";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Track your application",
  description:
    "Check the status of your visa and passport applications in your Applicant Console.",
  path: "/track",
  noIndex: true,
});

export default function TrackPage() {
  redirect("/applicant/applications");
}
