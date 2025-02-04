import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  UseInterceptors,
  UploadedFile,
  ParseIntPipe,
  BadRequestException,
  InternalServerErrorException,
  Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { ApiTags, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { PackageDetailsService } from './package-details.service';
import {
  CreatePackageDetailsDto,
  UpdatePackageDetailsDto,
  BulkPackageDetailsDto,
  BulkDeletePackageDetailsDto,
  PartialUpdatePackageDetailsDto,
} from '../package-details/dto/package-details.dto';
import {
  multerOptions,
  multerOptionsForJson,
} from '../package-details/config/multer.config';

@ApiTags('packagedetails')
@Controller('packagedetails')
export class PackageController {
  constructor(private readonly packageService: PackageDetailsService) {}

  @Post()
  @ApiBody({ type: CreatePackageDetailsDto })
  async create(@Body() createPackageDto: CreatePackageDetailsDto) {
    return this.packageService.createPackage(createPackageDto);
  }

  @Get()
  async findAll() {
    return await this.packageService.findAll();
  }

  @Get(':trackingNumber')
  async findOne(@Param('trackingNumber', ParseIntPipe) trackingNumber: number) {
    return await this.packageService.findByContact(trackingNumber);
  }

  @Put(':trackingNumber')
  async update(
    @Param('trackingNumber', ParseIntPipe) trackingNumber: number,
    @Body() updatePackageDetailsDto: UpdatePackageDetailsDto,
  ) {
    return await this.packageService.update(
      trackingNumber,
      updatePackageDetailsDto,
    );
  }

  @Patch(':trackingNumber')
  async partialUpdate(
    @Param('trackingNumber', ParseIntPipe) trackingNumber: number,
    @Body() updateData: PartialUpdatePackageDetailsDto,
  ) {
    return await this.packageService.partialUpdate(trackingNumber, updateData);
  }

  @Delete(':trackingNumber')
  async delete(@Param('trackingNumber', ParseIntPipe) trackingNumber: number) {
    await this.packageService.delete(trackingNumber);
    return { message: 'Package deleted successfully' };
  }

  @Post('add-many')
  async bulkCreate(@Body() bulkDto: BulkPackageDetailsDto) {
    if (
      !Array.isArray(bulkDto.packagedetails) ||
      bulkDto.packagedetails.length === 0
    ) {
      throw new BadRequestException('Packages must be a non-empty array.');
    }
    return this.packageService.bulkCreate(bulkDto.packagedetails);
  }

  @Post('delete-many')
  async bulkDelete(@Body() bulkCreateDto: BulkDeletePackageDetailsDto) {
    const result = await this.packageService.bulkDelete(
      bulkCreateDto.trackingNumbers,
    );
    return result;
  }

  @Post(':trackingNumber/ID_Proof')
  @UseInterceptors(FileInterceptor('image', multerOptions))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        image: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  async uploadIdProof(
    @Param('trackingNumber') trackingNumber: number, // Removed ParseIntPipe
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded.');
    }

    await this.packageService.uploadIdProof(trackingNumber, file);
    return {
      message: 'ID proof uploaded successfully',
      fileDetails: {
        originalName: file.originalname,
        size: file.size,
        contentType: file.mimetype,
      },
    };
  }

  @Get(':trackingNumber/ID_Proof')
  async getIdProof(
    @Param('trackingNumber', ParseIntPipe) TrackingNumber: number,
    @Res() res: Response,
  ) {
    const idProof = await this.packageService.getIdProof(TrackingNumber);
    res.set('Content-Type', idProof.contentType);
    res.send(idProof.data);
  }

  @Delete(':trackingNumber/ID_Proof')
  async deleteIdProof(
    @Param('trackingNumber', ParseIntPipe) TrackingNumber: number,
  ) {
    const Package = await this.packageService.deleteIdProof(TrackingNumber);
    return { message: 'ID_Proof deleted successfully', Package };
  }

  @Post('bulk-import')
  @UseInterceptors(FileInterceptor('file', multerOptionsForJson))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  async bulkImport(@UploadedFile() file: Express.Multer.File): Promise<any> {
    if (!file) {
      throw new BadRequestException('No file uploaded.');
    }

    try {
      const fileContent = file.buffer.toString('utf-8').trim(); // Trim extra spaces

      if (!fileContent) {
        throw new BadRequestException('File content is empty.');
      }

      const packageDetails = JSON.parse(fileContent);

      if (!Array.isArray(packageDetails) || packageDetails.length === 0) {
        throw new BadRequestException(
          'Invalid JSON format. Expected a non-empty array of package details.',
        );
      }

      return await this.packageService.bulkCreate(packageDetails);
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
