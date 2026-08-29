import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { BadGatewayException, BadRequestException } from '@nestjs/common';
import { VisaRequirementService } from './visa-requirement.service';

describe('VisaRequirementService', () => {
  let service: VisaRequirementService;
  let originalFetch: typeof globalThis.fetch;

  const mockPassportsData = {
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

  const mockDestinationsData = {
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

  const mockVisaCheckData = {
    data: { status: 'visa-free', duration: '90 days' },
  };

  const mockVisaMapData = {
    data: { visa_free: ['CA', 'MX'] },
  };

  beforeAll(() => {
    originalFetch = globalThis.fetch;
  });

  afterAll(() => {
    globalThis.fetch = originalFetch;
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VisaRequirementService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: string) => {
              if (key === 'RAPIDAPI_VISA_REQUIREMENT_HOST')
                return 'visa-requirement.p.rapidapi.com';
              if (key === 'RAPIDAPI_VISA_REQUIREMENT_KEY')
                return 'test-api-key';
              if (key === 'RAPIDAPI_VISA_REQUIREMENT_BASE_URL')
                return 'https://visa-requirement.p.rapidapi.com';
              return defaultValue;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<VisaRequirementService>(VisaRequirementService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getPassports', () => {
    it('should fetch passports from RapidAPI and cache the response', async () => {
      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockPassportsData),
      });
      globalThis.fetch = mockFetch;

      const result1 = await service.getPassports();
      expect(result1).toEqual(mockPassportsData);
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Second call should return from cache without fetch call
      const result2 = await service.getPassports();
      expect(result2).toEqual(mockPassportsData);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should throw BadGatewayException when external fetch fails', async () => {
      globalThis.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 500,
        text: jest.fn().mockResolvedValue('Internal Server Error'),
      });

      await expect(service.getPassports()).rejects.toThrow(BadGatewayException);
    });
  });

  describe('getDestinations', () => {
    it('should fetch destinations from RapidAPI and cache the response', async () => {
      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockDestinationsData),
      });
      globalThis.fetch = mockFetch;

      const result1 = await service.getDestinations();
      expect(result1).toEqual(mockDestinationsData);
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Second call should return from cache without fetch call
      const result2 = await service.getDestinations();
      expect(result2).toEqual(mockDestinationsData);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should throw BadGatewayException when external fetch fails', async () => {
      globalThis.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 500,
        text: jest.fn().mockResolvedValue('Internal Server Error'),
      });

      await expect(service.getDestinations()).rejects.toThrow(
        BadGatewayException,
      );
    });
  });

  describe('checkVisa', () => {
    it('should check visa requirement for passport and destination', async () => {
      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockVisaCheckData),
      });
      globalThis.fetch = mockFetch;

      const result = await service.checkVisa({
        passport: 'us',
        destination: 'jp',
      });

      expect(result).toEqual(mockVisaCheckData);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://visa-requirement.p.rapidapi.com/v2/visa/check',
        expect.objectContaining({
          method: 'POST',
          body: new URLSearchParams({
            passport: 'US',
            destination: 'JP',
          }).toString(),
        }),
      );
    });

    it('should throw BadRequestException if passport or destination is missing', async () => {
      await expect(
        service.checkVisa({ passport: '', destination: 'JP' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getVisaMap', () => {
    it('should fetch visa map for a passport', async () => {
      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockVisaMapData),
      });
      globalThis.fetch = mockFetch;

      const result = await service.getVisaMap({ passport: 'us' });

      expect(result).toEqual(mockVisaMapData);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://visa-requirement.p.rapidapi.com/v2/visa/map',
        expect.objectContaining({
          method: 'POST',
          body: new URLSearchParams({ passport: 'US' }).toString(),
        }),
      );
    });

    it('should throw BadRequestException if passport code is empty', async () => {
      await expect(service.getVisaMap({ passport: '' })).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
