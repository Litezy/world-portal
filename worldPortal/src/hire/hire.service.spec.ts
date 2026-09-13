import { Test, TestingModule } from '@nestjs/testing';
import { HireService } from './hire.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

describe('HireService', () => {
  let service: HireService;

  const mockPro = {
    id: 'pro-001',
    slug: 'aya-kobayashi',
    name: 'Aya Kobayashi',
    title: 'Senior Private Guide & Translator',
    category: 'interpreting',
    bio: 'Licensed bilingual tour guide and interpreter.',
    avatarUrl: 'https://example.com/avatar.jpg',
    countryCode: 'JP',
    country: 'Japan',
    city: 'Tokyo',
    hourlyRate: new Prisma.Decimal(65.0),
    currency: 'USD',
    languages: ['English', 'Japanese'],
    rating: new Prisma.Decimal(4.9),
    completedJobs: 38,
    isVerified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPrismaService = {
    professionalProfile: {
      findMany: jest.fn(),
      count: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
    },
    hireBooking: {
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HireService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<HireService>(HireService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findProfessionals', () => {
    it('should query professionals with pagination', async () => {
      mockPrismaService.professionalProfile.findMany.mockResolvedValue([mockPro]);
      mockPrismaService.professionalProfile.count.mockResolvedValue(1);

      const result = await service.findProfessionals({ page: 1, limit: 10, category: 'interpreting' });

      expect(result.data).toEqual([mockPro]);
      expect(result.meta).toEqual({
        total: 1,
        page: 1,
        limit: 10,
        pages: 1,
      });
    });
  });

  describe('getProfessionalById', () => {
    it('should return professional profile by id or slug', async () => {
      mockPrismaService.professionalProfile.findFirst.mockResolvedValue(mockPro);

      const result = await service.getProfessionalById('aya-kobayashi');
      expect(result).toEqual(mockPro);
    });

    it('should throw NotFoundException if professional does not exist', async () => {
      mockPrismaService.professionalProfile.findFirst.mockResolvedValue(null);

      await expect(service.getProfessionalById('invalid-slug')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('createBooking', () => {
    it('should create a hire booking record', async () => {
      mockPrismaService.professionalProfile.findUnique.mockResolvedValue(mockPro);
      mockPrismaService.hireBooking.create.mockResolvedValue({
        id: 'booking-001',
        reference: 'HIRE-TEST-1234',
        professionalId: 'pro-001',
        travellerName: 'John Doe',
        travellerEmail: 'john@example.com',
        destinationCity: 'Tokyo',
        startsAt: new Date(),
        endsAt: new Date(),
        totalAmount: 520.0,
        currency: 'USD',
        status: 'REQUESTED',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.createBooking({
        professionalId: 'pro-001',
        travellerName: 'John Doe',
        travellerEmail: 'john@example.com',
        destinationCity: 'Tokyo',
        startsAt: new Date().toISOString(),
        endsAt: new Date().toISOString(),
        totalAmount: 520.0,
      });

      expect(result.id).toEqual('booking-001');
      expect(mockPrismaService.hireBooking.create).toHaveBeenCalled();
    });
  });
});
