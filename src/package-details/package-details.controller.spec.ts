import { Test, TestingModule } from '@nestjs/testing';
import { PackageController } from './package-details.controller';
import { PackageDetailsService } from './package-details.service';
import { getMockRes } from '@jest-mock/express';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { mock, mockReset } from 'jest-mock-extended';
import { CreatePackageDetailsDto } from '../package-details/dto/package-details.dto';

describe('PackageController', () => {
  let controller: PackageController;
  const mockService = mock<PackageDetailsService>();

  beforeEach(async () => {
    mockReset(mockService); // Reset mock between tests

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PackageController],
      providers: [{ provide: PackageDetailsService, useValue: mockService }],
    }).compile();

    controller = module.get<PackageController>(PackageController);
  });

  describe('create', () => {
    it('should create a package successfully', async () => {
      const dto: CreatePackageDetailsDto = {
        RecipientId: '12345',
        TrackingNumber: 1001,
        Status: '',
        SenderName: '',
        Origin: '',
        Destination: '',
        Package_weight: 0,
        Price: 0,
        ID_proof: undefined,
      };
      mockService.createPackage.mockResolvedValue(dto as any);

      const result = await controller.create(dto);

      expect(mockService.createPackage).toHaveBeenCalledWith(dto);
      expect(result).toEqual(dto);
    });

    it('should throw a BadRequestException for invalid data', async () => {
      const dto = { RecipientId: '', TrackingNumber: null }; // Invalid DTO
      mockService.createPackage.mockRejectedValue(new BadRequestException());

      await expect(controller.create(dto as any)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('findAll', () => {
    it('should return all packages', async () => {
      const mockPackages = [
        { TrackingNumber: 1001, RecipientId: '123' },
        { TrackingNumber: 1002, RecipientId: '124' },
      ];
      mockService.findAll.mockResolvedValue(mockPackages as any);

      const result = await controller.findAll();

      expect(mockService.findAll).toHaveBeenCalled();
      expect(result).toEqual(mockPackages);
    });
  });

  describe('findOne', () => {
    it('should return a package by tracking number', async () => {
      const trackingNumber = 1001;
      const mockPackage = {
        TrackingNumber: trackingNumber,
        RecipientId: '123',
      };
      mockService.findByContact.mockResolvedValue(mockPackage as any);

      const result = await controller.findOne(trackingNumber);

      expect(mockService.findByContact).toHaveBeenCalledWith(trackingNumber);
      expect(result).toEqual(mockPackage);
    });

    it('should throw NotFoundException if package is not found', async () => {
      const trackingNumber = 9999;
      mockService.findByContact.mockRejectedValue(new NotFoundException());

      await expect(controller.findOne(trackingNumber)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('delete', () => {
    it('should delete a package successfully', async () => {
      const trackingNumber = 1001;
      mockService.delete.mockResolvedValue();

      const result = await controller.delete(trackingNumber);

      expect(mockService.delete).toHaveBeenCalledWith(trackingNumber);
      expect(result).toEqual({ message: 'Package deleted successfully' });
    });

    it('should throw NotFoundException if package is not found', async () => {
      const trackingNumber = 9999;
      mockService.delete.mockRejectedValue(new NotFoundException());

      await expect(controller.delete(trackingNumber)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('bulkCreate', () => {
    it('should throw BadRequestException if empty array is provided', async () => {
      const bulkDto = { packagedetails: [] };
      await expect(controller.bulkCreate(bulkDto)).rejects.toThrow();
    });
  });

  describe('uploadIdProof', () => {
    it('should upload ID proof successfully', async () => {
      const trackingNumber = 1001;
      const file = {
        buffer: Buffer.from('sample'),
        originalname: 'id_proof.jpg',
        mimetype: 'image/jpeg',
        size: 1024,
      } as Express.Multer.File;

      mockService.uploadIdProof.mockResolvedValue({
        message: 'ID proof uploaded successfully',
      } as any);

      const result = await controller.uploadIdProof(trackingNumber, file);

      expect(mockService.uploadIdProof).toHaveBeenCalledWith(
        trackingNumber,
        file,
      );
      expect(result).toEqual({
        message: 'ID proof uploaded successfully',
        fileDetails: {
          originalName: file.originalname,
          size: file.size,
          contentType: file.mimetype,
        },
      });
    });

    it('should throw BadRequestException if no file is uploaded', async () => {
      await expect(
        controller.uploadIdProof(1001, undefined as any),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getIdProof', () => {
    it('should return ID proof file', async () => {
      const trackingNumber = 1001;
      const mockIdProof = {
        data: Buffer.from('sample'),
        contentType: 'image/jpeg',
      };
      mockService.getIdProof.mockResolvedValue(mockIdProof as any);

      const { res } = getMockRes();
      await controller.getIdProof(trackingNumber, res);

      expect(mockService.getIdProof).toHaveBeenCalledWith(trackingNumber);
      expect(res.set).toHaveBeenCalledWith(
        'Content-Type',
        mockIdProof.contentType,
      );
      expect(res.send).toHaveBeenCalledWith(mockIdProof.data);
    });
  });

  describe('deleteIdProof', () => {
    it('should delete ID proof successfully', async () => {
      const trackingNumber = 1001;
      mockService.deleteIdProof.mockResolvedValue({} as any);

      const result = await controller.deleteIdProof(trackingNumber);

      expect(mockService.deleteIdProof).toHaveBeenCalledWith(trackingNumber);
      expect(result).toEqual({
        message: 'ID_Proof deleted successfully',
        Package: {},
      });
    });
  });
});
