import { Test, TestingModule } from '@nestjs/testing';
import { VisaRequirementController } from './visa-requirement.controller';
import { VisaRequirementService } from './visa-requirement.service';

describe('VisaRequirementController', () => {
  let controller: VisaRequirementController;
  let service: VisaRequirementService;

  const mockPassportsResponse = {
    data: [
      { iso_alpha2: 'AF', iso_alpha3: 'AFG', name: 'Afghanistan' },
      { iso_alpha2: 'US', iso_alpha3: 'USA', name: 'United States of America' },
    ],
    meta: {
      version: '2.0',
      language: 'en',
      generated_at: '2025-10-07T00:00:00+00:00',
    },
  };

  const mockDestinationsResponse = {
    data: [
      { iso_alpha2: 'JP', iso_alpha3: 'JPN', name: 'Japan' },
      { iso_alpha2: 'FR', iso_alpha3: 'FRA', name: 'France' },
    ],
    meta: {
      version: '2.0',
      language: 'en',
      generated_at: '2025-10-07T12:31:40+00:00',
    },
  };

  const mockVisaCheckResponse = {
    data: { status: 'visa-free' },
  };

  const mockVisaMapResponse = {
    data: { categories: {} },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VisaRequirementController],
      providers: [
        {
          provide: VisaRequirementService,
          useValue: {
            getPassports: jest.fn().mockResolvedValue(mockPassportsResponse),
            getDestinations: jest
              .fn()
              .mockResolvedValue(mockDestinationsResponse),
            checkVisa: jest.fn().mockResolvedValue(mockVisaCheckResponse),
            getVisaMap: jest.fn().mockResolvedValue(mockVisaMapResponse),
          },
        },
      ],
    }).compile();

    controller = module.get<VisaRequirementController>(
      VisaRequirementController,
    );
    service = module.get<VisaRequirementService>(VisaRequirementService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getPassports', () => {
    it('should return the unwrapped passports array from service', async () => {
      const spy = jest.spyOn(service, 'getPassports');
      const result = await controller.getPassports();
      expect(result).toEqual(mockPassportsResponse.data);
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('getDestinations', () => {
    it('should return the unwrapped destinations array from service', async () => {
      const spy = jest.spyOn(service, 'getDestinations');
      const result = await controller.getDestinations();
      expect(result).toEqual(mockDestinationsResponse.data);
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('checkVisa', () => {
    it('should call service.checkVisa with query dto and return unwrapped data', async () => {
      const spy = jest.spyOn(service, 'checkVisa');
      const dto = { passport: 'US', destination: 'JP' };
      const result = await controller.checkVisa(dto);
      expect(result).toEqual(mockVisaCheckResponse.data);
      expect(spy).toHaveBeenCalledWith(dto);
    });
  });

  describe('getVisaMap', () => {
    it('should call service.getVisaMap with query dto and return unwrapped data', async () => {
      const spy = jest.spyOn(service, 'getVisaMap');
      const dto = { passport: 'US' };
      const result = await controller.getVisaMap(dto);
      expect(result).toEqual(mockVisaMapResponse.data);
      expect(spy).toHaveBeenCalledWith(dto);
    });
  });
});
