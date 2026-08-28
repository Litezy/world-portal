import type { AdminUser } from "@/types";

export const consultants: AdminUser[] = [
  {
    id: "usr_amara",
    name: "Amara Okafor",
    email: "amara@worldportal.travel",
    role: "admin",
    avatar: "/images/avatars/1.jpg",
  },
  {
    id: "usr_daniel",
    name: "Daniel Reyes",
    email: "daniel@worldportal.travel",
    role: "consultant",
    avatar: "/images/avatars/2.jpg",
  },
  {
    id: "usr_mei",
    name: "Mei Tanaka",
    email: "mei@worldportal.travel",
    role: "consultant",
    avatar: "/images/avatars/3.jpg",
  },
];

export function findConsultant(id?: string | null) {
  return consultants.find((c) => c.id === id) ?? null;
}
