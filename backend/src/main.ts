import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import {
  UPLOADS_DIR,
  ensureUploadsDirExists,
} from './uploads/uploads.constants';

async function bootstrap() {
  ensureUploadsDirExists();

  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Serve uploaded images/videos
  app.useStaticAssets(UPLOADS_DIR, {
    prefix: '/uploads/',
  });

  app.enableCors({
    origin: (process.env.CORS_ORIGIN || 'http://localhost:3000')
      .split(',')
      .map((origin) => origin.trim()),
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const port = Number(process.env.PORT) || 4000;

  // IMPORTANT:
  // 0.0.0.0 = allow connections from other devices on the LAN
  await app.listen(port, '0.0.0.0');

  console.log(
    `NeusomaHealing backend running on http://0.0.0.0:${port}`,
  );
}

bootstrap();