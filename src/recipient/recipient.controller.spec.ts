import { Test, TestingModule } from '@nestjs/testing';
import { RecipientController } from './recipient.controller';
import { RecipientService } from './recipient.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import {
  UpdateRecipientDto,
  PartialUpdateRecipientDto,
} from '../recipient/dto/recipient.dto';

describe('RecipientController', () => {
  let controller: RecipientController;
  let service: RecipientService;

  const mockRecipient = {
    RecipientName: 'John Doe',
    RecipientEmail: 'john.doe@example.com',
    RecipientContact: 1234567890,
    Address: '123 Test St',
    ID_proof: Buffer.from('mock-data'),
  };

  const mockRecipients = [
    mockRecipient,
    {
      RecipientName: 'Jane Doe',
      RecipientEmail: 'jane.doe@example.com',
      RecipientContact: 9876543210,
      Address: '456 Test Ave',
      ID_proof: Buffer.from('mock-data'),
    },
  ];

  const mockFile = {
    buffer: Buffer.from('mock-image-data'),
    mimetype: 'image/jpeg',
    size: 1024,
    originalname: 'test.jpg',
    fieldname: 'file',
    encoding: '7bit',
    stream: null,
    destination: '',
    filename: '',
    path: '',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RecipientController],
      providers: [
        {
          provide: RecipientService,
          useValue: {
            create: jest.fn().mockResolvedValue(mockRecipient),
            findAll: jest.fn().mockResolvedValue(mockRecipients),
            findByContact: jest.fn().mockResolvedValue(mockRecipient),
            update: jest.fn().mockResolvedValue(mockRecipient),
            partialUpdate: jest.fn().mockResolvedValue(mockRecipient),
            delete: jest
              .fn()
              .mockResolvedValue({ message: 'Recipient deleted successfully' }),
            bulkCreate: jest.fn().mockResolvedValue(mockRecipients),
            bulkUpdate: jest
              .fn()
              .mockResolvedValue({ updatedCount: 2, notFoundContacts: [] }),
            bulkDelete: jest.fn().mockResolvedValue({ deletedCount: 2 }),
            uploadIdProof: jest
              .fn()
              .mockResolvedValue('ID proof uploaded successfully'),
            getIdProof: jest.fn().mockResolvedValue({
              data: Buffer.from('mock-data'),
              contentType: 'image/jpeg',
            }),
            deleteIdProof: jest
              .fn()
              .mockResolvedValue({ message: 'ID Proof deleted successfully' }),
          },
        },
      ],
    }).compile();

    controller = module.get<RecipientController>(RecipientController);
    service = module.get<RecipientService>(RecipientService);
  });

  describe('POST /recipients', () => {
    it('should create a new recipient successfully', async () => {
      const result = await controller.create(mockRecipient);
      expect(result).toEqual(mockRecipient);
    });
  });

  describe('GET /recipients', () => {
    it('should return all recipients', async () => {
      const result = await controller.findAll();
      expect(result).toEqual(mockRecipients);
    });
  });

  describe('GET /recipients/:RecipientContact', () => {
    it('should return recipient by contact number', async () => {
      const result = await controller.findOne(1234567890);
      expect(result).toEqual(mockRecipient);
    });
  });

  describe('PUT /recipients/:RecipientContact', () => {
    it('should update a recipient successfully', async () => {
      const updateRecipientDto: UpdateRecipientDto = {
        ...mockRecipient,
        RecipientName: 'Updated Name',
      };
      const result = await controller.update(1234567890, updateRecipientDto);
      expect(result).toEqual(mockRecipient);
    });
  });

  describe('PATCH /recipients/:RecipientContact', () => {
    it('should partially update a recipient successfully', async () => {
      const partialUpdateRecipientDto: PartialUpdateRecipientDto = {
        RecipientName: 'Partially Updated',
      };
      const result = await controller.partialUpdate(
        1234567890,
        partialUpdateRecipientDto,
      );
      expect(result.status).toBe(200);
      expect(result.message).toBe('Recipient updated successfully');
    });
  });

  describe('DELETE /recipients/:RecipientContact', () => {
    it('should delete a recipient successfully', async () => {
      const result = await controller.delete(1234567890);
      expect(result).toEqual({ message: 'Recipient deleted successfully' });
    });

    it('should throw NotFoundException if recipient not found', async () => {
      jest.spyOn(service, 'delete').mockRejectedValue(new NotFoundException());
      await expect(controller.delete(1234567890)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('POST /recipients/add-many', () => {
    it('should add multiple recipients successfully', async () => {
      const result = await controller.bulkCreate({
        recipients: mockRecipients,
      });
      expect(result).toEqual(mockRecipients);
    });
  });

  describe('POST /recipients/bulk-update', () => {
    it('should bulk update recipients successfully', async () => {
      const result = await controller.bulkUpdate({
        recipients: mockRecipients,
      });
      expect(result).toEqual({
        message: 'Bulk update completed',
        updatedCount: 2,
        notFoundContacts: [],
      });
    });
  });

  describe('POST /recipients/delete-many', () => {
    it('should bulk delete recipients successfully', async () => {
      const result = await controller.bulkDelete({
        contactNumbers: [1234567890, 9876543210],
      });
      expect(result).toEqual({ deletedCount: 2 });
    });
  });

  describe('POST /recipients/:RecipientContact/ID_Proof', () => {
    it('should upload an ID proof successfully', async () => {
      const result = await controller.uploadIdProof(1234567890, mockFile);
      expect(result.message).toBe('ID proof uploaded successfully');
      expect(result.fileDetails.originalName).toBe(mockFile.originalname);
    });
  });

  describe('GET /recipients/:RecipientContact/ID_Proof', () => {
    it('should get ID proof successfully', async () => {
      const mockResponse: any = {
        set: jest.fn(),
        send: jest.fn(),
      };

      await controller.getIdProof(1234567890, mockResponse);
      expect(mockResponse.set).toHaveBeenCalledWith(
        'Content-Type',
        'image/jpeg',
      );
      expect(mockResponse.send).toHaveBeenCalledWith(Buffer.from('mock-data'));
    });
  });

  describe('POST /recipients/bulk-import', () => {
    it('should throw BadRequestException for invalid JSON format', async () => {
      const file = {
        buffer: Buffer.from('invalid-json'),
      } as Express.Multer.File;
      await expect(controller.bulkImport(file)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
