import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { PageContent, PageContentSchema } from './schemas/page-content.schema';
import { ContentService } from './content.service';
import { ContentController } from './content.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PageContent.name, schema: PageContentSchema },
    ]),
    AuthModule,
  ],
  controllers: [ContentController],
  providers: [ContentService],
  exports: [ContentService],
})
export class ContentModule {}
