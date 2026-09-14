import { documentsForCategories } from "@/features/agency/catalog";
import type {
  Agency,
  AgencyAssignment,
  AgencyCategory,
  AgencyDocument,
  AgencyDocumentKind,
  AgencyPayout,
  AgencyServiceOffering,
  AgencyStaff,
  AgencyUser,
} from "@/features/agency/types";

/**
 * Fixture store initialization — zero dummy data.
 */

function roundMoney(amount: number) {
  return Math.round(amount * 100) / 100;
}

export function platformFeeFor(gross: number, commissionRate: number) {
  return roundMoney(gross * commissionRate);
}

export const agencies: Agency[] = [];
export const agencyStaffRecords: AgencyStaff[] = [];
export const agencyAssignmentRecords: AgencyAssignment[] = [];
export const agencyPayoutRecords: AgencyPayout[] = [];
export const agencyUsers: AgencyUser[] = [];
