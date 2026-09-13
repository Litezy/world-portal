import { describe, expect, it, vi } from "vitest";
import {
  addStaff,
  assignStaff,
  createAgency,
  findAgencyUserByEmail,
  getAgency,
  getOverview,
  listAssignments,
  listStaff,
} from "../agency/store";

describe("Agency Store", () => {
  it("retrieves a seed agency by ID", async () => {
    const agency = await getAgency("ag-sentinel-ridge");
    expect(agency).not.toBeNull();
    expect(agency?.id).toBe("ag-sentinel-ridge");
    expect(agency?.name).toContain("Sentinel Ridge");
  });

  it("returns null for non-existent agency ID", async () => {
    const agency = await getAgency("ag-non-existent-999");
    expect(agency).toBeNull();
  });

  it("retrieves overview stats for agency", async () => {
    const overview = await getOverview("ag-sentinel-ridge");
    expect(overview.openAssignments).toBeGreaterThanOrEqual(0);
    expect(overview.staffTotal).toBeGreaterThanOrEqual(0);
  });

  it("lists staff for an agency and allows adding new staff", async () => {
    const initialStaff = await listStaff("ag-sentinel-ridge");
    const initialCount = initialStaff.data.length;

    const newStaff = await addStaff("ag-sentinel-ridge", {
      name: "Jane Test Staff",
      role: "Immigration Specialist",
      category: "tour_guide",
      phone: "+15550199",
      languages: ["English", "French"],
      experienceYears: 5,
      backgroundChecked: true,
    });

    expect(newStaff.id).toBeDefined();
    expect(newStaff.name).toBe("Jane Test Staff");
    expect(newStaff.role).toBe("Immigration Specialist");

    const updatedStaff = await listStaff("ag-sentinel-ridge");
    expect(updatedStaff.data.length).toBe(initialCount + 1);
    expect(updatedStaff.data.some((s) => s.id === newStaff.id)).toBe(true);
  });

  it("finds agency user by email", () => {
    const user = findAgencyUserByEmail("adaeze@sentinelridge.example");
    expect(user).not.toBeNull();
    expect(user?.agencyId).toBe("ag-sentinel-ridge");
    expect(user?.role).toBe("owner");
  });

  it("creates a new agency and agency user", () => {
    const result = createAgency({
      agencyName: "Global Mobility Hub",
      contactName: "Alice Director",
      email: "alice@mobilityhub.com",
      phone: "+15550100",
      countryCode: "US",
      country: "United States",
    });

    expect(result.agency.id).toBeDefined();
    expect(result.agency.name).toBe("Global Mobility Hub");
    expect(result.user.email).toBe("alice@mobilityhub.com");

    const foundUser = findAgencyUserByEmail("alice@mobilityhub.com");
    expect(foundUser).not.toBeNull();
    expect(foundUser?.agencyId).toBe(result.agency.id);
  });

  it("lists assignments and allows assigning staff", async () => {
    const assignments = await listAssignments("ag-sentinel-ridge");
    expect(assignments.data).toBeDefined();

    if (assignments.data.length > 0) {
      const targetAssignment = assignments.data[0];
      const staffList = await listStaff("ag-sentinel-ridge");
      if (staffList.data.length > 0) {
        const staffMember = staffList.data[0];
        const updated = await assignStaff("ag-sentinel-ridge", targetAssignment.id, [staffMember.id]);
        expect(updated).not.toBeNull();
        expect(updated?.assignment?.assignedStaffIds).toContain(staffMember.id);
      }
    }
  });
});
