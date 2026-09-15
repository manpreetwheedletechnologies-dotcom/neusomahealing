import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PageContent, PageContentDocument } from './schemas/page-content.schema';

@Injectable()
export class ContentService {
  constructor(
    @InjectModel(PageContent.name)
    private contentModel: Model<PageContentDocument>,
  ) {}

  findAll() {
    return this.contentModel.find().sort({ key: 1 }).exec();
  }

  findOne(key: string) {
    return this.contentModel.findOne({ key }).exec();
  }

  upsert(key: string, data: Record<string, unknown>) {
    return this.contentModel
      .findOneAndUpdate(
        { key },
        { $set: { data } },
        { upsert: true, new: true },
      )
      .exec();
  }
}
