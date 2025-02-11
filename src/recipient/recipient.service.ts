import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Recipient } from '../recipient/schemas/recipient.schema';
import {
  CreateRecipientV1Dto,
  CreateRecipientV2Dto,
  PartialUpdateRecipientDto,
  UpdateRecipientDto,
} from '../recipient/dto/recipient.dto';

@Injectable()
export class RecipientService {
  constructor(
    @InjectModel(Recipient.name) private recipientModel: Model<Recipient>,
  ) {}

  async createV1(createRecipientDto: CreateRecipientV1Dto): Promise<Recipient> {
    return await this.recipientModel.create(createRecipientDto);
  }

  async createV2(
    createRecipientsDto: CreateRecipientV2Dto,
  ): Promise<Recipient> {
    return await this.recipientModel.create(createRecipientsDto);
  }

  async findAll(): Promise<Recipient[]> {
    return await this.recipientModel.find({}, { 'ID_proof.data': 0 });
  }

  async findByContact(RecipientContact: number): Promise<Recipient> {
    const recipient = await this.recipientModel.findOne({ RecipientContact });
    if (!recipient) {
      throw new NotFoundException(
        `Recipient with contact ${RecipientContact} not found.`,
      );
    }
    return recipient;
  }

  async update(
    RecipientContact: number,
    updateRecipientDto: UpdateRecipientDto,
  ): Promise<Recipient> {
    const updatedRecipient = await this.recipientModel.findOneAndUpdate(
      { RecipientContact },
      updateRecipientDto,
      { new: true, runValidators: true },
    );
    if (!updatedRecipient) {
      throw new NotFoundException(
        `Recipient with contact ${RecipientContact} not found.`,
      );
    }
    return updatedRecipient;
  }

  async partialUpdate(
    RecipientContact: number,
    updateData: PartialUpdateRecipientDto,
  ): Promise<Recipient> {
    // Ensure RecipientContact is not modified
    if ('RecipientContact' in updateData) {
      delete updateData.RecipientContact;
    }

    const updatedRecipient = await this.recipientModel.findOneAndUpdate(
      { RecipientContact },
      { $set: updateData }, // Apply partial update using $set
      { new: true, runValidators: true }, // Return updated document
    );

    if (!updatedRecipient) {
      throw new NotFoundException(
        `Recipient with contact ${RecipientContact} not found.`,
      );
    }

    return updatedRecipient;
  }

  async delete(RecipientContact: number): Promise<void> {
    const result = await this.recipientModel.findOneAndDelete({
      RecipientContact,
    });
    if (!result) {
      throw new NotFoundException(
        `Recipient with contact ${RecipientContact} not found.`,
      );
    }
  }

  async bulkCreate(recipients: CreateRecipientV1Dto[]): Promise<Recipient[]> {
    return (await this.recipientModel.insertMany(
      recipients,
    )) as unknown as Recipient[];
  }

  async bulkUpdate(recipients: UpdateRecipientDto[]): Promise<{
    updatedCount: number;
    notFoundContacts: number[];
  }> {
    const notFoundContacts: number[] = [];
    let updatedCount = 0;

    for (const recipient of recipients) {
      const { RecipientContact, ...updateData } = recipient;

      const updatedRecipient = await this.recipientModel.findOneAndUpdate(
        { RecipientContact },
        { $set: updateData },
        { new: true, runValidators: true },
      );

      if (updatedRecipient) {
        updatedCount++;
      } else {
        notFoundContacts.push(RecipientContact);
      }
    }

    return { updatedCount, notFoundContacts };
  }

  async bulkDelete(contactNumbers: number[]): Promise<{
    deletedCount: number;
    notFoundNumbers: number[];
  }> {
    const existingRecipients = await this.recipientModel
      .find({
        RecipientContact: { $in: contactNumbers },
      })
      .exec();

    const existingNumbers = existingRecipients.map((r) => r.RecipientContact);
    const notFoundNumbers = contactNumbers.filter(
      (num) => !existingNumbers.includes(num),
    );
    const deleteResult = await this.recipientModel.deleteMany({
      RecipientContact: { $in: contactNumbers },
    });

    return {
      deletedCount: deleteResult.deletedCount,
      notFoundNumbers,
    };
  }

  async uploadIdProof(
    RecipientContact: number,
    file: Express.Multer.File,
  ): Promise<Recipient> {
    const recipient = await this.recipientModel.findOneAndUpdate(
      { RecipientContact },
      {
        'ID_proof.data': file.buffer,
        'ID_proof.contentType': file.mimetype,
        'ID_proof.size': file.size,
      },
      { new: true },
    );

    if (!recipient) {
      throw new NotFoundException(
        `Recipient with contact ${RecipientContact} not found.`,
      );
    }
    return recipient;
  }

  async getIdProof(RecipientContact: number): Promise<{
    data: Buffer;
    contentType: string;
  }> {
    const recipient = await this.findByContact(RecipientContact);
    if (!recipient.ID_proof?.data) {
      throw new NotFoundException('ID proof not found');
    }

    return {
      data: recipient.ID_proof.data,
      contentType: recipient.ID_proof.contentType,
    };
  }

  async deleteIdProof(RecipientContact: number): Promise<Recipient> {
    const recipient = await this.recipientModel.findOneAndUpdate(
      { RecipientContact },
      {
        $unset: {
          'ID_proof.data': '',
          'ID_proof.contentType': '',
          'ID_proof.size': '',
        },
      },
      { new: true },
    );

    if (!recipient) {
      throw new NotFoundException(
        `Recipient with contact ${RecipientContact} not found.`,
      );
    }
    return recipient;
  }

  async import(recipients: CreateRecipientV1Dto[]): Promise<any> {
    try {
      // Validate data
      if (!Array.isArray(recipients) || recipients.length === 0) {
        throw new BadRequestException('Invalid or empty recipient data.');
      }

      // Bulk insert recipients
      const createdRecipients =
        await this.recipientModel.insertMany(recipients);

      return {
        message: 'Recipients imported successfully',
        recipients: createdRecipients,
      };
    } catch (error) {
      console.error('Error during bulk create:', error.message);
      throw new InternalServerErrorException(
        'Error while importing recipients.',
      );
    }
  }
}
