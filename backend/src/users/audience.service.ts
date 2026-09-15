import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { randomBytes } from 'crypto';
import { Model } from 'mongoose';

import {
  AudienceContact,
  AudienceContactDocument,
  AudienceSource,
} from './schemas/audience-contact.schema';

export type CaptureContactInput = {
  email?: string | null;
  name?: string | null;
  phone?: string | null;
  source: AudienceSource;
  hasAccount?: boolean;
};

@Injectable()
export class AudienceService {
  private readonly logger = new Logger(
    AudienceService.name,
  );

  constructor(
    @InjectModel(AudienceContact.name)
    private readonly contactModel: Model<AudienceContactDocument>,
  ) {}

  /*
   * Upsert a contact from any form on the site.
   *
   * Deliberately never throws: capturing a lead is
   * a side effect of the real action (submitting an
   * enquiry, making a booking), and must never be
   * the reason that action fails.
   */
  async capture(
    input: CaptureContactInput,
  ): Promise<void> {
    const email = input.email?.trim().toLowerCase();

    if (!email || !email.includes('@')) {
      return;
    }

    try {
      const name = input.name?.trim() || undefined;
      const phone = input.phone?.trim() || undefined;

      await this.contactModel.updateOne(
        { email },
        {
          // Only ever fill blanks — a later form with
          // an empty phone shouldn't wipe a number we
          // already captured.
          $setOnInsert: {
            email,
            isSubscribed: true,
            unsubscribeToken:
              randomBytes(24).toString('hex'),
          },

          $set: {
            lastSeenAt: new Date(),
            ...(name ? { name } : {}),
            ...(phone ? { phone } : {}),
            ...(input.hasAccount
              ? { hasAccount: true }
              : {}),
          },

          $addToSet: { sources: input.source },
        },
        { upsert: true },
      );
    } catch (error) {
      this.logger.warn(
        `Could not capture audience contact for ${email}: ${
          error instanceof Error
            ? error.message
            : 'Unknown error'
        }`,
      );
    }
  }

  /*
   * Everyone who should receive a new-session
   * announcement email.
   */
  async getAnnouncementRecipients() {
    const contacts = await this.contactModel
      .find({ isSubscribed: true })
      .select('name email unsubscribeToken')
      .exec();

    return contacts.map((contact) => ({
      name: contact.name || 'there',
      email: contact.email,
      unsubscribeToken: contact.unsubscribeToken,
    }));
  }

  /*
   * Public, token-based opt-out so contacts without
   * an account can still stop the emails.
   */
  async unsubscribeByToken(token: string) {
    if (!token) {
      return {
        success: false,
        message: 'This unsubscribe link is invalid.',
      };
    }

    const result = await this.contactModel.updateOne(
      { unsubscribeToken: token },
      { $set: { isSubscribed: false } },
    );

    if (!result.matchedCount) {
      return {
        success: false,
        message: 'This unsubscribe link is invalid.',
      };
    }

    return {
      success: true,
      message:
        'You have been unsubscribed from session announcements.',
    };
  }

  /*
   * Admin view of the captured audience.
   */
  async listForAdmin(search?: string) {
    const query = search?.trim()
      ? {
          $or: [
            {
              email: {
                $regex: search.trim(),
                $options: 'i',
              },
            },
            {
              name: {
                $regex: search.trim(),
                $options: 'i',
              },
            },
          ],
        }
      : {};

    const contacts = await this.contactModel
      .find(query)
      .sort({ updatedAt: -1 })
      .limit(500)
      .exec();

    const total =
      await this.contactModel.countDocuments();

    const subscribed =
      await this.contactModel.countDocuments({
        isSubscribed: true,
      });

    return {
      success: true,

      data: {
        stats: {
          total,
          subscribed,
          unsubscribed: total - subscribed,
        },

        contacts: contacts.map((contact) => ({
          _id: contact._id.toString(),
          name: contact.name,
          email: contact.email,
          phone: contact.phone,
          sources: contact.sources,
          isSubscribed: contact.isSubscribed,
          hasAccount: contact.hasAccount,
          lastSeenAt: contact.lastSeenAt,
          createdAt: (contact as any).createdAt,
        })),
      },
    };
  }

  /*
   * Mirror an account-level notification preference
   * onto the shared audience row, so turning emails
   * off in the account settings also stops the
   * announcements sent through this list.
   */
  async syncSubscriptionForEmail(
    email: string,
    isSubscribed: boolean,
  ) {
    await this.contactModel.updateOne(
      { email: email.trim().toLowerCase() },
      { $set: { isSubscribed } },
    );
  }
}
