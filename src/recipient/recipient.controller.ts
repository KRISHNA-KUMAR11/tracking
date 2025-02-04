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
  Res,
  HttpStatus,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { Response } from 'express';
import { RecipientService } from './recipient.service';
import {
  CreateRecipientDto,
  UpdateRecipientDto,
  BulkCreateRecipientsDto,
  BulkDeleteRecipientsDto,
  PartialUpdateRecipientDto,
  BulkUpdateRecipientsDto,
} from '../recipient/dto/recipient.dto';
import {
  multerOptions,
  multerOptionsForJson,
} from '../recipient/config/multer.config';

@ApiTags('Recipients')
@Controller('recipients')
export class RecipientController {
  constructor(private readonly recipientService: RecipientService) {}

  @Post()
  async create(@Body() createRecipientDto: CreateRecipientDto) {
    if (!createRecipientDto) {
      throw new BadRequestException('Missing required fields');
    }
    return await this.recipientService.create(createRecipientDto);
  }

  @Get()
  async findAll() {
    return await this.recipientService.findAll();
  }

  @Get(':RecipientContact')
  async findOne(
    @Param('RecipientContact', ParseIntPipe) RecipientContact: number,
  ) {
    return await this.recipientService.findByContact(RecipientContact);
  }

  @Put(':RecipientContact')
  async update(
    @Param('RecipientContact', ParseIntPipe) RecipientContact: number,
    @Body() updateRecipientDto: UpdateRecipientDto,
  ) {
    return await this.recipientService.update(
      RecipientContact,
      updateRecipientDto,
    );
  }

  @Patch(':RecipientContact')
  async partialUpdate(
    @Param('RecipientContact', ParseIntPipe) RecipientContact: number,
    @Body() updateData: PartialUpdateRecipientDto,
  ) {
    try {
      const updatedRecipient = await this.recipientService.partialUpdate(
        RecipientContact,
        updateData,
      );

      return {
        status: HttpStatus.OK,
        message: 'Recipient updated successfully',
        data: updatedRecipient,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        return {
          status: HttpStatus.NOT_FOUND,
          error: 'Recipient not found.',
        };
      }
      return {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        error: error.message,
      };
    }
  }

  @Delete(':RecipientContact')
  async delete(
    @Param('RecipientContact', ParseIntPipe) RecipientContact: number,
  ) {
    await this.recipientService.delete(RecipientContact);
    return { message: 'Recipient deleted successfully' };
  }

  @Post('add-many')
  async bulkCreate(@Body() bulkCreateDto: BulkCreateRecipientsDto) {
    return await this.recipientService.bulkCreate(bulkCreateDto.recipients);
  }

  @Post('bulk-update')
  async bulkUpdate(@Body() bulkUpdateDto: BulkUpdateRecipientsDto) {
    const { updatedCount, notFoundContacts } =
      await this.recipientService.bulkUpdate(bulkUpdateDto.recipients);

    return {
      message: 'Bulk update completed',
      updatedCount,
      notFoundContacts,
    };
  }

  @Post('delete-many')
  async bulkDelete(@Body() bulkDeleteDto: BulkDeleteRecipientsDto) {
    return await this.recipientService.bulkDelete(bulkDeleteDto.contactNumbers);
  }

  @Post(':RecipientContact/ID_Proof')
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
    @Param('RecipientContact', ParseIntPipe) RecipientContact: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    await this.recipientService.uploadIdProof(RecipientContact, file);
    return {
      message: 'ID proof uploaded successfully',
      fileDetails: {
        originalName: file.originalname,
        size: file.size,
        contentType: file.mimetype,
      },
    };
  }

  @Get(':RecipientContact/ID_Proof')
  async getIdProof(
    @Param('RecipientContact', ParseIntPipe) RecipientContact: number,
    @Res() res: Response,
  ) {
    const idProof = await this.recipientService.getIdProof(RecipientContact);
    res.set('Content-Type', idProof.contentType);
    res.send(idProof.data);
  }

  @Delete(':RecipientContact/delete_ID_Proof')
  async deleteIdProof(
    @Param('RecipientContact', ParseIntPipe) RecipientContact: number,
  ) {
    const recipient =
      await this.recipientService.deleteIdProof(RecipientContact);
    return { message: 'ID_Proof deleted successfully', recipient };
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
      const fileContent = file.buffer.toString('utf-8'); // Convert buffer to string

      if (!fileContent) {
        throw new BadRequestException('File content is empty.');
      }

      const recipients = JSON.parse(file.buffer.toString()); // Attempt to parse JSON

      if (!Array.isArray(recipients)) {
        throw new BadRequestException(
          'Invalid JSON format. Expected an array of recipients.',
        );
      }

      // Pass parsed data to the service for bulk creation
      return await this.recipientService.bulkCreate(recipients);
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new BadRequestException('Invalid JSON format.');
      }

      throw new InternalServerErrorException(
        'An error occurred while importing recipients.',
      );
    }
  }
}
