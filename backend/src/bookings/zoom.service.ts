import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

type CreateZoomMeetingInput = {
  topic: string;
  startTime: string;
  duration: number;
  timezone: string;
};

type ZoomMeetingResult = {
  meetingId: string;
  joinUrl: string;
};

type ZoomTokenResponse = {
  access_token?: string;
  expires_in?: number;
  message?: string;
  reason?: string;
};

type ZoomMeetingResponse = {
  id?: string | number;
  join_url?: string;
  code?: number;
  message?: string;
};

@Injectable()
export class ZoomService {
  private readonly logger =
    new Logger(ZoomService.name);

  private accessToken:
    | string
    | null = null;

  private tokenExpiresAt = 0;

  constructor(
    private readonly configService:
      ConfigService,
  ) {}

  /* =======================================================
     ACCESS TOKEN
  ======================================================= */

  private async getAccessToken():
    Promise<string> {
    /*
     * Reuse token while it is valid.
     *
     * 60 second buffer prevents using
     * a token that is about to expire.
     */
    if (
      this.accessToken &&
      Date.now() <
        this.tokenExpiresAt -
          60_000
    ) {
      return this.accessToken;
    }

    const accountId =
      this.getRequiredConfig(
        'ZOOM_ACCOUNT_ID',
      );

    const clientId =
      this.getRequiredConfig(
        'ZOOM_CLIENT_ID',
      );

    const clientSecret =
      this.getRequiredConfig(
        'ZOOM_CLIENT_SECRET',
      );

    const basicAuthorization =
      Buffer.from(
        `${clientId}:${clientSecret}`,
      ).toString('base64');

    const url =
      new URL(
        'https://zoom.us/oauth/token',
      );

    url.searchParams.set(
      'grant_type',
      'account_credentials',
    );

    url.searchParams.set(
      'account_id',
      accountId,
    );

    const controller =
      new AbortController();

    const timeout =
      setTimeout(
        () =>
          controller.abort(),
        10_000,
      );

    try {
      const response =
        await fetch(
          url.toString(),
          {
            method: 'POST',

            headers: {
              Authorization:
                `Basic ${basicAuthorization}`,
            },

            signal:
              controller.signal,
          },
        );

      const data =
        (await response.json()) as
          ZoomTokenResponse;

      if (
        !response.ok ||
        !data.access_token
      ) {
        this.logger.error(
          `Zoom OAuth failed. Status: ${response.status}. Message: ${
            data.reason ||
            data.message ||
            'Unknown Zoom OAuth error'
          }`,
        );

        throw new ServiceUnavailableException(
          'Unable to connect to Zoom. Please try again later.',
        );
      }

      const expiresIn =
        Number(
          data.expires_in ||
            3600,
        );

      this.accessToken =
        data.access_token;

      this.tokenExpiresAt =
        Date.now() +
        expiresIn * 1000;

      return data.access_token;
    } catch (error) {
      if (
        error instanceof
        ServiceUnavailableException
      ) {
        throw error;
      }

      this.logger.error(
        'Unable to request Zoom access token.',
        error instanceof Error
          ? error.stack
          : undefined,
      );

      throw new ServiceUnavailableException(
        'Unable to connect to Zoom. Please try again later.',
      );
    } finally {
      clearTimeout(timeout);
    }
  }

  /* =======================================================
     CREATE MEETING
  ======================================================= */

  async createMeeting(
    input: CreateZoomMeetingInput,
  ): Promise<ZoomMeetingResult> {
    const accessToken =
      await this.getAccessToken();

    const hostUserId =
      this.getRequiredConfig(
        'ZOOM_HOST_USER_ID',
      );

    const controller =
      new AbortController();

    const timeout =
      setTimeout(
        () =>
          controller.abort(),
        10_000,
      );

    try {
      const response =
        await fetch(
          `https://api.zoom.us/v2/users/${encodeURIComponent(
            hostUserId,
          )}/meetings`,
          {
            method: 'POST',

            headers: {
              Authorization:
                `Bearer ${accessToken}`,

              'Content-Type':
                'application/json',
            },

            body:
              JSON.stringify({
                topic:
                  input.topic,

                type: 2,

                start_time:
                  input.startTime,

                duration:
                  input.duration,

                timezone:
                  input.timezone,

                settings: {
                  waiting_room:
                    true,

                  join_before_host:
                    false,

                  mute_upon_entry:
                    true,
                },
              }),

            signal:
              controller.signal,
          },
        );

      const data =
        (await response.json()) as
          ZoomMeetingResponse;

      if (
        !response.ok ||
        !data.id ||
        !data.join_url
      ) {
        this.logger.error(
          `Zoom meeting creation failed. Status: ${response.status}. Zoom code: ${
            data.code ?? 'N/A'
          }. Message: ${
            data.message ||
            'Unknown Zoom error'
          }`,
        );

        this.throwZoomMeetingError(
          response.status,
        );
      }

      return {
        meetingId:
          String(data.id),

        joinUrl:
          data.join_url,
      };
    } catch (error) {
      if (
        error instanceof
        ServiceUnavailableException
      ) {
        throw error;
      }

      this.logger.error(
        'Unexpected Zoom meeting creation error.',
        error instanceof Error
          ? error.stack
          : undefined,
      );

      throw new ServiceUnavailableException(
        'Unable to create the Zoom meeting. Please try again.',
      );
    } finally {
      clearTimeout(timeout);
    }
  }

  /* =======================================================
     CONFIG
  ======================================================= */

  private getRequiredConfig(
    key: string,
  ): string {
    const value =
      this.configService
        .get<string>(key)
        ?.trim();

    if (!value) {
      this.logger.error(
        `Missing required configuration: ${key}`,
      );

      throw new ServiceUnavailableException(
        'Zoom service is not configured correctly.',
      );
    }

    return value;
  }

  /* =======================================================
     ZOOM ERROR
  ======================================================= */

  private throwZoomMeetingError(
    status: number,
  ): never {
    if (
      status === 401 ||
      status === 403
    ) {
      throw new ServiceUnavailableException(
        'Zoom authorization failed. Please contact support.',
      );
    }

    if (status === 404) {
      throw new ServiceUnavailableException(
        'Zoom host account is not configured correctly.',
      );
    }

    if (status === 429) {
      throw new ServiceUnavailableException(
        'Zoom scheduling limit has been reached. Please try again shortly.',
      );
    }

    throw new ServiceUnavailableException(
      'Unable to create the Zoom meeting. Please try again.',
    );
  }
}