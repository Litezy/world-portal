import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { UserRole } from '@prisma/client';
import { AgencyController } from './agency.controller';
import { AgencyService } from './agency.service';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Who may call each /agency route.
 *
 * - Portal routes: the website's server, which signs agencies in itself and
 *   scopes every call to the signed-in agency, proves itself with
 *   SERVICE_AUTH_KEY. Desk staff (MANAGER, STAFF) reading from the console get
 *   in with their own token. Nobody else does: agency ids are guessable and
 *   these routes return travellers' contact details, staff and money.
 * - Desk decisions (verifying an agency, approving or rejecting a document):
 *   a desk token only. The service key is the agency portal's credential, so
 *   it must not let anyone verify an agency.
 */
const SECRET = 'test-secret-for-agency-access';
const SERVICE_KEY = 'service-key-for-agency-tests-0123456789';
const jwt = new JwtService({ secret: SECRET });

function forgedToken(payload: object) {
  const part = (v: object) =>
    Buffer.from(JSON.stringify(v)).toString('base64url');
  return `${part({ alg: 'HS256', typ: 'JWT' })}.${part(payload)}.made-up`;
}

const token = (email: string) => jwt.sign({ email, sub: `ext-${email}` });

type Method = 'get' | 'post' | 'patch';
type Route = {
  name: string;
  method: Method;
  path: string;
  body?: object;
  handler: keyof typeof agencyService;
  ok: number;
};

const agencyService = {
  createAgency: jest.fn(),
  findAllAgencies: jest.fn(),
  getAgencyById: jest.fn(),
  updateVerification: jest.fn(),
  getOverview: jest.fn(),
  updateAgencyListing: jest.fn(),
  listStaff: jest.fn(),
  addStaff: jest.fn(),
  updateStaff: jest.fn(),
  listDocuments: jest.fn(),
  uploadDocument: jest.fn(),
  updateDocumentStatus: jest.fn(),
  listAssignments: jest.fn(),
  assignStaffToAssignment: jest.fn(),
  completeAssignment: jest.fn(),
  listPayouts: jest.fn(),
};

const portalRoutes: Route[] = [
  {
    name: 'POST /agency (signup)',
    method: 'post',
    path: '/agency',
    body: { name: 'Sample Agency' },
    handler: 'createAgency',
    ok: 201,
  },
  {
    name: 'GET /agency',
    method: 'get',
    path: '/agency',
    handler: 'findAllAgencies',
    ok: 200,
  },
  {
    name: 'GET /agency/:id',
    method: 'get',
    path: '/agency/ag-1',
    handler: 'getAgencyById',
    ok: 200,
  },
  {
    name: 'GET /agency/:id/overview',
    method: 'get',
    path: '/agency/ag-1/overview',
    handler: 'getOverview',
    ok: 200,
  },
  {
    name: 'PATCH /agency/:id/listing',
    method: 'patch',
    path: '/agency/ag-1/listing',
    body: { summary: 'Updated' },
    handler: 'updateAgencyListing',
    ok: 200,
  },
  {
    name: 'GET /agency/:id/staff',
    method: 'get',
    path: '/agency/ag-1/staff',
    handler: 'listStaff',
    ok: 200,
  },
  {
    name: 'POST /agency/:id/staff',
    method: 'post',
    path: '/agency/ag-1/staff',
    body: { name: 'Sample Person' },
    handler: 'addStaff',
    ok: 201,
  },
  {
    name: 'PATCH /agency/:id/staff/:staffId',
    method: 'patch',
    path: '/agency/ag-1/staff/st-1',
    body: { name: 'Renamed Person' },
    handler: 'updateStaff',
    ok: 200,
  },
  {
    name: 'GET /agency/:id/documents',
    method: 'get',
    path: '/agency/ag-1/documents',
    handler: 'listDocuments',
    ok: 200,
  },
  {
    name: 'POST /agency/:id/documents',
    method: 'post',
    path: '/agency/ag-1/documents',
    body: { kind: 'TAX_CERTIFICATE', fileName: 'tax.pdf' },
    handler: 'uploadDocument',
    ok: 201,
  },
  {
    name: 'GET /agency/:id/assignments',
    method: 'get',
    path: '/agency/ag-1/assignments',
    handler: 'listAssignments',
    ok: 200,
  },
  {
    name: 'POST /agency/:id/assignments/:assignmentId/assign',
    method: 'post',
    path: '/agency/ag-1/assignments/as-1/assign',
    body: { assignedStaffIds: ['st-1'] },
    handler: 'assignStaffToAssignment',
    ok: 201,
  },
  {
    name: 'POST /agency/:id/assignments/:assignmentId/complete',
    method: 'post',
    path: '/agency/ag-1/assignments/as-1/complete',
    handler: 'completeAssignment',
    ok: 201,
  },
  {
    name: 'GET /agency/:id/payouts',
    method: 'get',
    path: '/agency/ag-1/payouts',
    handler: 'listPayouts',
    ok: 200,
  },
];

const deskDecisionRoutes: Route[] = [
  {
    name: 'PATCH /agency/:id/verify',
    method: 'patch',
    path: '/agency/ag-1/verify',
    body: { verification: 'VERIFIED' },
    handler: 'updateVerification',
    ok: 200,
  },
  {
    name: 'PATCH /agency/:id/documents/:docId',
    method: 'patch',
    path: '/agency/ag-1/documents/doc-1',
    body: { status: 'APPROVED' },
    handler: 'updateDocumentStatus',
    ok: 200,
  },
];

describe('/agency access', () => {
  let app: INestApplication<App>;

  const profiles: Record<
    string,
    { id: string; email: string; role: UserRole; isActive: boolean }
  > = {
    'manager@example.com': {
      id: 'p-m',
      email: 'manager@example.com',
      role: UserRole.MANAGER,
      isActive: true,
    },
    'staff@example.com': {
      id: 'p-s',
      email: 'staff@example.com',
      role: UserRole.STAFF,
      isActive: true,
    },
    'partner@example.com': {
      id: 'p-p',
      email: 'partner@example.com',
      role: UserRole.PARTNER,
      isActive: true,
    },
    'gone@example.com': {
      id: 'p-g',
      email: 'gone@example.com',
      role: UserRole.MANAGER,
      isActive: false,
    },
  };
  const prisma = {
    profile: {
      findFirst: jest.fn(
        ({ where }: { where: { OR: Array<{ email?: string }> } }) => {
          const email = where.OR.find((c) => c.email)?.email;
          return Promise.resolve((email && profiles[email]) || null);
        },
      ),
    },
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [AgencyController],
      providers: [
        { provide: AgencyService, useValue: agencyService },
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwt },
        {
          provide: ConfigService,
          useValue: {
            get: (key: string, fallback?: string) =>
              ({
                ENABLE_MOCK_AUTH: 'false',
                SERVICE_AUTH_KEY: SERVICE_KEY,
              })[key] ?? fallback,
          },
        },
      ],
    }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    for (const fn of Object.values(agencyService)) {
      fn.mockReset().mockResolvedValue({ ok: true });
    }
  });

  function call(route: Route) {
    const req = request(app.getHttpServer())[route.method](route.path);
    return route.body ? req.send(route.body) : req;
  }

  describe.each(portalRoutes)('$name (agency portal)', (route) => {
    it('refuses a caller with no credentials', async () => {
      await call(route).expect(401);
      expect(agencyService[route.handler]).not.toHaveBeenCalled();
    });

    it("lets the website's server in with the service key", async () => {
      await call(route).set('x-service-key', SERVICE_KEY).expect(route.ok);
      expect(agencyService[route.handler]).toHaveBeenCalled();
    });

    it('refuses a wrong service key', async () => {
      await call(route)
        .set('x-service-key', 'wrong-key-wrong-key-wrong-key-wrong-key')
        .expect(401);
      expect(agencyService[route.handler]).not.toHaveBeenCalled();
    });

    it('lets desk staff and managers in with their own token', async () => {
      await call(route)
        .set('Authorization', `Bearer ${token('staff@example.com')}`)
        .expect(route.ok);
      await call(route)
        .set('Authorization', `Bearer ${token('manager@example.com')}`)
        .expect(route.ok);
    });

    it('refuses a partner token', async () => {
      await call(route)
        .set('Authorization', `Bearer ${token('partner@example.com')}`)
        .expect(403);
      expect(agencyService[route.handler]).not.toHaveBeenCalled();
    });

    it('refuses a forged token', async () => {
      await call(route)
        .set(
          'Authorization',
          `Bearer ${forgedToken({ email: 'manager@example.com' })}`,
        )
        .expect(401);
      expect(agencyService[route.handler]).not.toHaveBeenCalled();
    });
  });

  describe.each(deskDecisionRoutes)('$name (desk decision)', (route) => {
    it('refuses a caller with no credentials', async () => {
      await call(route).expect(401);
      expect(agencyService[route.handler]).not.toHaveBeenCalled();
    });

    it('refuses the service key: it is not a desk credential', async () => {
      await call(route).set('x-service-key', SERVICE_KEY).expect(401);
      expect(agencyService[route.handler]).not.toHaveBeenCalled();
    });

    it("doesn't let the service key lift a partner's token", async () => {
      await call(route)
        .set('x-service-key', SERVICE_KEY)
        .set('Authorization', `Bearer ${token('partner@example.com')}`)
        .expect(403);
      expect(agencyService[route.handler]).not.toHaveBeenCalled();
    });

    it('lets desk staff and managers decide', async () => {
      await call(route)
        .set('Authorization', `Bearer ${token('staff@example.com')}`)
        .expect(route.ok);
      await call(route)
        .set('Authorization', `Bearer ${token('manager@example.com')}`)
        .expect(route.ok);
      expect(agencyService[route.handler]).toHaveBeenCalledTimes(2);
    });

    it('refuses a partner token', async () => {
      await call(route)
        .set('Authorization', `Bearer ${token('partner@example.com')}`)
        .expect(403);
      expect(agencyService[route.handler]).not.toHaveBeenCalled();
    });

    it('refuses a deactivated desk member', async () => {
      await call(route)
        .set('Authorization', `Bearer ${token('gone@example.com')}`)
        .expect(403);
      expect(agencyService[route.handler]).not.toHaveBeenCalled();
    });

    it('refuses a forged token', async () => {
      await call(route)
        .set(
          'Authorization',
          `Bearer ${forgedToken({ email: 'manager@example.com' })}`,
        )
        .expect(401);
      expect(agencyService[route.handler]).not.toHaveBeenCalled();
    });
  });
});
