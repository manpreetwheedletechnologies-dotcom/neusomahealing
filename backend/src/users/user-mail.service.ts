import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

type SessionAnnouncement = {
  sessionType: string;
  bookingDate: string;
  timeSlot: string;
  timezone: string;
  seats: number;
  price: number;
};

type Recipient = {
  name: string;
  email: string;

  /*
   * Present for audience contacts (people captured
   * from any form). Enables a one-click opt-out
   * for those without an account.
   */
  unsubscribeToken?: string;
};

@Injectable()
export class UserMailService {
  private readonly logger = new Logger(
    UserMailService.name,
  );

  constructor(
    private readonly configService: ConfigService,
  ) {}

  /*
   * Announces a newly published session to every
   * opted-in user. Best-effort by design: a mail
   * failure must never roll back slot creation,
   * so this resolves rather than throwing.
   */
  async sendNewSessionAnnouncement(
    recipients: Recipient[],
    session: SessionAnnouncement,
  ): Promise<{ sent: number; failed: number }> {
    if (!recipients.length) {
      return { sent: 0, failed: 0 };
    }

    const transporter = this.createTransport();

    if (!transporter) {
      this.logger.warn(
        'SMTP is not configured — skipping new-session announcement emails.',
      );

      return { sent: 0, failed: recipients.length };
    }

    const fromName =
      this.configService
        .get<string>('MAIL_FROM_NAME')
        ?.trim() || 'Neusoma Healing';

    const fromEmail =
      this.configService
        .get<string>('MAIL_FROM_EMAIL')
        ?.trim() ||
      this.configService
        .get<string>('SMTP_USER')
        ?.trim() ||
      '';

    const siteUrl = (
      this.configService
        .get<string>('PUBLIC_SITE_URL')
        ?.trim() || 'http://localhost:3000'
    ).replace(/\/$/, '');

    const bookingUrl = `${siteUrl}/book-session`;

    const formattedDate = this.formatDate(
      session.bookingDate,
    );

    const priceLabel =
      session.price > 0
        ? `₹${session.price}`
        : 'Free';

    let sent = 0;
    let failed = 0;

    for (const recipient of recipients) {
      try {
        await transporter.sendMail({
          from: `"${fromName}" <${fromEmail}>`,
          to: recipient.email,

          subject: `New ${session.sessionType} on ${formattedDate} | Neusoma Healing`,

          text: [
            `Hi ${recipient.name},`,
            '',
            `A new ${session.sessionType} has just been scheduled.`,
            '',
            `Date: ${formattedDate}`,
            `Time: ${session.timeSlot} (${session.timezone})`,
            `Seats: ${session.seats}`,
            `Price: ${priceLabel}`,
            '',
            `Reserve your spot: ${bookingUrl}`,
            '',
            'Neusoma Healing',
          ].join('\n'),

          html: this.buildAnnouncementHtml({
            unsubscribeUrl: recipient.unsubscribeToken
              ? `${siteUrl}/unsubscribe?token=${recipient.unsubscribeToken}`
              : undefined,
            recipientName: recipient.name,
            sessionType: session.sessionType,
            formattedDate,
            timeSlot: session.timeSlot,
            timezone: session.timezone,
            seats: session.seats,
            priceLabel,
            bookingUrl,
          }),
        });

        sent += 1;
      } catch (error) {
        failed += 1;

        this.logger.warn(
          `New-session announcement failed for ${recipient.email}: ${
            error instanceof Error
              ? error.message
              : 'Unknown error'
          }`,
        );
      }
    }

    return { sent, failed };
  }

  /* =======================================================
     HELPERS
  ======================================================= */

  private createTransport() {
    const host = this.configService
      .get<string>('SMTP_HOST')
      ?.trim();

    const portValue = Number(
      this.configService.get<string>('SMTP_PORT'),
    );

    const user = this.configService
      .get<string>('SMTP_USER')
      ?.trim();

    const pass = this.configService
      .get<string>('SMTP_PASS')
      ?.trim();

    if (
      !host ||
      !user ||
      !pass ||
      !Number.isInteger(portValue) ||
      portValue <= 0
    ) {
      return null;
    }

    const secure =
      this.configService
        .get<string>('SMTP_SECURE')
        ?.trim()
        .toLowerCase() === 'true';

    return nodemailer.createTransport({
      host,
      port: portValue,
      secure,
      auth: { user, pass },
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 15_000,
    });
  }

  private buildAnnouncementHtml(input: {
    unsubscribeUrl?: string;
    recipientName: string;
    sessionType: string;
    formattedDate: string;
    timeSlot: string;
    timezone: string;
    seats: number;
    priceLabel: string;
    bookingUrl: string;
  }) {
    const name = this.escapeHtml(
      input.recipientName,
    );

    const sessionType = this.escapeHtml(
      input.sessionType,
    );

    const timeSlot = this.escapeHtml(input.timeSlot);
    const timezone = this.escapeHtml(input.timezone);

    return `
      <div style="margin:0;padding:32px 16px;background:#f5f3ee;font-family:Arial,sans-serif;color:#1f2925;">
        <div style="max-width:620px;margin:0 auto;background:#ffffff;border:1px solid #e6e1d8;border-radius:18px;overflow:hidden;">

          <div style="padding:28px 32px;background:#103d38;color:#ffffff;">
            <div style="font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#d6b27d;">
              Neusoma Healing
            </div>

            <h1 style="margin:10px 0 0;font-size:26px;line-height:1.3;">
              A new session is open
            </h1>
          </div>

          <div style="padding:32px;">
            <p style="margin:0 0 20px;font-size:15px;line-height:1.7;">
              Hi <strong>${name}</strong>,
            </p>

            <p style="margin:0 0 28px;font-size:15px;line-height:1.7;color:#58635e;">
              A new <strong>${sessionType}</strong> has just been added to the calendar.
              Seats are limited, so reserve yours while they last.
            </p>

            <div style="background:#f8f7f3;border-radius:14px;padding:20px;">
              <p style="margin:0 0 12px;font-size:14px;">
                <strong>Session:</strong> ${sessionType}
              </p>

              <p style="margin:0 0 12px;font-size:14px;">
                <strong>Date:</strong> ${input.formattedDate}
              </p>

              <p style="margin:0 0 12px;font-size:14px;">
                <strong>Time:</strong> ${timeSlot} (${timezone})
              </p>

              <p style="margin:0 0 12px;font-size:14px;">
                <strong>Seats:</strong> ${input.seats}
              </p>

              <p style="margin:0;font-size:14px;">
                <strong>Price:</strong> ${this.escapeHtml(
                  input.priceLabel,
                )}
              </p>
            </div>

            <div style="margin-top:30px;text-align:center;">
              <a
                href="${input.bookingUrl}"
                target="_blank"
                rel="noopener noreferrer"
                style="display:inline-block;padding:14px 26px;background:#b37c43;color:#ffffff;text-decoration:none;border-radius:10px;font-size:14px;font-weight:700;"
              >
                Reserve your spot
              </a>
            </div>

            <p style="margin:26px 0 0;font-size:12px;line-height:1.7;color:#818984;">
              If the button does not work, copy and paste this link into your browser:
            </p>

            <p style="margin:8px 0 0;font-size:12px;line-height:1.7;word-break:break-all;color:#315e57;">
              ${input.bookingUrl}
            </p>
          </div>

          <div style="padding:20px 32px;border-top:1px solid #ece9e2;font-size:11px;color:#8a918d;">
            You are receiving this because you contacted or booked with Neusoma Healing.
            ${
              input.unsubscribeUrl
                ? `<a href="${input.unsubscribeUrl}" style="color:#8a918d;">Unsubscribe from session announcements</a>.`
                : 'You can turn these announcements off from your account settings.'
            }
          </div>

        </div>
      </div>
    `;
  }

  private formatDate(value: string): string {
    const [year, month, day] = value
      .split('-')
      .map(Number);

    const date = new Date(
      Date.UTC(year, month - 1, day),
    );

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return new Intl.DateTimeFormat('en-IN', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    }).format(date);
  }

  private escapeHtml(value: string): string {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}
