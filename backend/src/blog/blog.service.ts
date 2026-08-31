import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Post, PostDocument } from './schemas/post.schema';

@Injectable()
export class BlogService {
  constructor(@InjectModel(Post.name) private postModel: Model<PostDocument>) {}

  create(data: Partial<Post>) {
    return this.postModel.create(data);
  }

  findAll() {
    return this.postModel
      .find({ published: true })
      .sort({ createdAt: -1 })
      .exec();
  }

  async findBySlug(slug: string) {
    const post = await this.postModel.findOne({ slug, published: true }).exec();
    if (!post) throw new NotFoundException('Post not found');
    return post;
  }

  async update(id: string, data: Partial<Post>) {
    const updated = await this.postModel
      .findByIdAndUpdate(id, data, { new: true })
      .exec();
    if (!updated) throw new NotFoundException('Post not found');
    return updated;
  }

  async remove(id: string) {
    const deleted = await this.postModel.findByIdAndDelete(id).exec();
    if (!deleted) throw new NotFoundException('Post not found');
    return { deleted: true };
  }
}
