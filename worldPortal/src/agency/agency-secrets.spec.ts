import { AgencyService } from './agency.service';
import { HireService } from '../hire/hire.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';

/**
 * No agency or hire response may carry an agency user's password hash, so no
 * query behind one may read it: a relation to `users` is always narrowed with a
 * `select`, never fetched whole (`users: true` returns every column). Agencies
 * sign in with an emailed code, so nothing writes a password either.
 *
 * Every service method runs against a Prisma stand-in that records each call,
 * and the recorded arguments are searched.
 */
type Call = { model: string; op: string; args: unknown };

const row = {
  id: 'ag-1',
  slug: 'sample-agency',
  name: 'Sample Agency',
  about: 'A sample agency.',
  summary: 'Sample.',
  logoUrl: null,
  countryCode: 'PT',
  country: 'Portugal',
  cities: ['Lisbon'],
  categories: ['security'],
  verification: 'VERIFIED',
  listingStatus: 'LIVE',
  commissionRate: 0.15,
  offerings: [{ id: 'off-1', title: 'Day cover', price: 100, currency: 'USD' }],
  assignedStaffIds: [],
  reference: 'HIRE-1',
  status: 'REQUESTED',
  travellerEmail: 'traveller@example.com',
  netToAgency: 85,
  hourlyRate: 40,
  currency: 'USD',
  isVerified: true,
};

function recordingPrisma(calls: Call[]): PrismaService {
  const answer = (
    model: string,
    op: string,
    args?: Record<string, unknown>,
  ) => {
    switch (op) {
      case 'findMany':
        return [];
      case 'count':
        return 0;
      case 'aggregate':
        return { _sum: {} };
      case 'createMany':
      case 'updateMany':
      case 'deleteMany':
        // completeAssignment only goes on once its conditional update matched.
        return { count: model === 'agencyAssignment' ? 1 : 0 };
      case 'create':
      case 'update':
      case 'upsert':
        return { ...row, ...((args?.data ?? args?.create) as object) };
      default: {
        // createAgency checks the email is free before creating.
        const where = args?.where as Record<string, unknown> | undefined;
        if (model === 'agency' && where?.email) return null;
        // A job someone is on: only those can be completed.
        if (model === 'agencyAssignment') return { ...row, status: 'ASSIGNED' };
        return row;
      }
    }
  };
  const model = (name: string) =>
    new Proxy(
      {},
      {
        get: (_target, op: string) => (args?: Record<string, unknown>) => {
          calls.push({ model: name, op, args });
          return Promise.resolve(answer(name, op, args));
        },
      },
    );
  return new Proxy(
    {},
    { get: (_target, name: string) => model(name) },
  ) as PrismaService;
}

/** Paths in a query's arguments that would read or write a password. */
function passwordPaths(node: unknown, path: string[] = []): string[] {
  if (!node || typeof node !== 'object') return [];
  const found: string[] = [];
  for (const [key, value] of Object.entries(node as Record<string, unknown>)) {
    const here = [...path, key];
    if (key === 'passwordHash') found.push(here.join('.'));
    // `users` read without a `select` returns every column, the hash included.
    // A count (`_count.select.users`) or a nested write is fine.
    const isRead = key === 'users' && !path.includes('_count');
    const narrowed =
      value !== null &&
      typeof value === 'object' &&
      ('select' in value || 'create' in value);
    if (isRead && !narrowed) found.push(here.join('.'));
    found.push(...passwordPaths(value, here));
  }
  return found;
}

describe('agency and hire queries never touch a password', () => {
  const calls: Call[] = [];
  const prisma = recordingPrisma(calls);
  const notifications = {
    create: jest.fn().mockResolvedValue({}),
  } as unknown as NotificationService;
  const agencies = new AgencyService(prisma, notifications);
  const hire = new HireService(prisma, notifications);
  const owner = { clerkUserId: 'user_1', email: 'traveller@example.com' };

  const runs: [string, () => Promise<unknown>][] = [
    [
      'createAgency',
      () =>
        agencies.createAgency({
          name: 'Sample Agency',
          legalName: 'Sample Agency Ltd',
          countryCode: 'PT',
          country: 'Portugal',
          cities: ['Lisbon'],
          categories: ['security'],
          summary: 'Sample.',
          about: 'A sample agency.',
          email: 'owner@example.com',
          phone: '+10000000000',
          yearFounded: 2020,
          staffCount: 3,
          languages: ['English'],
        }),
    ],
    ['findAgency', () => agencies.findAgency('ag-1')],
    ['getAgencyById', () => agencies.getAgencyById('ag-1')],
    ['findAllAgencies', () => agencies.findAllAgencies({})],
    [
      'updateAgencyListing',
      () => agencies.updateAgencyListing('ag-1', { summary: 'Updated' }),
    ],
    ['getOverview', () => agencies.getOverview('ag-1')],
    ['listStaff', () => agencies.listStaff('ag-1')],
    [
      'addStaff',
      () =>
        agencies.addStaff('ag-1', {
          name: 'Sample Person',
          role: 'Guide',
          category: 'tour_guide',
          phone: '+10000000001',
          languages: ['English'],
          experienceYears: 2,
          backgroundChecked: true,
        }),
    ],
    [
      'updateStaff',
      () => agencies.updateStaff('ag-1', 'st-1', { name: 'Renamed' }),
    ],
    ['listDocuments', () => agencies.listDocuments('ag-1')],
    [
      'uploadDocument',
      () =>
        agencies.uploadDocument('ag-1', {
          kind: 'TAX_CERTIFICATE',
          fileName: 'tax.pdf',
          fileUrl: 'https://files.example.com/tax.pdf',
        } as never),
    ],
    [
      'updateDocumentStatus',
      () => agencies.updateDocumentStatus('ag-1', 'doc-1', 'APPROVED'),
    ],
    ['listAssignments', () => agencies.listAssignments('ag-1')],
    [
      'assignStaffToAssignment',
      () =>
        agencies.assignStaffToAssignment('ag-1', 'as-1', {
          assignedStaffIds: ['st-1'],
        }),
    ],
    ['completeAssignment', () => agencies.completeAssignment('ag-1', 'as-1')],
    ['listPayouts', () => agencies.listPayouts('ag-1')],
    [
      'updateVerification',
      () => agencies.updateVerification('ag-1', 'VERIFIED'),
    ],
    ['findProfessionals', () => hire.findProfessionals({})],
    ['getProfessionalById', () => hire.getProfessionalById('pro-1')],
    ['findAllProfessionalsAdmin', () => hire.findAllProfessionalsAdmin({})],
    ['toggleVerification', () => hire.toggleVerification('pro-1', true)],
    [
      'createBooking',
      () =>
        hire.createBooking(
          {
            professionalId: 'agency-ag-1',
            travellerName: 'Sample Traveller',
            travellerEmail: 'traveller@example.com',
            destinationCity: 'Lisbon',
            startsAt: '2026-12-01T09:00:00.000Z',
            endsAt: '2026-12-02T09:00:00.000Z',
            totalAmount: 100,
          },
          owner,
        ),
    ],
    ['findBookingsByClerkUser', () => hire.findBookingsByClerkUser('user_1')],
  ];

  beforeEach(() => {
    calls.length = 0;
  });

  it.each(runs)('%s', async (_name, run) => {
    await run();
    expect(calls.length).toBeGreaterThan(0);
    expect(calls.flatMap((call) => passwordPaths(call.args))).toEqual([]);
  });
});
