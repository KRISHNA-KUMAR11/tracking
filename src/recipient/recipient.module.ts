import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RecipientService } from './recipient.service';
import { RecipientController } from './recipient.controller';
import { RecipientSchema } from './schemas/recipient.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Recipient', schema: RecipientSchema }]),
  ],
  exports: [MongooseModule, RecipientService], // Export to make it available in other modules
  providers: [RecipientService],
  controllers: [RecipientController],
})
export class RecipientModule {}
