import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { EnquiriesModule } from './enquiries/enquiries.module';
import { VideosModule } from './videos/videos.module';
import { BlogModule } from './blog/blog.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot(
      process.env.MONGODB_URI || 'mongodb://localhost:27017/neusomahealing',
    ),
    EnquiriesModule,
    VideosModule,
    BlogModule,
  ],
})
export class AppModule {}
