import { NextResponse } from "next/server";
import { type Professional, type Profession } from "@/content/professionals";

const BACKEND_API_URL = process.env.BACKEND_API_URL || "http://localhost:4000/api";

const categoryToProfession: Record<string, Profession> = {
  photographer: "photographer",
  videographer: "videographer",
  chef: "chef",
  catering: "chef",
  barber: "barber",
  shopper: "shopper",
  interpreting: "interpreter",
  interpreter: "interpreter",
  security: "security",
  childcare: "childcare",
  event: "event",
  driving: "freelancer",
  freelancer: "freelancer",
};

function mapBackendProToFrontend(item: any): Professional {
  const profession = categoryToProfession[item.category] || "freelancer";
  const price = parseFloat(item.hourlyRate) || 80;

  return {
    id: item.slug || item.id,
    photo: item.avatarUrl || undefined,
    name: item.name,
    tagline: item.title || item.bio || "Vetted Professional",
    profession,
    city: item.city || "Athens",
    country: item.country || "Greece",
    languages: Array.isArray(item.languages) ? item.languages : ["English"],
    rating: parseFloat(item.rating) || 4.9,
    jobs: item.completedJobs || 24,
    years: 5,
    price: price,
    unit: "per hour",
    about: item.bio || "Vetted local professional ready for hire.",
    availability: "Daily availability on request",
    packages: [
      { name: "Standard Session", description: "Half-day service", price: price * 4 },
      { name: "Full Day Package", description: "Full day on-call service", price: price * 8 },
    ],
    included: ["Service delivery", "Direct communication", "Quality guarantee"],
    skills: Array.isArray(item.skills) && item.skills.length > 0 ? item.skills : [item.title || profession],
    cancellation: "Flexible 48-hour cancellation policy",
    verified: Boolean(item.isVerified),
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const search = searchParams.get("search");
  const city = searchParams.get("city");

  try {
    const url = new URL(`${BACKEND_API_URL}/hire/professionals`);
    url.searchParams.set("page", "1");
    url.searchParams.set("limit", "100");
    if (category && category !== "all") url.searchParams.set("category", category);
    if (search) url.searchParams.set("search", search);
    if (city && city !== "all") url.searchParams.set("city", city);

    const res = await fetch(url.toString(), { cache: "no-store" });
    if (res.ok) {
      const json = await res.json();
      const rawList = json?.data?.data || json?.data || [];
      if (Array.isArray(rawList)) {
        let mapped = rawList.map(mapBackendProToFrontend);
        if (city && city !== "all") {
          mapped = mapped.filter((item) => item.city.toLowerCase() === city.toLowerCase());
        }
        return NextResponse.json(mapped);
      }
    }
  } catch {
    // Return empty if backend call fails
  }

  return NextResponse.json([]);
}
