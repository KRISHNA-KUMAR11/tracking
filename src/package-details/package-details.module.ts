import { Module } from '@nestjs/common';
import { PackageController } from './package-details.controller';
import { PackageDetailsService } from './package-details.service';
import { MongooseModule } from '@nestjs/mongoose';
import { PackageDetailsSchema } from './schemas/package-details.schema';
import { RecipientSchema } from '../recipient/schemas/recipient.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'PackageDetails', schema: PackageDetailsSchema },
    ]),
    MongooseModule.forFeature([{ name: 'Recipient', schema: RecipientSchema }]),
  ],
  controllers: [PackageController],
  providers: [PackageDetailsService],
})
export class PackageDetailsModule {}
