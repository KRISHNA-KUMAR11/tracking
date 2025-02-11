import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UploadedFile,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  CreatePackageDetailsV1Dto,
  CreatePackageDetailsV2Dto,
  UpdatePackageDetailsDto,
  PartialUpdatePackageDetailsDto,
} from '../package-details/dto/package-details.dto';
import { PackageDetails } from './schemas/package-details.schema';
import { Recipient } from 'src/recipient/schemas/recipient.schema';

@Injectable()
export class PackageDetailsService {
  PackageDetailsService: any;
  constructor(
    @InjectModel('PackageDetails')
    private packageModel: Model<PackageDetails>,
    @InjectModel('Recipient')
    private readonly recipientModel: Model<Recipient>,
  ) {}

  async createV1(
    createPackageDto: CreatePackageDetailsV1Dto,
  ): Promise<PackageDetails> {
    const { RecipientId } = createPackageDto;

    // Validate RecipientId
    const recipientExists = await this.recipientModel
      .findById(RecipientId)
      .exec();
    if (!recipientExists) {
      throw new BadRequestException(
        `Recipient with ID ${RecipientId} does not exist.`,
      );
    }

    const newPackage = new this.packageModel(createPackageDto);
    return newPackage.save();
  }

  async createV2(
    createPackageDto: CreatePackageDetailsV2Dto,
  ): Promise<PackageDetails> {
    const { RecipientId } = createPackageDto;

    // Validate RecipientId
    const recipientExists = await this.recipientModel
      .findById(RecipientId)
      .exec();
    if (!recipientExists) {
      throw new BadRequestException(
        `Recipient with ID ${RecipientId} does not exist.`,
      );
    }

    const newPackage = new this.packageModel(createPackageDto);
    return newPackage.save();
  }

  async findAll(): Promise<PackageDetails[]> {
    return await this.packageModel.find({}, '-ID_proof.data');
  }

  async findByContact(TrackingNumber: number): Promise<PackageDetails> {
    const packageDetail = await this.packageModel.findOne({
      TrackingNumber,
    });
    if (!packageDetail) {
      throw new NotFoundException('Package not found');
    }
    return packageDetail;
  }

  async update(
    TrackingNumber: number,
    updatePackageDetailsDto: UpdatePackageDetailsDto,
  ): Promise<PackageDetails> {
    const { RecipientId } = updatePackageDetailsDto;
    const recipientExists = await this.recipientModel
      .findById(RecipientId)
      .exec();
    if (!recipientExists) {
      throw new BadRequestException(
        `Recipient with ID ${RecipientId} does not exist.`,
      );
    }
    const updatedPackage = await this.packageModel.findOneAndUpdate(
      { TrackingNumber },
      updatePackageDetailsDto,
      { new: true, runValidators: true },
    );
    if (!updatedPackage) {
      throw new NotFoundException('Package not found');
    }
    return updatedPackage;
  }

  async partialUpdate(
    TrackingNumber: number,
    updateData: PartialUpdatePackageDetailsDto,
  ): Promise<PackageDetails> {
    if ('RecipientId' in updateData) {
      delete updateData.RecipientId;
    }
    const updatedPackage = await this.packageModel.findOneAndUpdate(
      { TrackingNumber },
      { $set: updateData }, // Apply partial update using $set
      { new: true, runValidators: true }, // Return updated document
    );

    if (!updatedPackage) {
      throw new NotFoundException('Package not found');
    }

    return updatedPackage;
  }

  async delete(TrackingNumber: number): Promise<void> {
    const result = await this.packageModel.findOneAndDelete({
      TrackingNumber,
    });
    if (!result) {
      throw new NotFoundException('Package not found');
    }
  }

  async bulkCreate(
    packages: CreatePackageDetailsV1Dto[],
  ): Promise<PackageDetails[]> {
    if (!Array.isArray(packages) || packages.length === 0) {
      throw new BadRequestException('Packages must be a non-empty array.');
    }

    // Validate if each package has a valid recipient
    for (const packageDetail of packages) {
      const { RecipientId } = packageDetail;
      const recipientExists = await this.recipientModel
        .findById(RecipientId)
        .exec();
      if (!recipientExists) {
        throw new NotFoundException(
          `Recipient with ID ${RecipientId} does not exist.`,
        );
      }
    }

    // Find last TrackingNumber and increment
    const lastPackage = await this.packageModel
      .findOne()
      .sort({ TrackingNumber: -1 })
      .exec();
    let nextTrackingNumber = lastPackage ? lastPackage.TrackingNumber + 1 : 1;

    // Assign TrackingNumbers to packages
    packages.forEach((pkg) => {
      pkg.TrackingNumber = nextTrackingNumber++;
    });

    // Bulk insert
    return this.packageModel.insertMany(
      packages,
    ) as unknown as PackageDetails[];
  }

  async bulkDelete(trackingNumbers: number[]): Promise<{
    deletedCount: number;
    notFoundNumbers: number[];
  }> {
    const existingPackages = await this.packageModel.find({
      TrackingNumber: { $in: trackingNumbers },
    });

    const existingNumbers = existingPackages.map((pkg) => pkg.TrackingNumber);
    const notFoundNumbers = trackingNumbers.filter(
      (num) => !existingNumbers.includes(num),
    );

    const deleteResult = await this.packageModel.deleteMany({
      TrackingNumber: { $in: trackingNumbers },
    });

    return {
      deletedCount: deleteResult.deletedCount,
      notFoundNumbers,
    };
  }

  async uploadIdProof(
    TrackingNumber: number,
    file: Express.Multer.File,
  ): Promise<PackageDetails> {
    const PackageDetails = await this.packageModel.findOneAndUpdate(
      { TrackingNumber }, // Assuming TrackingNumber is derived from the file name
      {
        'ID_proof.data': file.buffer,
        'ID_proof.contentType': file.mimetype,
        'ID_proof.size': file.size,
      },
      { new: true },
    );

    if (!PackageDetails) {
      throw new NotFoundException('Package not found');
    }
    return PackageDetails;
  }

  async getIdProof(TrackingNumber: number): Promise<{
    data: Buffer;
    contentType: string;
  }> {
    const PackageDetails = await this.findByContact(TrackingNumber);
    if (!PackageDetails.ID_proof?.data) {
      throw new NotFoundException('ID proof not found');
    }

    return {
      data: PackageDetails.ID_proof.data,
      contentType: PackageDetails.ID_proof.contentType,
    };
  }

  async deleteIdProof(TrackingNumber: number): Promise<PackageDetails> {
    const PackageDetails = await this.packageModel.findOneAndUpdate(
      { TrackingNumber },
      {
        $unset: {
          'ID_proof.data': '',
          'ID_proof.contentType': '',
          'ID_proof.size': '',
        },
      },
      { new: true },
    );

    if (!PackageDetails) {
      throw new NotFoundException('Recipient not found');
    }
    return PackageDetails;
  }

  async bulkImport(@UploadedFile() file: Express.Multer.File): Promise<any> {
    if (!file) {
      throw new BadRequestException('No file uploaded.');
    }

    try {
      const fileContent = file.buffer.toString('utf-8');
      const packageDetails = JSON.parse(fileContent);

      if (!Array.isArray(packageDetails)) {
        throw new BadRequestException('Expected an array of package details.');
      }

      // Directly use the package model for bulk creation
      const createdPackages = await this.bulkCreate(packageDetails);
      return {
        message: 'Packages imported successfully',
        count: createdPackages.length,
      };
    } catch (error) {
      console.error('Error during bulk import:', error.message);
      if (error instanceof SyntaxError) {
        throw new BadRequestException('Invalid JSON format.');
      }
      throw new InternalServerErrorException(
        'An error occurred while importing package details.',
      );
    }
  }
}
