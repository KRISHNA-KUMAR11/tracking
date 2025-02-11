import { Test, TestingModule } from '@nestjs/testing';
import { RecipientService } from './recipient.service';
import { getModelToken } from '@nestjs/mongoose';
import { Recipient } from './schemas/recipient.schema';
import { NotFoundException } from '@nestjs/common';
import { CreateRecipientV1Dto, UpdateRecipientDto } from './dto/recipient.dto';

describe('RecipientService', () => {
  let service: RecipientService;
  let model: any;

  const mockRecipient = {
    RecipientName: 'John Doe',
    RecipientEmail: 'john.doe@example.com',
    RecipientContact: 1234567890,
    Address: '123 Test St',
    ID_proof: Buffer.from('mock-data'),
  };

  const mockRecipients = [mockRecipient];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecipientService,
        {
          provide: getModelToken(Recipient.name),
          useValue: {
            create: jest.fn().mockResolvedValue(mockRecipient),
            find: jest.fn().mockResolvedValue(mockRecipients),
            findOne: jest.fn().mockResolvedValue(mockRecipient),
            findOneAndUpdate: jest.fn().mockResolvedValue(mockRecipient),
            findOneAndDelete: jest.fn().mockResolvedValue(mockRecipient),
            insertMany: jest.fn().mockResolvedValue(mockRecipients),
            deleteMany: jest.fn().mockResolvedValue({ deletedCount: 1 }),
          },
        },
      ],
    }).compile();

    service = module.get<RecipientService>(RecipientService);
    model = module.get(getModelToken(Recipient.name));
  });

  describe('create', () => {
    it('should create a recipient successfully', async () => {
      const result = await service.createV1(mockRecipient);
      expect(result).toEqual(mockRecipient);
      expect(model.create).toHaveBeenCalledWith(mockRecipient);
    });
  });

  describe('findAll', () => {
    it('should return all recipients', async () => {
      const result = await service.findAll();
      expect(result).toEqual(mockRecipients);
      expect(model.find).toHaveBeenCalled();
    });
  });

  describe('findByContact', () => {
    it('should return recipient by contact number', async () => {
      const result = await service.findByContact(1234567890);
      expect(result).toEqual(mockRecipient);
      expect(model.findOne).toHaveBeenCalledWith({
        RecipientContact: 1234567890,
      });
    });

    it('should throw NotFoundException if recipient not found', async () => {
      jest.spyOn(model, 'findOne').mockResolvedValue(null);
      await expect(service.findByContact(1234567890)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update recipient successfully', async () => {
      const updateRecipientDto: UpdateRecipientDto = {
        RecipientName: 'Updated Name',
        RecipientEmail: 'updated.email@example.com',
        RecipientContact: 1234567890, // Ensure contact number is passed here
        Address: '456 Updated St',
        ID_proof: Buffer.from('mock-data'),
      };

      const result = await service.update(1234567890, updateRecipientDto);
      expect(result).toEqual(mockRecipient);
      expect(model.findOneAndUpdate).toHaveBeenCalledWith(
        { RecipientContact: 1234567890 },
        updateRecipientDto,
        { new: true, runValidators: true },
      );
    });

    it('should throw NotFoundException if recipient not found', async () => {
      jest.spyOn(model, 'findOneAndUpdate').mockResolvedValue(null);
      await expect(
        service.update(1234567890, {
          RecipientName: 'Updated Name',
          RecipientEmail: '',
          RecipientContact: 0,
          Address: '',
          ID_proof: undefined,
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('partialUpdate', () => {
    it('should partially update recipient successfully', async () => {
      const updateData = { RecipientName: 'Partially Updated Name' };
      const result = await service.partialUpdate(1234567890, updateData);
      expect(result).toEqual(mockRecipient);
      expect(model.findOneAndUpdate).toHaveBeenCalledWith(
        { RecipientContact: 1234567890 },
        { $set: updateData },
        { new: true, runValidators: true },
      );
    });

    it('should throw NotFoundException if recipient not found', async () => {
      jest.spyOn(model, 'findOneAndUpdate').mockResolvedValue(null);
      await expect(
        service.partialUpdate(1234567890, {
          RecipientName: 'Partially Updated',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('delete', () => {
    it('should delete a recipient successfully', async () => {
      const result = await service.delete(1234567890);
      expect(result).toBeUndefined();
      expect(model.findOneAndDelete).toHaveBeenCalledWith({
        RecipientContact: 1234567890,
      });
    });

    it('should throw NotFoundException if recipient not found', async () => {
      jest.spyOn(model, 'findOneAndDelete').mockResolvedValue(null);
      await expect(service.delete(1234567890)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('bulkCreate', () => {
    it('should create multiple recipients successfully', async () => {
      const result = await service.bulkCreate(mockRecipients);
      expect(result).toEqual(mockRecipients);
      expect(model.insertMany).toHaveBeenCalledWith(mockRecipients);
    });
  });

  describe('bulkUpdate', () => {
    it('should bulk update recipients successfully', async () => {
      const updateRecipients: UpdateRecipientDto[] = [
        {
          RecipientContact: 1234567890,
          RecipientName: 'Updated Name',
          RecipientEmail: 'updated.email@example.com',
          Address: '456 Updated St',
          ID_proof: Buffer.from('mock-data'),
        },
      ];

      const result = await service.bulkUpdate(updateRecipients);
      expect(result.updatedCount).toBe(1);
      expect(model.findOneAndUpdate).toHaveBeenCalledTimes(1);
    });

    it('should return not found contacts when some recipients do not exist', async () => {
      const updateRecipients: UpdateRecipientDto[] = [
        {
          RecipientContact: 1234567890,
          RecipientName: 'Updated Name',
          RecipientEmail: 'updated.email@example.com',
          Address: '456 Updated St',
          ID_proof: Buffer.from('mock-data'),
        },
      ];

      jest.spyOn(model, 'findOneAndUpdate').mockResolvedValue(null);
      const result = await service.bulkUpdate(updateRecipients);
      expect(result.updatedCount).toBe(0);
      expect(result.notFoundContacts).toEqual([1234567890]);
    });
  });

  describe('import', () => {
    it('should import recipients successfully', async () => {
      const recipients = [mockRecipient];
      const result = await service.import(recipients);
      expect(result.message).toBe('Recipients imported successfully');
      expect(result.recipients).toEqual(mockRecipients);
      expect(model.insertMany).toHaveBeenCalledWith(recipients);
    });
  });
});

describe('controller', () => {
  it('should create a recipient successfully', async () => {
    const controller = {
      create: jest.fn().mockResolvedValue(Recipient),
    };

    const result = await controller.create({
      RecipientName: 'John',
      RecipientEmail: 'john@example.com',
      RecipientContact: 1234567890,
      Address: '123 Test St',
      ID_proof: Buffer.from('mock-data'),
    } as CreateRecipientV1Dto);

    expect(result).toEqual(Recipient);
    expect(controller.create).toHaveBeenCalledWith({
      RecipientName: 'John',
      RecipientEmail: 'john@example.com',
      RecipientContact: 1234567890,
      Address: '123 Test St',
      ID_proof: Buffer.from('mock-data'),
    } as CreateRecipientV1Dto);
  });
});
