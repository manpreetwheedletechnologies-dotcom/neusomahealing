import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  CoachingProgram,
  CoachingProgramDocument,
} from './schemas/coaching-program.schema';

@Injectable()
export class CoachingService {
  constructor(
    @InjectModel(CoachingProgram.name)
    private programModel: Model<CoachingProgramDocument>,
  ) {}

  create(data: Partial<CoachingProgram>) {
    return this.programModel.create(data);
  }

  findAll() {
    return this.programModel
      .find({ published: true })
      .sort({ order: 1, createdAt: -1 })
      .exec();
  }

  findAllForAdmin() {
    return this.programModel
      .find()
      .sort({ order: 1, createdAt: -1 })
      .exec();
  }

  count() {
    return this.programModel.countDocuments().exec();
  }

  async findBySlug(slug: string) {
    const program = await this.programModel
      .findOne({ slug, published: true })
      .exec();

    if (!program) throw new NotFoundException('Coaching program not found');
    return program;
  }

  async update(id: string, data: Partial<CoachingProgram>) {
    const updated = await this.programModel
      .findByIdAndUpdate(id, data, { new: true })
      .exec();

    if (!updated) throw new NotFoundException('Coaching program not found');
    return updated;
  }

  async remove(id: string) {
    const deleted = await this.programModel.findByIdAndDelete(id).exec();
    if (!deleted) throw new NotFoundException('Coaching program not found');
    return { deleted: true };
  }
}
