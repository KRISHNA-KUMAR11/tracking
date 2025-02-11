import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { Logger } from 'nestjs-pino';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.useLogger(app.get(Logger));

  app.enableVersioning({
    type: VersioningType.HEADER,
    header: 'Version-header',
  });

  const config = new DocumentBuilder()
    .setTitle('Package Details API')
    .setDescription('API for managing package details')
    .setVersion('1.0')
    .addBasicAuth({ type: 'http', scheme: 'basic' }, 'basic')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
      'jwt',
    )
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(3000);
}
bootstrap();

//http://62.146.178.245:5000/api/
