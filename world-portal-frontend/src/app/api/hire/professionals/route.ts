import { NextResponse } from "next/server";
import { type Professional, type Profession } from "@/content/professionals";
import type { Agency } from "@/features/agency/types";
import { listAgencies } from "@/server/agency/store";

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
  tour_guide: "freelancer",
  freelancer: "freelancer",
};

function mapAgencyToProfessional(agency: Agency): Professional {
  const city = agency.cities?.[0] || agency.country || "Lagos";
  const country = agency.country || "Nigeria";
  const vLower = (agency.verification || "").toLowerCase();
  const lLower = (agency.listingStatus || "").toLowerCase();
  const isVerified = vLower === "verified" || lLower === "live";

  const primaryCategory = agency.categories?.[0] || "freelancer";
  const profession = categoryToProfession[primaryCategory] || "freelancer";

  const firstOffering = agency.offerings?.[0];
  const price = firstOffering?.price ? Number(firstOffering.price) : 150;
  const unit = firstOffering?.unit || "per service";

  const packages = (agency.offerings || []).map((offering) => ({
    name: offering.title,
    description: offering.description || `${offering.title} service package by ${agency.name}`,
    price: Number(offering.price) || 150,
  }));

  if (packages.length === 0) {
    packages.push({
      name: `${agency.name} Service Package`,
      description: agency.summary || "Full agency service package",
      price: 150,
    });
  }

  return {
    id: `agency-${agency.id}`,
    photo: agency.logoUrl || undefined,
    name: agency.name,
    tagline: agency.summary || `${agency.name} Agency`,
    profession,
    city,
    country,
    languages: agency.languages && agency.languages.length > 0 ? agency.languages : ["English"],
    rating: agency.rating ? Number(agency.rating) : 4.9,
    jobs: agency.completedJobs || 0,
    years: Math.max(1, new Date().getFullYear() - (agency.yearFounded || 2020)),
    price,
    unit,
    about: agency.about || agency.summary || "Verified agency listing",
    availability: "Available for booking",
    packages,
    included: ["Vetted agency team", "Quality guarantee", "Direct agency support"],
    skills: agency.categories || [profession],
    cancellation: "Flexible 48-hour cancellation policy",
    verified: isVerified,
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const search = searchParams.get("search");
  const city = searchParams.get("city");

  const results: Professional[] = [];

  try {
    const paginatedAgencies = await listAgencies({ verification: "VERIFIED", perPage: 100 });
    const agencies = paginatedAgencies?.data || (paginatedAgencies as any)?.items || [];
    for (const agency of agencies) {
      const pro = mapAgencyToProfessional(agency);
      if (pro.verified) {
        results.push(pro);
      }
    }
  } catch {
    // Continue if agency list fails
  }

  let filtered = results;
  if (category && category !== "all") {
    filtered = filtered.filter((item) => item.profession === category);
  }
  if (city && city !== "all") {
    filtered = filtered.filter((item) => item.city.toLowerCase() === city.toLowerCase());
  }
  if (search) {
    const needle = search.toLowerCase();
    filtered = filtered.filter(
      (item) =>
        item.name.toLowerCase().includes(needle) ||
        item.tagline.toLowerCase().includes(needle) ||
        item.about.toLowerCase().includes(needle) ||
        item.skills.some((s) => s.toLowerCase().includes(needle)),
    );
  }

  return NextResponse.json(filtered);
}
