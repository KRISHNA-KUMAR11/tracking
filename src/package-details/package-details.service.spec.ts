import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { PackageDetailsService } from './package-details.service';
import { NotFoundException } from '@nestjs/common';

const mockPackageModel = {
  find: jest.fn(),
  findOne: jest.fn(),
  findById: jest.fn(),
  findOneAndUpdate: jest.fn(),
  findOneAndDelete: jest.fn(),
  insertMany: jest.fn(),
  save: jest.fn(),
  exec: jest.fn(),
};

const mockRecipientModel = {
  findById: jest.fn(),
};

describe('PackageDetailsService', () => {
  let service: PackageDetailsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PackageDetailsService,
        {
          provide: getModelToken('PackageDetails'),
          useValue: mockPackageModel,
        },
        {
          provide: getModelToken('Recipient'),
          useValue: mockRecipientModel,
        },
      ],
    }).compile();

    service = module.get<PackageDetailsService>(PackageDetailsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findByContact', () => {
    it('should return package details if found', async () => {
      mockPackageModel.findOne.mockResolvedValue({ TrackingNumber: 1001 });
      const result = await service.findByContact(1001);
      expect(result).toHaveProperty('TrackingNumber', 1001);
    });

    it('should throw NotFoundException if package not found', async () => {
      mockPackageModel.findOne.mockResolvedValue(null);
      await expect(service.findByContact(1001)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('delete', () => {
    it('should delete a package if found', async () => {
      mockPackageModel.findOneAndDelete.mockResolvedValue({
        TrackingNumber: 1001,
      });
      await expect(service.delete(1001)).resolves.not.toThrow();
    });

    it('should throw NotFoundException if package does not exist', async () => {
      mockPackageModel.findOneAndDelete.mockResolvedValue(null);
      await expect(service.delete(1001)).rejects.toThrow(NotFoundException);
    });
  });
});
