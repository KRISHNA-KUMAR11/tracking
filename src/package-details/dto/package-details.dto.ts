import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsNumber,
  Min,
  ValidateNested,
  IsArray,
  IsMongoId,
} from 'class-validator';
import { ApiProperty, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreatePackageDetailsDto {
  @ApiProperty({ example: '60d2c4c28d5a930018d0c8e1' })
  @IsString()
  @IsNotEmpty()
  @IsMongoId()
  RecipientId: string; // Change from Types.ObjectId to string

  @ApiProperty({ example: 'pending' })
  @IsString()
  @IsEnum(['pending', 'in-transit', 'delivered', 'not delivered'])
  Status: string;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  SenderName: string;

  @ApiProperty({ example: 'New York' })
  @IsString()
  @IsNotEmpty()
  Origin: string;

  @ApiProperty({ example: 'San Francisco' })
  @IsString()
  @IsNotEmpty()
  Destination: string;

  @ApiProperty({ example: 'Electronics' })
  @IsOptional()
  @IsString()
  Description?: string;

  @ApiProperty({ example: 2.5 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  Package_weight: number;

  @ApiProperty({ example: 50.75 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  Price: number;
  TrackingNumber: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNotEmpty()
  ID_proof: Buffer;
}

export class UpdatePackageDetailsDto {
  @ApiProperty({ example: '60d2c4c28d5a930018d0c8e1' })
  @IsString()
  @IsNotEmpty()
  @IsMongoId()
  RecipientId: string; // Change from Types.ObjectId to string

  @ApiProperty({ example: 'pending' })
  @IsString()
  @IsEnum(['pending', 'in-transit', 'delivered', 'not delivered'])
  Status: string;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  SenderName: string;

  @ApiProperty({ example: 'New York' })
  @IsString()
  @IsNotEmpty()
  Origin: string;

  @ApiProperty({ example: 'San Francisco' })
  @IsString()
  @IsNotEmpty()
  Destination: string;

  @ApiProperty({ example: 'Electronics' })
  @IsOptional()
  @IsString()
  Description?: string;

  @ApiProperty({ example: 2.5 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  Package_weight: number;

  @ApiProperty({ example: 50.75 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  Price: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNotEmpty()
  ID_proof: Buffer;
}

export class BulkPackageDetailsDto {
  @ApiProperty({ type: [CreatePackageDetailsDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePackageDetailsDto)
  packagedetails: CreatePackageDetailsDto[];
}

export class BulkDeletePackageDetailsDto {
  @ApiProperty({ type: [Number] })
  @IsNumber({}, { each: true })
  trackingNumbers: number[];
  packagedetails: BulkDeletePackageDetailsDto;
}

export class PartialUpdatePackageDetailsDto extends PartialType(
  CreatePackageDetailsDto,
) {
  @ApiProperty({ example: '60d2c4c28d5a930018d0c8e1' })
  @IsString()
  @IsNotEmpty()
  @IsMongoId()
  RecipientId: string; // Change from Types.ObjectId to string

  @ApiProperty({ example: 'pending' })
  @IsString()
  @IsEnum(['pending', 'in-transit', 'delivered', 'not delivered'])
  Status: string;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  SenderName: string;

  @ApiProperty({ example: 'New York' })
  @IsString()
  @IsNotEmpty()
  Origin: string;

  @ApiProperty({ example: 'San Francisco' })
  @IsString()
  @IsNotEmpty()
  Destination: string;

  @ApiProperty({ example: 'Electronics' })
  @IsOptional()
  @IsString()
  Description?: string;

  @ApiProperty({ example: 2.5 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  Package_weight: number;

  @ApiProperty({ example: 50.75 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  Price: number;
}
