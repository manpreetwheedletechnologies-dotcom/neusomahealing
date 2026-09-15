import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import {
  CoachingProgram,
  CoachingProgramSchema,
} from './schemas/coaching-program.schema';
import { CoachingService } from './coaching.service';
import { CoachingController } from './coaching.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CoachingProgram.name, schema: CoachingProgramSchema },
    ]),
    AuthModule,
  ],
  controllers: [CoachingController],
  providers: [CoachingService],
  exports: [CoachingService],
})
export class CoachingModule {}
