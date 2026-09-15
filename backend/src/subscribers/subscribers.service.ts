import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Subscriber, SubscriberDocument } from './schemas/subscriber.schema';
import { AudienceService } from '../users/audience.service';

@Injectable()
export class SubscribersService {
  constructor(
    @InjectModel(Subscriber.name)
    private subscriberModel: Model<SubscriberDocument>,

    private readonly audienceService: AudienceService,
  ) {}

  /*
   * Public newsletter signup.
   *
   * Idempotent: re-subscribing an email that already exists
   * (including one that was previously deactivated) simply
   * reactivates it instead of throwing a duplicate-key error.
   */
  async subscribe(email: string, source?: string) {
    const subscriber = await this.subscriberModel
      .findOneAndUpdate(
        { email },
        {
          $set: { active: true },
          $setOnInsert: { email, source: source || 'website' },
        },
        { upsert: true, new: true },
      )
      .exec();

    // Newsletter signups join the shared announcement
    // list too, so they hear about new sessions.
    await this.audienceService.capture({
      email,
      source: 'newsletter',
    });

    return subscriber;
  }

  findAll() {
    return this.subscriberModel.find().sort({ createdAt: -1 }).exec();
  }

  count() {
    return this.subscriberModel.countDocuments({ active: true }).exec();
  }

  async update(id: string, active: boolean) {
    const updated = await this.subscriberModel
      .findByIdAndUpdate(id, { active }, { new: true })
      .exec();

    if (!updated) throw new NotFoundException('Subscriber not found');
    return updated;
  }

  async remove(id: string) {
    const deleted = await this.subscriberModel.findByIdAndDelete(id).exec();
    if (!deleted) throw new NotFoundException('Subscriber not found');
    return { deleted: true };
  }
}
