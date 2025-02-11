import {
  IsString,
  IsEmail,
  IsNumber,
  IsNotEmpty,
  IsOptional,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateRecipientV1Dto {
  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  RecipientName: string;

  @ApiProperty({ example: 'john.doe@example.com' })
  @IsEmail()
  @IsNotEmpty()
  RecipientEmail: string;

  @ApiProperty({ example: 1234567890 })
  @IsNumber()
  @IsNotEmpty()
  RecipientContact: number;

  @ApiProperty({ example: '123 Main Street, Springfield' })
  @IsString()
  @IsNotEmpty()
  Address: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNotEmpty()
  ID_proof: Buffer;
}

export class CreateRecipientV2Dto {
  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  RecipientName: string;

  @ApiProperty({ example: 'john.doe@example.com' })
  @IsEmail()
  @IsNotEmpty()
  RecipientEmail: string;

  @ApiProperty({ example: 1234567890 })
  @IsNumber()
  @IsNotEmpty()
  RecipientContact: number;

  @ApiProperty({ example: '123 Main Street, Springfield' })
  @IsString()
  @IsNotEmpty()
  Address: string;
}

export class UpdateRecipientDto extends CreateRecipientV1Dto {}

export class BulkCreateRecipientsDto {
  @ApiProperty({ type: [CreateRecipientV1Dto] })
  recipients: CreateRecipientV1Dto[];
}

export class BulkDeleteRecipientsDto {
  @ApiProperty({ type: [Number] })
  @IsNumber({}, { each: true })
  contactNumbers: number[];
}

export class PartialUpdateRecipientDto
  implements Partial<CreateRecipientV1Dto>
{
  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @IsOptional()
  RecipientName?: string;

  @ApiProperty({ example: 'john.doe@example.com' })
  @IsEmail()
  @IsOptional()
  RecipientEmail?: string;

  @ApiProperty({ example: 1234567890 })
  @IsNumber()
  @IsOptional()
  RecipientContact?: number;

  @ApiProperty({ example: '123 Main Street, Springfield' })
  @IsString()
  @IsOptional()
  Address?: string;
}

export class BulkUpdateRecipientsDto {
  @ApiProperty({
    type: [PartialUpdateRecipientDto],
    example: [
      {
        RecipientContact: 1234567890,
        RecipientName: 'John Doe',
        RecipientEmail: 'john.doe@example.com',
        Address: '123 Main Street, Springfield',
      },
      {
        RecipientContact: 9876543210,
        RecipientName: 'Jane Smith',
        RecipientEmail: 'jane.smith@example.com',
        Address: '456 Elm Street, Metropolis',
      },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateRecipientDto)
  recipients: UpdateRecipientDto[];
}
