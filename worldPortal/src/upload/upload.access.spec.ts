import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ClerkTokenVerifier } from '../auth/clerk/clerk-token.verifier';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';
import { S3StorageProvider } from './providers/s3-storage.provider';
import { CloudinaryStorageProvider } from './providers/cloudinary-storage.provider';

/**
 * POST /upload puts a file in our storage bucket and hands back a public URL.
 * Open, it was free hosting for anyone, under our name, for any content type a
 * client cared to claim. Now:
 *
 * - only a signed-in applicant (WorldStreet session), desk staff, or our
 *   website server (SERVICE_AUTH_KEY, for the agency portal) may upload;
 * - at most 10MB, and only PDF/JPEG/PNG/WEBP as judged by the bytes;
 * - the stored name is generated, never taken from the client.
 */
const SERVICE_KEY = 'service-key-for-tests-0123456789abcdef';
const jwt = new JwtService({ secret: 'test-secret-for-upload' });

/** Shaped like a WorldStreet session token (RS256), accepted by the mock. */
const part = (v: object) =>
  Buffer.from(JSON.stringify(v)).toString('base64url');
const CLERK_TOKEN = `${part({ alg: 'RS256', kid: 'ins_1', typ: 'JWT' })}.${part({ sub: 'user_1' })}.signature`;
const FORGED_CLERK_TOKEN = `${part({ alg: 'RS256', kid: 'ins_1', typ: 'JWT' })}.${part({ sub: 'user_2' })}.made-up`;

const PDF = Buffer.concat([
  Buffer.from('%PDF-1.7\n'),
  Buffer.from('1 0 obj << /Type /Catalog >> endobj\n%%EOF\n'),
]);
const PNG = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  Buffer.alloc(32, 1),
]);
const JPEG = Buffer.concat([
  Buffer.from([0xff, 0xd8, 0xff, 0xe0]),
  Buffer.alloc(32, 2),
]);
const WEBP = Buffer.concat([
  Buffer.from('RIFF'),
  Buffer.from([0x24, 0, 0, 0]),
  Buffer.from('WEBPVP8 '),
  Buffer.alloc(24, 3),
]);

describe('POST /upload access and validation', () => {
  let app: INestApplication<App>;

  const storage = {
    uploadFile: jest.fn((object: { key: string }) =>
      Promise.resolve({
        url: `https://storage.example/${object.key}`,
        key: object.key,
      }),
    ),
  };

  const profiles: Record<
    string,
    { id: string; email: string; role: UserRole; isActive: boolean }
  > = {
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
  const verifier = {
    verify: jest.fn((token: string) =>
      token === CLERK_TOKEN
        ? Promise.resolve({ clerkUserId: 'user_1' })
        : Promise.reject(new Error('invalid signature')),
    ),
  };
  const deskToken = (email: string) => jwt.sign({ email, sub: `ext-${email}` });

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [UploadController],
      providers: [
        UploadService,
        { provide: S3StorageProvider, useValue: storage },
        { provide: CloudinaryStorageProvider, useValue: storage },
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwt },
        { provide: ClerkTokenVerifier, useValue: verifier },
        {
          provide: ConfigService,
          useValue: {
            get: (key: string, fallback?: string) =>
              ({
                ENABLE_MOCK_AUTH: 'false',
                SERVICE_AUTH_KEY: SERVICE_KEY,
                STORAGE_PROVIDER: 's3',
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
    storage.uploadFile.mockClear();
  });

  const upload = () => request(app.getHttpServer()).post('/upload');
  const asApplicant = () =>
    upload().set('Authorization', `Bearer ${CLERK_TOKEN}`);

  describe('who may upload', () => {
    it('refuses an anonymous upload', async () => {
      await upload()
        .attach('file', PDF, {
          filename: 'passport.pdf',
          contentType: 'application/pdf',
        })
        .expect(401);
      expect(storage.uploadFile).not.toHaveBeenCalled();
    });

    it('accepts a signed-in applicant', async () => {
      await asApplicant()
        .attach('file', PDF, {
          filename: 'passport.pdf',
          contentType: 'application/pdf',
        })
        .expect(201);
      expect(storage.uploadFile).toHaveBeenCalledTimes(1);
    });

    it('refuses a forged WorldStreet token', async () => {
      await upload()
        .set('Authorization', `Bearer ${FORGED_CLERK_TOKEN}`)
        .attach('file', PDF, {
          filename: 'passport.pdf',
          contentType: 'application/pdf',
        })
        .expect(401);
      expect(storage.uploadFile).not.toHaveBeenCalled();
    });

    it('accepts desk staff', async () => {
      await upload()
        .set('Authorization', `Bearer ${deskToken('staff@example.com')}`)
        .attach('file', PDF, {
          filename: 'scan.pdf',
          contentType: 'application/pdf',
        })
        .expect(201);
    });

    it('refuses a partner account', async () => {
      await upload()
        .set('Authorization', `Bearer ${deskToken('partner@example.com')}`)
        .attach('file', PDF, {
          filename: 'scan.pdf',
          contentType: 'application/pdf',
        })
        .expect(403);
      expect(storage.uploadFile).not.toHaveBeenCalled();
    });

    it('refuses a forged desk token', async () => {
      const forged = `${part({ alg: 'HS256', typ: 'JWT' })}.${part({ email: 'staff@example.com' })}.made-up`;
      await upload()
        .set('Authorization', `Bearer ${forged}`)
        .attach('file', PDF, {
          filename: 'scan.pdf',
          contentType: 'application/pdf',
        })
        .expect(401);
      expect(storage.uploadFile).not.toHaveBeenCalled();
    });

    it("accepts the website server's key (agency portal uploads)", async () => {
      await upload()
        .set('x-service-key', SERVICE_KEY)
        .attach('file', PDF, {
          filename: 'licence.pdf',
          contentType: 'application/pdf',
        })
        .expect(201);
    });

    it('refuses a wrong service key', async () => {
      await upload()
        .set('x-service-key', 'wrong-key-wrong-key-wrong-key-wrong-key')
        .attach('file', PDF, {
          filename: 'licence.pdf',
          contentType: 'application/pdf',
        })
        .expect(401);
      expect(storage.uploadFile).not.toHaveBeenCalled();
    });
  });

  describe('what may be uploaded', () => {
    it.each([
      ['PDF', PDF, 'application/pdf', 'pdf'],
      ['PNG', PNG, 'image/png', 'png'],
      ['JPEG', JPEG, 'image/jpeg', 'jpg'],
      ['WEBP', WEBP, 'image/webp', 'webp'],
    ])(
      'stores a real %s under a generated name',
      async (_label, bytes, mime, ext) => {
        const res = await asApplicant()
          .attach('file', bytes, { filename: `doc.${ext}`, contentType: mime })
          .expect(201);

        const [object] = storage.uploadFile.mock.calls[0] as unknown as [
          { key: string; contentType: string; body: Buffer },
        ];
        expect(object.key).toMatch(
          new RegExp(`^documents/[0-9a-f-]{36}\\.${ext}$`),
        );
        expect(object.contentType).toBe(mime);
        expect(Buffer.compare(object.body, bytes)).toBe(0);
        expect(res.body).toMatchObject({ mimeType: mime, key: object.key });
      },
    );

    it('judges the type by content, not by the claimed MIME type', async () => {
      await asApplicant()
        .attach('file', Buffer.from('<html><script>alert(1)</script></html>'), {
          filename: 'passport.pdf',
          contentType: 'application/pdf',
        })
        .expect(400);
      await asApplicant()
        .attach('file', Buffer.from('MZ\x90\x00 not an image'), {
          filename: 'photo.png',
          contentType: 'image/png',
        })
        .expect(400);
      expect(storage.uploadFile).not.toHaveBeenCalled();
    });

    it('stores what the bytes are, whatever the client claims', async () => {
      const res = await asApplicant()
        .attach('file', PNG, {
          filename: 'photo.pdf',
          contentType: 'application/pdf',
        })
        .expect(201);
      const [object] = storage.uploadFile.mock.calls[0] as unknown as [
        { key: string; contentType: string },
      ];
      expect(object.contentType).toBe('image/png');
      expect(object.key).toMatch(/\.png$/);
      expect((res.body as { mimeType: string }).mimeType).toBe('image/png');
    });

    it('never builds the storage path from the client file name', async () => {
      await asApplicant()
        .attach('file', PDF, {
          filename: '../../../etc/passwd%2F..%2Fsecret.pdf',
          contentType: 'application/pdf',
        })
        .expect(201);
      const [object] = storage.uploadFile.mock.calls[0] as unknown as [
        { key: string },
      ];
      expect(object.key).not.toMatch(/passwd|secret|\.\./);
    });

    it('refuses a file over 10MB', async () => {
      const big = Buffer.concat([PDF, Buffer.alloc(10 * 1024 * 1024, 0x20)]);
      const res = await asApplicant().attach('file', big, {
        filename: 'big.pdf',
        contentType: 'application/pdf',
      });
      expect([400, 413]).toContain(res.status);
      expect(storage.uploadFile).not.toHaveBeenCalled();
    });

    it('refuses a request with no file', async () => {
      await asApplicant().field('note', 'nothing attached').expect(400);
      expect(storage.uploadFile).not.toHaveBeenCalled();
    });
  });
});
