import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Video, VideoDocument } from './schemas/video.schema';

@Injectable()
export class VideosService {
  constructor(
    @InjectModel(Video.name) private videoModel: Model<VideoDocument>,
  ) {}

  create(data: Partial<Video>) {
    return this.videoModel.create(data);
  }

  findAll() {
    return this.videoModel
      .find({ published: true })
      .sort({ createdAt: -1 })
      .exec();
  }

  async update(id: string, data: Partial<Video>) {
    const updated = await this.videoModel
      .findByIdAndUpdate(id, data, { new: true })
      .exec();
    if (!updated) throw new NotFoundException('Video not found');
    return updated;
  }

  async remove(id: string) {
    const deleted = await this.videoModel.findByIdAndDelete(id).exec();
    if (!deleted) throw new NotFoundException('Video not found');
    return { deleted: true };
  }
}
