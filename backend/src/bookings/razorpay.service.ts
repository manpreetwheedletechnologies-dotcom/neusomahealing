import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, timingSafeEqual } from 'crypto';

type CreateOrderInput = {
  amountRupees: number;
  receipt: string;
  notes?: Record<string, string>;
};

type RazorpayOrderResult = {
  orderId: string;
  amount: number; // paise
  currency: string;
};

type RazorpayOrderResponse = {
  id?: string;
  amount?: number;
  currency?: string;
  error?: {
    description?: string;
  };
};

@Injectable()
export class RazorpayService {
  private readonly logger =
    new Logger(RazorpayService.name);

  constructor(
    private readonly configService:
      ConfigService,
  ) {}

  /* =======================================================
     CREATE ORDER
  ======================================================= */

  async createOrder(
    input: CreateOrderInput,
  ): Promise<RazorpayOrderResult> {
    const keyId =
      this.getRequiredConfig(
        'RAZORPAY_KEY_ID',
      );

    const keySecret =
      this.getRequiredConfig(
        'RAZORPAY_KEY_SECRET',
      );

    const basicAuthorization =
      Buffer.from(
        `${keyId}:${keySecret}`,
      ).toString('base64');

    /*
     * Razorpay works in paise, never
     * trust/accept an amount from the client.
     */
    const amountPaise =
      Math.round(
        input.amountRupees * 100,
      );

    const controller =
      new AbortController();

    const timeout =
      setTimeout(
        () => controller.abort(),
        10_000,
      );

    try {
      const response =
        await fetch(
          'https://api.razorpay.com/v1/orders',
          {
            method: 'POST',

            headers: {
              Authorization:
                `Basic ${basicAuthorization}`,

              'Content-Type':
                'application/json',
            },

            body: JSON.stringify({
              amount: amountPaise,
              currency: 'INR',
              receipt: input.receipt,
              notes: input.notes || {},
            }),

            signal: controller.signal,
          },
        );

      const data =
        (await response.json()) as
          RazorpayOrderResponse;

      if (
        !response.ok ||
        !data.id ||
        typeof data.amount !== 'number'
      ) {
        this.logger.error(
          `Razorpay order creation failed. Status: ${response.status}. Message: ${
            data.error?.description ||
            'Unknown Razorpay error'
          }`,
        );

        throw new ServiceUnavailableException(
          'Unable to start the payment. Please try again.',
        );
      }

      return {
        orderId: data.id,
        amount: data.amount,
        currency: data.currency || 'INR',
      };
    } catch (error) {
      if (
        error instanceof
        ServiceUnavailableException
      ) {
        throw error;
      }

      this.logger.error(
        'Unexpected Razorpay order creation error.',
        error instanceof Error
          ? error.stack
          : undefined,
      );

      throw new ServiceUnavailableException(
        'Unable to connect to the payment gateway. Please try again.',
      );
    } finally {
      clearTimeout(timeout);
    }
  }

  /* =======================================================
     VERIFY PAYMENT SIGNATURE
  ======================================================= */

  verifySignature(input: {
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
  }): boolean {
    const keySecret =
      this.getRequiredConfig(
        'RAZORPAY_KEY_SECRET',
      );

    const expectedSignature =
      createHmac('sha256', keySecret)
        .update(
          `${input.razorpayOrderId}|${input.razorpayPaymentId}`,
        )
        .digest('hex');

    const expectedBuffer =
      Buffer.from(expectedSignature, 'utf8');

    const providedBuffer =
      Buffer.from(
        input.razorpaySignature || '',
        'utf8',
      );

    if (
      expectedBuffer.length !==
      providedBuffer.length
    ) {
      return false;
    }

    return timingSafeEqual(
      expectedBuffer,
      providedBuffer,
    );
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
        'Payment service is not configured correctly.',
      );
    }

    return value;
  }
}
