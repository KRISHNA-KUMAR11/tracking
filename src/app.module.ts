import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { RecipientModule } from './recipient/recipient.module';
import { PackageDetailsModule } from './package-details/package-details.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }), // Load environment variables globally
    MongooseModule.forRoot(process.env.MONGO_URI), // Connect to MongoDB using .env
    RecipientModule,
    PackageDetailsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
