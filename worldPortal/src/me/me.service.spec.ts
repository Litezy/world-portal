import { NotFoundException } from '@nestjs/common';
import { MeService } from './me.service';
import { VisaDocumentationService } from '../visa-documentation/visa-documentation.service';
import { PassportApplicationService } from '../passport-application/passport-application.service';
import { HireService } from '../hire/hire.service';

describe('MeService', () => {
  const visa = {
    findVisaApplicationsByClerkUser: jest.fn().mockResolvedValue([
      {
        id: 'v1',
        applicationNo: 'VISA-2026-1111',
        createdAt: new Date('2026-09-01'),
      },
    ]),
  };
  const passport = {
    findPassportApplicationsByClerkUser: jest.fn().mockResolvedValue([
      {
        id: 'p1',
        applicationNo: 'PASSPORT-2026-2222',
        createdAt: new Date('2026-09-10'),
      },
    ]),
  };
  const hire = { findBookingsByClerkUser: jest.fn().mockResolvedValue([]) };

  const service = new MeService(
    visa as unknown as VisaDocumentationService,
    passport as unknown as PassportApplicationService,
    hire as unknown as HireService,
  );

  it('lists only the caller’s applications, tagged by type, newest first', async () => {
    const apps = await service.listApplications('user_123');

    expect(visa.findVisaApplicationsByClerkUser).toHaveBeenCalledWith(
      'user_123',
    );
    expect(passport.findPassportApplicationsByClerkUser).toHaveBeenCalledWith(
      'user_123',
    );
    expect(apps.map((a) => [a.applicationNo, a.type])).toEqual([
      ['PASSPORT-2026-2222', 'PASSPORT'],
      ['VISA-2026-1111', 'VISA'],
    ]);
  });

  it('finds one application by number, case-insensitively', async () => {
    const app = await service.getApplication('user_123', ' visa-2026-1111 ');
    expect(app.id).toBe('v1');
  });

  it('404s for an application that is not on the caller’s account', async () => {
    await expect(
      service.getApplication('user_123', 'VISA-2026-9999'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
