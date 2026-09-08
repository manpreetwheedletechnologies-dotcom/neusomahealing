import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

type BookingEmailInput = {
  name: string;
  email: string;
  sessionType: string;
  bookingDate: string;
  timeSlot: string;
  timezone: string;
  zoomJoinUrl: string;
};

@Injectable()
export class BookingMailService {
  private readonly logger =
    new Logger(BookingMailService.name);

  constructor(
    private readonly configService:
      ConfigService,
  ) {}

  async sendBookingConfirmation(
    input: BookingEmailInput,
  ): Promise<void> {
    const host =
      this.getRequiredConfig(
        'SMTP_HOST',
      );

    const port =
      Number(
        this.getRequiredConfig(
          'SMTP_PORT',
        ),
      );

    const secure =
      this.configService
        .get<string>(
          'SMTP_SECURE',
        )
        ?.trim()
        .toLowerCase() ===
      'true';

    const user =
      this.getRequiredConfig(
        'SMTP_USER',
      );

    const pass =
      this.getRequiredConfig(
        'SMTP_PASS',
      );

    const fromName =
      this.configService
        .get<string>(
          'MAIL_FROM_NAME',
        )
        ?.trim() ||
      'Neusoma Healing';

    const fromEmail =
      this.configService
        .get<string>(
          'MAIL_FROM_EMAIL',
        )
        ?.trim() ||
      user;

    if (
      !Number.isInteger(port) ||
      port <= 0
    ) {
      throw new ServiceUnavailableException(
        'Email service is configured incorrectly.',
      );
    }

    const transporter =
      nodemailer.createTransport({
        host,
        port,
        secure,

        auth: {
          user,
          pass,
        },

        connectionTimeout:
          10_000,

        greetingTimeout:
          10_000,

        socketTimeout:
          15_000,
      });

    const safeName =
      this.escapeHtml(
        input.name,
      );

    const safeSession =
      this.escapeHtml(
        input.sessionType,
      );

    const safeTime =
      this.escapeHtml(
        input.timeSlot,
      );

    const safeTimezone =
      this.escapeHtml(
        input.timezone,
      );

    const safeJoinUrl =
      this.escapeHtml(
        input.zoomJoinUrl,
      );

    const formattedDate =
      this.formatBookingDate(
        input.bookingDate,
      );

    try {
      await transporter.sendMail({
        from:
          `"${fromName}" <${fromEmail}>`,

        to:
          input.email,

        subject:
          `Your ${input.sessionType} is booked | Neusoma Healing`,

        text: [
          `Hi ${input.name},`,
          '',
          'Your session has been booked successfully.',
          '',
          `Session: ${input.sessionType}`,
          `Date: ${formattedDate}`,
          `Time: ${input.timeSlot}`,
          `Timezone: ${input.timezone}`,
          '',
          `Join Zoom Meeting: ${input.zoomJoinUrl}`,
          '',
          'Please keep this email for your session.',
          '',
          'Neusoma Healing',
        ].join('\n'),

        html: `
          <div style="margin:0;padding:32px 16px;background:#f5f3ee;font-family:Arial,sans-serif;color:#1f2925;">
            <div style="max-width:620px;margin:0 auto;background:#ffffff;border:1px solid #e6e1d8;border-radius:18px;overflow:hidden;">

              <div style="padding:28px 32px;background:#103d38;color:#ffffff;">
                <div style="font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#d6b27d;">
                  Neusoma Healing
                </div>

                <h1 style="margin:10px 0 0;font-size:26px;line-height:1.3;">
                  Your session is booked
                </h1>
              </div>

              <div style="padding:32px;">
                <p style="margin:0 0 20px;font-size:15px;line-height:1.7;">
                  Hi <strong>${safeName}</strong>,
                </p>

                <p style="margin:0 0 28px;font-size:15px;line-height:1.7;color:#58635e;">
                  Your session has been scheduled successfully.
                  Please find your session details below.
                </p>

                <div style="background:#f8f7f3;border-radius:14px;padding:20px;">
                  <p style="margin:0 0 12px;font-size:14px;">
                    <strong>Session:</strong>
                    ${safeSession}
                  </p>

                  <p style="margin:0 0 12px;font-size:14px;">
                    <strong>Date:</strong>
                    ${formattedDate}
                  </p>

                  <p style="margin:0 0 12px;font-size:14px;">
                    <strong>Time:</strong>
                    ${safeTime}
                  </p>

                  <p style="margin:0;font-size:14px;">
                    <strong>Timezone:</strong>
                    ${safeTimezone}
                  </p>
                </div>

                <div style="margin-top:30px;text-align:center;">
                  <a
                    href="${safeJoinUrl}"
                    target="_blank"
                    rel="noopener noreferrer"
                    style="display:inline-block;padding:14px 26px;background:#b37c43;color:#ffffff;text-decoration:none;border-radius:10px;font-size:14px;font-weight:700;"
                  >
                    Join Zoom Meeting
                  </a>
                </div>

                <p style="margin:26px 0 0;font-size:12px;line-height:1.7;color:#818984;">
                  If the button does not work, copy and paste this link into your browser:
                </p>

                <p style="margin:8px 0 0;font-size:12px;line-height:1.7;word-break:break-all;color:#315e57;">
                  ${safeJoinUrl}
                </p>
              </div>

              <div style="padding:20px 32px;border-top:1px solid #ece9e2;font-size:11px;color:#8a918d;">
                Neusoma Healing · Session Confirmation
              </div>

            </div>
          </div>
        `,
      });
    } catch (error) {
      this.logger.error(
        `Booking confirmation email failed for ${input.email}.`,
        error instanceof Error
          ? error.stack
          : undefined,
      );

      throw new ServiceUnavailableException(
        'Booking email could not be sent.',
      );
    }
  }

  private getRequiredConfig(
    key: string,
  ): string {
    const value =
      this.configService
        .get<string>(key)
        ?.trim();

    if (!value) {
      this.logger.error(
        `Missing required email configuration: ${key}`,
      );

      throw new ServiceUnavailableException(
        'Email service is not configured correctly.',
      );
    }

    return value;
  }

  private formatBookingDate(
    value: string,
  ): string {
    const [
      year,
      month,
      day,
    ] =
      value
        .split('-')
        .map(Number);

    const date =
      new Date(
        Date.UTC(
          year,
          month - 1,
          day,
        ),
      );

    if (
      Number.isNaN(
        date.getTime(),
      )
    ) {
      return value;
    }

    return new Intl.DateTimeFormat(
      'en-IN',
      {
        day:
          '2-digit',

        month:
          'long',

        year:
          'numeric',

        timeZone:
          'UTC',
      },
    ).format(date);
  }

  private escapeHtml(
    value: string,
  ): string {
    return String(
      value || '',
    )
      .replace(
        /&/g,
        '&amp;',
      )
      .replace(
        /</g,
        '&lt;',
      )
      .replace(
        />/g,
        '&gt;',
      )
      .replace(
        /"/g,
        '&quot;',
      )
      .replace(
        /'/g,
        '&#039;',
      );
  }
}