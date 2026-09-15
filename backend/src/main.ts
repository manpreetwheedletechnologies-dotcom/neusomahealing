import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { UPLOADS_DIR, ensureUploadsDirExists } from './uploads/uploads.constants';

async function bootstrap() {
  ensureUploadsDirExists();

  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Serves everything the admin panel uploads (images/videos) at
  // GET /uploads/<filename>, matching the URL returned by POST /admin/uploads.
  app.useStaticAssets(UPLOADS_DIR, { prefix: '/uploads/' });

  app.enableCors({
    origin: (process.env.CORS_ORIGIN || 'http://localhost:3000').split(','),
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }),
  );

  const port = process.env.PORT || 4000;
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`NeusomaHealing backend running on http://localhost:${port}`);
}
bootstrap();
