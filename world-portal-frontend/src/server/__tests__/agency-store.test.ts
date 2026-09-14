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
  listAgencies,
} from "../agency/store";

describe("Agency Store", () => {
  it("retrieves a created agency by ID", async () => {
    const created = createAgency({
      agencyName: "Test Agency One",
      contactName: "Owner One",
      email: "owner1@test.com",
      phone: "+15550111",
      countryCode: "US",
      country: "United States",
    });

    const agency = await getAgency(created.agency.id);
    expect(agency).not.toBeNull();
    expect(agency?.id).toBe(created.agency.id);
    expect(agency?.name).toBe("Test Agency One");
  });

  it("returns null for non-existent agency ID", async () => {
    const agency = await getAgency("ag-non-existent-999");
    expect(agency).toBeNull();
  });

  it("retrieves overview stats for agency", async () => {
    const created = createAgency({
      agencyName: "Test Agency Two",
      contactName: "Owner Two",
      email: "owner2@test.com",
      phone: "+15550222",
      countryCode: "US",
      country: "United States",
    });

    const overview = await getOverview(created.agency.id);
    expect(overview.openAssignments).toBeGreaterThanOrEqual(0);
    expect(overview.staffTotal).toBeGreaterThanOrEqual(0);
  });

  it("lists staff for an agency and allows adding new staff", async () => {
    const created = createAgency({
      agencyName: "Test Agency Three",
      contactName: "Owner Three",
      email: "owner3@test.com",
      phone: "+15550333",
      countryCode: "US",
      country: "United States",
    });

    const initialStaff = await listStaff(created.agency.id);
    const initialCount = initialStaff.data.length;

    const newStaff = await addStaff(created.agency.id, {
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

    const updatedStaff = await listStaff(created.agency.id);
    expect(updatedStaff.data.length).toBe(initialCount + 1);
    expect(updatedStaff.data.some((s) => s.id === newStaff.id)).toBe(true);
  });

  it("finds agency user by email", () => {
    const created = createAgency({
      agencyName: "Test Agency Four",
      contactName: "Owner Four",
      email: "owner4@test.com",
      phone: "+15550444",
      countryCode: "US",
      country: "United States",
    });

    const user = findAgencyUserByEmail("owner4@test.com");
    expect(user).not.toBeNull();
    expect(user?.agencyId).toBe(created.agency.id);
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
    const created = createAgency({
      agencyName: "Test Agency Five",
      contactName: "Owner Five",
      email: "owner5@test.com",
      phone: "+15550555",
      countryCode: "US",
      country: "United States",
    });

    const assignments = await listAssignments(created.agency.id);
    expect(assignments.data).toBeDefined();

    if (assignments.data.length > 0) {
      const targetAssignment = assignments.data[0];
      const staffList = await listStaff(created.agency.id);
      if (staffList.data.length > 0) {
        const staffMember = staffList.data[0];
        const updated = await assignStaff(created.agency.id, targetAssignment.id, [staffMember.id]);
        expect(updated).not.toBeNull();
        expect(updated?.assignment?.assignedStaffIds).toContain(staffMember.id);
      }
    }
  });

  it("lists all agencies for admin management", async () => {
    const res = await listAgencies({ perPage: 100 });
    expect(res.data).toBeDefined();
    expect(Array.isArray(res.data)).toBe(true);
  }, 15000);
});
