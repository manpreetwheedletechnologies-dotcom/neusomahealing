import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Testimonial, TestimonialDocument } from './schemas/testimonial.schema';

@Injectable()
export class TestimonialsService {
  constructor(
    @InjectModel(Testimonial.name)
    private testimonialModel: Model<TestimonialDocument>,
  ) {}

  create(data: Partial<Testimonial>) {
    return this.testimonialModel.create(data);
  }

  findAll() {
    return this.testimonialModel
      .find({ published: true })
      .sort({ order: 1, createdAt: -1 })
      .exec();
  }

  findAllForAdmin() {
    return this.testimonialModel
      .find()
      .sort({ order: 1, createdAt: -1 })
      .exec();
  }

  count() {
    return this.testimonialModel.countDocuments().exec();
  }

  async update(id: string, data: Partial<Testimonial>) {
    const updated = await this.testimonialModel
      .findByIdAndUpdate(id, data, { new: true })
      .exec();

    if (!updated) throw new NotFoundException('Testimonial not found');
    return updated;
  }

  async remove(id: string) {
    const deleted = await this.testimonialModel.findByIdAndDelete(id).exec();
    if (!deleted) throw new NotFoundException('Testimonial not found');
    return { deleted: true };
  }
}
