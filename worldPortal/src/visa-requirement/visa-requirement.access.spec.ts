import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { VisaRequirementController } from './visa-requirement.controller';
import { VisaRequirementService } from './visa-requirement.service';

/**
 * The visa-requirement routes are public on purpose: the first screen of
 * /apply asks "where from, where to?" before anyone signs in. Every route is
 * a read-only lookup of public reference data (passport and destination
 * lists, the policy for a pair, the policy map for one passport) proxied from
 * a third-party dataset. None writes anything or exposes anyone's data, so a
 * sign-in would only break the signed-out first screen.
 */
describe('Visa requirement routes stay public', () => {
  let app: INestApplication<App>;

  const service = {
    getPassports: jest.fn().mockResolvedValue({ data: [] }),
    getDestinations: jest.fn().mockResolvedValue({ data: [] }),
    checkVisa: jest.fn().mockResolvedValue({ data: { status: 'visa-free' } }),
    getVisaMap: jest.fn().mockResolvedValue({ data: { categories: {} } }),
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [VisaRequirementController],
      providers: [{ provide: VisaRequirementService, useValue: service }],
    }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('answers the passport and destination lists signed out', async () => {
    await request(app.getHttpServer())
      .get('/visa-requirement/passports')
      .expect(200);
    await request(app.getHttpServer())
      .get('/visa-requirement/destinations')
      .expect(200);
  });

  it('answers a pair check signed out', async () => {
    await request(app.getHttpServer())
      .post('/visa-requirement/check')
      .send({ passport: 'NG', destination: 'GB' })
      .expect(200);
    expect(service.checkVisa).toHaveBeenCalledWith({
      passport: 'NG',
      destination: 'GB',
    });
  });

  it('answers the read-only passport map signed out', async () => {
    await request(app.getHttpServer())
      .post('/visa-requirement/map')
      .send({ passport: 'NG' })
      .expect(200);
    expect(service.getVisaMap).toHaveBeenCalledWith({ passport: 'NG' });
  });

  it('accepts nothing but the lookup fields', async () => {
    await request(app.getHttpServer())
      .post('/visa-requirement/map')
      .send({ passport: 'NG', role: 'MANAGER' })
      .expect(400);
  });
});
