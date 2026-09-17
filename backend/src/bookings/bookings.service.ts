import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';
import { ZoomService } from './zoom.service';
import { BookingMailService } from './booking-mail.service';
import { RazorpayService } from './razorpay.service';
import { UsersService } from '../users/users.service';
import { UserMailService } from '../users/user-mail.service';
import { AudienceService } from '../users/audience.service';

import {
  Model,
  Types,
} from 'mongoose';

import { CreateBookingDto } from './dto/create-booking.dto';
import { CreatePaymentOrderDto } from './dto/create-payment-order.dto';
import { CreateIndividualRequestDto } from './dto/create-individual-request.dto';

import {
  AssignSessionDto,
  CreateBookingSlotDto,
  UpdateBookingSlotDto,
} from './dto/admin-booking.dto';

/*
 * Session types that are pure leads — a person to
 * follow up with by call. Admin never assigns a
 * date/time for these; they stay unassigned forever.
 */
const LEAD_ONLY_SESSION_TYPES = ['discovery call'];

import {
  Booking,
  BookingDocument,
  BookingStatus,
} from './schemas/booking.schema';

import {
  BookingSettings,
  BookingSettingsDocument,
} from './schemas/booking-settings.schema';

import {
  BookingMode,
  BookingSlot,
  BookingSlotDocument,
} from './schemas/booking-slot.schema';

import { DEFAULT_BOOKING_SETTINGS } from './booking.defaults';

const OCCUPYING_STATUSES: BookingStatus[] = [
  'pending',
  'confirmed',
  'completed',
];

type PublicSlotStatus =
  | 'available'
  | 'full'
  | 'unavailable';

@Injectable()
export class BookingsService {
  private readonly logger =
    new Logger(
      BookingsService.name,
    );

  constructor(
    @InjectModel(Booking.name)
    private readonly bookingModel:
      Model<BookingDocument>,

    @InjectModel(BookingSettings.name)
    private readonly settingsModel:
      Model<BookingSettingsDocument>,

   @InjectModel(BookingSlot.name)
private readonly slotModel:
  Model<BookingSlotDocument>,

private readonly zoomService:
  ZoomService,
  private readonly bookingMailService:
  BookingMailService,
  private readonly razorpayService:
  RazorpayService,
  private readonly usersService:
  UsersService,
  private readonly userMailService:
  UserMailService,
  private readonly audienceService:
  AudienceService,
) {}

  /* =======================================================
     PUBLIC CONFIG
  ======================================================= */

  async getPublicConfig() {
    const settings =
      await this.getOrCreateSettings();

    return {
      success: true,

      data: {
        sessionTypes:
          settings.sessionTypes
            .filter(
              (item) =>
                item.isActive,
            )
            .map((item) => ({
              title:
                item.title,

              duration:
                item.duration,

              bookingMode:
                item.bookingMode ||
                'individual',

              defaultCapacity:
                item.defaultCapacity ||
                1,

              price:
                item.price || 0,

              isActive:
                item.isActive,
            })),

        /*
         * Kept for admin quick-time buttons.
         */
        timeSlots:
          settings.timeSlots,

        timezone:
          settings.timezone,

        maxMonthsAhead:
          settings.maxMonthsAhead,

        /*
         * Legacy field retained only for
         * backward compatibility.
         */
        activeWeekdays:
          settings.activeWeekdays,
      },
    };
  }

  /* =======================================================
     PUBLIC CALENDAR
  ======================================================= */

  async getCalendar(
  month: string,
  sessionType?: string,
) {
  this.validateMonth(month);

  const settings =
    await this.getOrCreateSettings();

  const currentIst =
    this.getIstNow();

  const today =
    currentIst.date;

  const maxDate =
    this.getMaximumBookingDate(
      today,
      settings.maxMonthsAhead,
    );

  /* =========================================
     SESSION FILTER
  ========================================= */

  let selectedSessionTitle:
    string | undefined;

  if (sessionType?.trim()) {
    const selectedSession =
      this.findActiveSession(
        settings,
        sessionType,
      );

    /*
     * Canonical DB title use karenge.
     *
     * Example:
     * user sends "webinar"
     * DB contains "Webinar"
     */
    selectedSessionTitle =
      selectedSession.title;
  }

  /* =========================================
     AVAILABLE SLOTS
  ========================================= */

  const query: Record<string, any> = {
    isActive: true,

    remainingSeats: {
      $gt: 0,
    },

    bookingDate: {
      $gte: today,
      $lte: maxDate,
    },
  };

  if (selectedSessionTitle) {
    query.sessionType =
      selectedSessionTitle;
  }

  const slots =
    await this.slotModel
      .find(query)
      .select(
        'bookingDate timeSlot sessionType remainingSeats',
      )
      .lean()
      .exec();

  /* =========================================
     ENABLED DATES
  ========================================= */

  const enabledDates =
    Array.from(
      new Set(
        slots
          .filter((slot) => {
            /*
             * Current requested month only.
             */
            if (
              !slot.bookingDate.startsWith(
                `${month}-`,
              )
            ) {
              return false;
            }

            /*
             * If slot belongs to today,
             * its time must still be future.
             */
            if (
              slot.bookingDate === today
            ) {
              return (
                this.parseTimeSlotToMinutes(
                  slot.timeSlot,
                ) >
                currentIst.minutes
              );
            }

            return true;
          })
          .map(
            (slot) =>
              slot.bookingDate,
          ),
      ),
    ).sort();

  return {
    success: true,

    data: {
      month,

      sessionType:
        selectedSessionTitle ||
        null,

      enabledDates,

      hasAvailability:
        enabledDates.length > 0,

      timezone:
        settings.timezone,
    },
  };
}

  /* =======================================================
     PUBLIC DATE AVAILABILITY
  ======================================================= */

 async getAvailability(
  date: string,
  sessionType?: string,
) {
    const settings =
      await this.getOrCreateSettings();

    this.validateBookingDate(
      date,
      settings.maxMonthsAhead,
    );

    const currentIst =
      this.getIstNow();

   /* =========================================
   OPTIONAL SESSION FILTER
========================================= */

let selectedSessionTitle:
  string | undefined;

if (sessionType?.trim()) {
  const selectedSession =
    this.findActiveSession(
      settings,
      sessionType,
    );

  selectedSessionTitle =
    selectedSession.title;
}

const query: Record<string, any> = {
  bookingDate: date,
  isActive: true,
};

if (selectedSessionTitle) {
  query.sessionType =
    selectedSessionTitle;
}

const storedSlots =
  await this.slotModel
    .find(query)
    .lean()
    .exec();

    const sortedSlots =
      [...storedSlots].sort(
        (a, b) =>
          this.parseTimeSlotToMinutes(
            a.timeSlot,
          ) -
          this.parseTimeSlotToMinutes(
            b.timeSlot,
          ),
      );

    const slots =
      sortedSlots.map((slot) => {
        const session =
          settings.sessionTypes.find(
            (item) =>
              item.title ===
              slot.sessionType,
          );

        let status:
          PublicSlotStatus =
          'available';

        if (
          slot.remainingSeats <= 0
        ) {
          status = 'full';
        }

        if (
          date ===
            currentIst.date &&
          this.parseTimeSlotToMinutes(
            slot.timeSlot,
          ) <=
            currentIst.minutes
        ) {
          status = 'unavailable';
        }

        const price =
          this.resolveSlotPrice(
            slot.price,
            session?.price,
          );

        return {
          id:
            slot._id.toString(),

          slotId:
            slot._id.toString(),

          sessionType:
            slot.sessionType,

          duration:
            session?.duration ||
            '',

          bookingMode:
            slot.bookingMode,

          time:
            slot.timeSlot,

          timeSlot:
            slot.timeSlot,

          capacity:
            slot.capacity,

          bookedCount:
            slot.bookedCount,

          remainingSeats:
            slot.remainingSeats,

          status,

          /*
           * Effective price for THIS slot —
           * customer-facing pages must use this,
           * not the session type's global price.
           */
          price,

          isPaid:
            price > 0,
        };
      });

    /*
     * Kept temporarily for current frontend.
     */
    const availableTimes =
      slots
        .filter(
          (slot) =>
            slot.status ===
            'available',
        )
        .map(
          (slot) =>
            slot.timeSlot,
        );

    const availableSessionTypes =
      Array.from(
        new Set(
          slots
            .filter(
              (slot) =>
                slot.status ===
                'available',
            )
            .map(
              (slot) =>
                slot.sessionType,
            ),
        ),
      );

    return {
      success: true,

      data: {
        date,
        slots,
        availableTimes,
        availableSessionTypes,

        timezone:
          settings.timezone,
      },
    };
  }

  /* =======================================================
     CREATE PAYMENT ORDER
  ======================================================= */

  async createPaymentOrder(
    dto: CreatePaymentOrderDto,
  ) {
    const settings =
      await this.getOrCreateSettings();

    const activeSession =
      this.findActiveSession(
        settings,
        dto.sessionType,
      );

    this.validateBookingDate(
      dto.bookingDate,
      settings.maxMonthsAhead,
    );

    const normalizedTime =
      this.normalizeSingleTime(
        dto.timeSlot,
      );

    this.validateFutureTime(
      dto.bookingDate,
      normalizedTime,
    );

    /*
     * Make sure a bookable slot actually
     * exists before charging the customer.
     *
     * Prefer an exact slotId lookup (the
     * frontend now sends this) and fall back to
     * date+time+sessionType for older clients.
     */
    const slot =
      dto.slotId &&
      Types.ObjectId.isValid(dto.slotId)
        ? await this.slotModel
            .findOne({
              _id: dto.slotId,

              isActive:
                true,

              remainingSeats: {
                $gt: 0,
              },
            })
            .exec()
        : await this.slotModel
            .findOne({
              bookingDate:
                dto.bookingDate,

              timeSlot:
                normalizedTime,

              sessionType:
                activeSession.title,

              isActive:
                true,

              remainingSeats: {
                $gt: 0,
              },
            })
            .exec();

    if (!slot) {
      throw new BadRequestException(
        'The selected session slot is no longer available.',
      );
    }

    /*
     * IMPORTANT: this specific slot's own price
     * (if the admin set one) always wins over the
     * session type's default price.
     */
    const effectivePrice =
      this.resolveSlotPrice(
        slot.price,
        activeSession.price,
      );

    if (
      !effectivePrice ||
      effectivePrice <= 0
    ) {
      throw new BadRequestException(
        'This session does not require payment.',
      );
    }

    const order =
      await this.razorpayService.createOrder(
        {
          amountRupees:
            effectivePrice,

          receipt:
            `bk_${Date.now()}_${slot._id.toString().slice(-6)}`,

          notes: {
            sessionType:
              activeSession.title,

            bookingDate:
              dto.bookingDate,

            timeSlot:
              normalizedTime,
          },
        },
      );

    return {
      success: true,

      data: {
        orderId: order.orderId,
        amount: order.amount,
        currency: order.currency,
        priceRupees: effectivePrice,
      },
    };
  }

  /* =======================================================
     CREATE BOOKING
  ======================================================= */

  async create(
    dto: CreateBookingDto,
    ownerUserId?: string,
  ) {
    const settings =
      await this.getOrCreateSettings();

    /*
     * Preferred new flow:
     *
     * frontend sends slotId.
     *
     * Legacy fallback is retained temporarily
     * until public frontend is updated.
     */
    let slot:
      BookingSlotDocument | null =
      null;

    if (dto.slotId) {
      if (
        !Types.ObjectId.isValid(
          dto.slotId,
        )
      ) {
        throw new BadRequestException(
          'Invalid booking slot.',
        );
      }

      slot =
        await this.slotModel
          .findOne({
            _id:
              dto.slotId,

            isActive:
              true,
          })
          .exec();
    } else {
      if (
        !dto.bookingDate ||
        !dto.timeSlot ||
        !dto.sessionType
      ) {
        throw new BadRequestException(
          'Please select an available session slot.',
        );
      }

      slot =
        await this.slotModel
          .findOne({
            bookingDate:
              dto.bookingDate,

            timeSlot:
              this.normalizeSingleTime(
                dto.timeSlot,
              ),

            sessionType:
              dto.sessionType,

            isActive:
              true,
          })
          .exec();
    }

    if (!slot) {
      throw new BadRequestException(
        'The selected session slot is no longer available.',
      );
    }

    this.validateBookingDate(
      slot.bookingDate,
      settings.maxMonthsAhead,
    );

    /*
     * Session itself must still be active.
     */
    const activeSession =
      settings.sessionTypes.find(
        (item) =>
          item.isActive &&
          item.title ===
            slot!.sessionType,
      );

    if (!activeSession) {
      throw new BadRequestException(
        'The selected session type is no longer available.',
      );
    }

    /*
     * IMPORTANT: this specific slot's own price
     * (if the admin set one) always wins over the
     * session type's default price. This is the
     * single source of truth used for the payment
     * check below AND for the amount persisted on
     * the booking record.
     */
    const effectivePrice =
      this.resolveSlotPrice(
        slot.price,
        activeSession.price,
      );

    /*
     * PAYMENT VERIFICATION
     *
     * Sessions with price > 0 must arrive
     * with a Razorpay payment already made
     * for this exact order. We verify the
     * HMAC signature ourselves — the client
     * cannot forge this without the secret.
     *
     * This runs BEFORE the seat is reserved
     * so an invalid/forged payment never
     * holds up a seat.
     */
    if (
      effectivePrice &&
      effectivePrice > 0
    ) {
      if (
        !dto.razorpayOrderId ||
        !dto.razorpayPaymentId ||
        !dto.razorpaySignature
      ) {
        throw new BadRequestException(
          'Payment is required for this session.',
        );
      }

      const isSignatureValid =
        this.razorpayService.verifySignature(
          {
            razorpayOrderId:
              dto.razorpayOrderId,

            razorpayPaymentId:
              dto.razorpayPaymentId,

            razorpaySignature:
              dto.razorpaySignature,
          },
        );

      if (!isSignatureValid) {
        throw new BadRequestException(
          'We could not verify your payment. Please try again or contact support.',
        );
      }
    }

    /*
     * Don't allow booking a time that has
     * already passed today.
     */
    const currentIst =
      this.getIstNow();

    if (
      slot.bookingDate ===
        currentIst.date &&
      this.parseTimeSlotToMinutes(
        slot.timeSlot,
      ) <=
        currentIst.minutes
    ) {
      throw new BadRequestException(
        'This session time has already passed.',
      );
    }

    const email =
      dto.email
        .trim()
        .toLowerCase();

    /*
     * One person/email should not actively
     * register twice for the same session.
     */
    const activeRegistrationKey =
      `${slot._id.toString()}|${email}`;

    const alreadyRegistered =
      await this.bookingModel.exists({
        activeRegistrationKey,

        status: {
          $in: OCCUPYING_STATUSES,
        },
      });

    if (alreadyRegistered) {
      throw new ConflictException(
        'You are already registered for this session.',
      );
    }

    /*
     * IMPORTANT:
     *
     * Atomic seat reservation.
     *
     * Individual:
     * 1 -> 0
     *
     * Webinar:
     * 100 -> 99 -> 98...
     */
    const reservedSlot =
      await this.slotModel
        .findOneAndUpdate(
          {
            _id:
              slot._id,

            isActive:
              true,

            remainingSeats: {
              $gt: 0,
            },
          },
          {
            $inc: {
              remainingSeats:
                -1,

              bookedCount:
                1,
            },
          },
          {
            new:
              true,
          },
        )
        .exec();

    if (!reservedSlot) {
      throw new ConflictException(
        slot.bookingMode ===
          'webinar'
          ? 'This webinar has reached its booking capacity.'
          : 'This session has already been booked. Please choose another available session.',
      );
    }

   try {
  /*
   * Ensure exactly one Zoom meeting exists
   * for this BookingSlot.
   *
   * Individual:
   * one slot -> one Zoom meeting
   *
   * Webinar:
   * many bookings -> same Zoom meeting
   */
  const zoomMeeting =
    await this.ensureZoomMeetingForSlot(
      reservedSlot,
      activeSession.duration,
      settings.timezone,
    );

  await this.audienceService.capture({
    email,
    name: dto.name,
    phone: dto.phone,
    source: 'booking',
    hasAccount: !!ownerUserId,
  });

  const booking =
    await this.bookingModel.create(
      {
        userId:
          ownerUserId
            ? new Types.ObjectId(
                ownerUserId,
              )
            : undefined,

        name:
          dto.name,

        email,

        phone:
          dto.phone ||
          undefined,

        /*
         * Always trust DB slot,
         * not browser-supplied session data.
         */
        sessionType:
          slot.sessionType,

        bookingDate:
          slot.bookingDate,

        timeSlot:
          slot.timeSlot,

        slotId:
          slot._id,

        bookingMode:
          slot.bookingMode,

        /*
         * Snapshot Zoom details on booking.
         *
         * Admin dashboard will read these
         * directly from booking record.
         */
        zoomMeetingId:
          zoomMeeting.meetingId,

        zoomJoinUrl:
          zoomMeeting.joinUrl,
          emailStatus:'pending',

        message:
          dto.message ||
          undefined,

        activeRegistrationKey,

        /*
         * Webinars auto-confirm: the slot, capacity
         * check and Zoom meeting already exist —
         * there's nothing for an admin to review or
         * assign, unlike a 1:1 request. Leaving this
         * 'pending' was hiding the Zoom link from the
         * user's dashboard (it's only ever exposed for
         * confirmed/completed bookings) until an admin
         * manually flipped the status, which never
         * needed to happen for webinars.
         */
        status:
          slot.bookingMode === 'webinar'
            ? 'confirmed'
            : 'pending',

        paymentStatus:
          effectivePrice &&
          effectivePrice > 0
            ? 'paid'
            : 'not_required',

        amountPaid:
          effectivePrice &&
          effectivePrice > 0
            ? effectivePrice
            : undefined,

        razorpayOrderId:
          dto.razorpayOrderId ||
          undefined,

        razorpayPaymentId:
          dto.razorpayPaymentId ||
          undefined,
      },
    );


    /*
 * Booking already exists at this point.
 *
 * Email failure MUST NOT roll back
 * the booking or reserved seat.
 */
let emailStatus:
  'sent' | 'failed' =
  'sent';

try {
  await this.bookingMailService
    .sendBookingConfirmation({
      name:
        booking.name,

      email:
        booking.email,

      sessionType:
        booking.sessionType,

      bookingDate:
        booking.bookingDate,

      timeSlot:
        booking.timeSlot,

      timezone:
        settings.timezone ||
        'Asia/Kolkata',

      zoomJoinUrl:
        zoomMeeting.joinUrl,
    });

  /*
   * Do not allow a status persistence
   * failure to invalidate a real booking.
   */
  await this.bookingModel
    .updateOne(
      {
        _id:
          booking._id,
      },
      {
        $set: {
          emailStatus:
            'sent',
        },

        $unset: {
          emailLastError:
            1,
        },
      },
    )
    .exec()
    .catch(
      () =>
        undefined,
    );
} catch (emailError) {
  emailStatus =
    'failed';

  const emailErrorMessage =
    emailError instanceof Error
      ? emailError.message
      : 'Unable to send confirmation email.';

  await this.bookingModel
    .updateOne(
      {
        _id:
          booking._id,
      },
      {
        $set: {
          emailStatus:
            'failed',

          emailLastError:
            emailErrorMessage.slice(
              0,
              1000,
            ),
        },
      },
    )
    .exec()
    .catch(
      () =>
        undefined,
    );
}

  return {
    success: true,

    message:
      slot.bookingMode ===
      'webinar'
        ? 'Your webinar registration has been submitted successfully.'
        : 'Your session has been booked successfully.',

    data: {
      id:
        booking._id.toString(),

      slotId:
        slot._id.toString(),

      sessionType:
        booking.sessionType,

      bookingMode:
        booking.bookingMode,

      bookingDate:
        booking.bookingDate,

      timeSlot:
        booking.timeSlot,

      status:
        booking.status,

      /*
       * Temporary useful response.
       *
       * Later email will also contain
       * this Zoom join URL.
       */
      zoomJoinUrl:
        booking.zoomJoinUrl,

        emailStatus,

      paymentStatus:
        booking.paymentStatus,

      amountPaid:
        booking.amountPaid,

      remainingSeats:
        reservedSlot.remainingSeats,
    },
  };
} catch (
      error: unknown
    ) {
      /*
       * Booking creation failed AFTER seat
       * reservation, so safely return seat.
       */
      await this.slotModel
        .updateOne(
          {
            _id:
              slot._id,

            bookedCount: {
              $gt: 0,
            },
          },
          {
            $inc: {
              remainingSeats:
                1,

              bookedCount:
                -1,
            },
          },
        )
        .exec();

      if (
        this.isDuplicateKeyError(
          error,
        )
      ) {
        throw new ConflictException(
          'You are already registered for this session.',
        );
      }

      throw error;
    }
  }

  /* =======================================================
     PUBLIC — INDIVIDUAL REQUEST (NO FIXED SLOT)

     Used by Discovery Call, 1:1 Coaching and
     Deep Transformation forms. No BookingSlot is
     touched here — this just records the request.
     Admin assigns the real date/time afterwards
     (see assignSession below), except for Discovery
     Call, which always stays a lead.
  ======================================================= */

  /* =======================================================
     USER ACCOUNT — MY SESSIONS & PAYMENTS

     Everything a signed-in visitor sees on their own
     dashboard. Scoped by userId, with a fallback on
     email so bookings made before the user registered
     (or while signed out) still show up under their
     account.
  ======================================================= */

  async getMyAccountOverview(user: {
    id: string;
    email: string;
  }) {
    const bookings = await this.bookingModel
      .find({
        $or: [
          { userId: new Types.ObjectId(user.id) },
          { email: user.email.toLowerCase() },
        ],
      })
      .sort({ createdAt: -1 })
      .exec();

    const settings =
      await this.getOrCreateSettings();

    const todayKey = this.getTodayKey(
      settings.timezone,
    );

    const nowMinutes = this.getNowMinutesInTimezone(
      settings.timezone,
    );

    const serialized = bookings.map((booking) =>
      this.serializeMyBooking(booking),
    );

    /*
     * A booking is "in the past" once its date has
     * gone by, OR it's today and the time slot has
     * already started — a 12:00 PM webinar shouldn't
     * still show as upcoming at 3:00 PM the same day.
     */
    const hasBookingTimePassed = (booking: {
      bookingDate?: string;
      timeSlot?: string;
    }) => {
      if (!booking.bookingDate) return false;
      if (booking.bookingDate < todayKey) return true;
      if (booking.bookingDate > todayKey) return false;

      // Same day — compare times. No time slot
      // recorded (rare) is treated as not yet passed.
      if (!booking.timeSlot) return false;

      return (
        this.parseTimeSlotToMinutes(
          booking.timeSlot,
        ) <= nowMinutes
      );
    };

    /*
     * "Upcoming" means confirmed-or-pending with a
     * real assigned date/time that hasn't passed yet.
     * Leads awaiting an admin date land in
     * `awaitingSchedule` instead of silently
     * disappearing.
     */
    const upcoming = serialized.filter(
      (booking) =>
        booking.status !== 'cancelled' &&
        booking.status !== 'completed' &&
        !!booking.bookingDate &&
        !hasBookingTimePassed(booking),
    );

    const awaitingSchedule = serialized.filter(
      (booking) =>
        booking.status !== 'cancelled' &&
        booking.isAssigned === false &&
        !booking.bookingDate,
    );

    const past = serialized.filter(
      (booking) =>
        booking.status === 'completed' ||
        (!!booking.bookingDate &&
          hasBookingTimePassed(booking)),
    );

    /*
     * The query above sorts by createdAt for a
     * sensible default, but "next session" only
     * makes sense sorted by when it's actually
     * happening — otherwise whichever booking was
     * made most recently would jump to the top even
     * if a different one is happening sooner.
     */
    const byWhenItsHappening = (
      a: { bookingDate?: string; timeSlot?: string },
      b: { bookingDate?: string; timeSlot?: string },
    ) => {
      const dateCompare = (
        a.bookingDate || ''
      ).localeCompare(b.bookingDate || '');

      if (dateCompare !== 0) return dateCompare;

      return (
        this.parseTimeSlotToMinutes(
          a.timeSlot || '',
        ) -
        this.parseTimeSlotToMinutes(
          b.timeSlot || '',
        )
      );
    };

    upcoming.sort(byWhenItsHappening);
    past.sort(
      (a, b) => -byWhenItsHappening(a, b),
    );

    const payments = serialized
      .filter(
        (booking) =>
          booking.paymentStatus === 'paid' ||
          booking.paymentStatus === 'failed',
      )
      .map((booking) => ({
        _id: booking._id,
        sessionType: booking.sessionType,
        bookingDate: booking.bookingDate,
        timeSlot: booking.timeSlot,
        amountPaid: booking.amountPaid || 0,
        paymentStatus: booking.paymentStatus,
        razorpayPaymentId:
          booking.razorpayPaymentId,
        createdAt: booking.createdAt,
      }));

    const totalPaid = payments
      .filter(
        (payment) =>
          payment.paymentStatus === 'paid',
      )
      .reduce(
        (sum, payment) =>
          sum + (payment.amountPaid || 0),
        0,
      );

    return {
      success: true,

      data: {
        stats: {
          totalBookings: serialized.length,
          upcoming: upcoming.length,
          completed: serialized.filter(
            (booking) =>
              booking.status === 'completed',
          ).length,
          totalPaid,
        },

        upcoming,
        awaitingSchedule,
        past,
        payments,

        timezone: settings.timezone,
      },
    };
  }

  private serializeMyBooking(
    booking: BookingDocument,
  ) {
    return {
      _id: booking._id.toString(),
      sessionType: booking.sessionType,
      bookingDate: booking.bookingDate,
      timeSlot: booking.timeSlot,
      preferredDate: booking.preferredDate,
      preferredTimeSlot:
        booking.preferredTimeSlot,
      bookingMode: booking.bookingMode,
      status: booking.status,
      isAssigned: booking.isAssigned,
      message: booking.message,

      /*
       * Only expose the Zoom link once the session
       * is actually confirmed — a pending request
       * has nothing to join yet.
       */
      zoomJoinUrl:
        booking.status === 'confirmed' ||
        booking.status === 'completed'
          ? booking.zoomJoinUrl
          : undefined,

      paymentStatus: booking.paymentStatus,
      amountPaid: booking.amountPaid,
      razorpayPaymentId:
        booking.razorpayPaymentId,

      createdAt: (booking as any).createdAt,
    };
  }

  private getTodayKey(timezone: string) {
    try {
      return new Intl.DateTimeFormat('en-CA', {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(new Date());
    } catch {
      return new Date()
        .toISOString()
        .slice(0, 10);
    }
  }

  /*
   * Minutes since midnight, right now, in the
   * configured timezone — used to tell whether a
   * TODAY session's time slot has already passed
   * (date-only comparison isn't enough for that).
   */
  private getNowMinutesInTimezone(
    timezone: string,
  ) {
    try {
      const parts = new Intl.DateTimeFormat('en-GB', {
        timeZone: timezone,
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }).formatToParts(new Date());

      const hour = Number(
        parts.find((p) => p.type === 'hour')
          ?.value ?? '0',
      );

      const minute = Number(
        parts.find((p) => p.type === 'minute')
          ?.value ?? '0',
      );

      return hour * 60 + minute;
    } catch {
      const now = new Date();
      return (
        now.getHours() * 60 + now.getMinutes()
      );
    }
  }

  async createIndividualRequestBooking(
    dto: CreateIndividualRequestDto,
    ownerUserId?: string,
  ) {
    const settings =
      await this.getOrCreateSettings();

    const activeSession =
      this.findActiveSession(
        settings,
        dto.sessionType,
      );

    if (
      activeSession.bookingMode ===
      'webinar'
    ) {
      throw new BadRequestException(
        'Please use the webinar booking flow for this session.',
      );
    }

    const email =
      dto.email.trim().toLowerCase();

    await this.audienceService.capture({
      email,
      name: dto.name,
      phone: dto.phone,
      source: 'booking',
      hasAccount: !!ownerUserId,
    });

    const booking =
      await this.bookingModel.create({
        userId: ownerUserId
          ? new Types.ObjectId(ownerUserId)
          : undefined,

        name: dto.name,
        email,
        phone: dto.phone || undefined,
        sessionType: activeSession.title,
        bookingMode: 'individual',

        preferredDate:
          dto.preferredDate || undefined,

        preferredTimeSlot:
          dto.preferredTimeSlot ||
          undefined,

        isAssigned: false,
        status: 'pending',
        paymentStatus: 'not_required',
        message: dto.message || undefined,
      });

    return {
      success: true,

      message:
        'Thank you! We have received your request. Our team will reach out shortly to confirm.',

      data: {
        id: booking._id.toString(),
        sessionType: booking.sessionType,
        preferredDate: booking.preferredDate,
        preferredTimeSlot:
          booking.preferredTimeSlot,
        status: booking.status,
      },
    };
  }

  /* =======================================================
     ADMIN — ASSIGN SESSION DATE/TIME

     Admin sets the real bookingDate/timeSlot for a
     previously-unassigned individual request (Coaching,
     Deep Transformation). This creates the Zoom meeting
     and sends the confirmation email — Discovery Call
     bookings are rejected here since they never get a
     scheduled session.
  ======================================================= */

  async assignSession(
    id: string,
    dto: AssignSessionDto,
  ) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException(
        'Invalid booking id.',
      );
    }

    const booking =
      await this.bookingModel
        .findById(id)
        .exec();

    if (!booking) {
      throw new NotFoundException(
        'Booking not found.',
      );
    }

    if (
      booking.bookingMode === 'webinar'
    ) {
      throw new BadRequestException(
        'Webinar bookings are scheduled through slot management, not here.',
      );
    }

    if (
      LEAD_ONLY_SESSION_TYPES.includes(
        booking.sessionType
          .trim()
          .toLowerCase(),
      )
    ) {
      throw new BadRequestException(
        'Discovery Call is a lead — it does not get an assigned session date.',
      );
    }

    const settings =
      await this.getOrCreateSettings();

    const activeSession =
      this.findActiveSession(
        settings,
        booking.sessionType,
      );

    const normalizedTime =
      this.normalizeSingleTime(
        dto.timeSlot,
      );

    this.validateBookingDate(
      dto.bookingDate,
      settings.maxMonthsAhead,
    );

    const currentIst = this.getIstNow();

    if (
      dto.bookingDate ===
        currentIst.date &&
      this.parseTimeSlotToMinutes(
        normalizedTime,
      ) <= currentIst.minutes
    ) {
      throw new BadRequestException(
        'Please select a future time.',
      );
    }

    const meeting =
      await this.zoomService.createMeeting(
        {
          topic:
            `Neusoma Healing - ${booking.sessionType}`,

          startTime:
            this.buildZoomStartTime(
              dto.bookingDate,
              normalizedTime,
            ),

          duration:
            this.parseSessionDuration(
              activeSession.duration,
            ),

          timezone:
            settings.timezone ||
            'Asia/Kolkata',
        },
      );

    booking.bookingDate = dto.bookingDate;
    booking.timeSlot = normalizedTime;
    booking.isAssigned = true;
    booking.status = 'confirmed';
    booking.zoomMeetingId = meeting.meetingId;
    booking.zoomJoinUrl = meeting.joinUrl;
    booking.emailStatus = 'pending';

    await booking.save();

    let emailStatus: 'sent' | 'failed' =
      'sent';

    try {
      await this.bookingMailService.sendBookingConfirmation(
        {
          name: booking.name,
          email: booking.email,
          sessionType: booking.sessionType,
          bookingDate: booking.bookingDate,
          timeSlot: booking.timeSlot,

          timezone:
            settings.timezone ||
            'Asia/Kolkata',

          zoomJoinUrl: booking.zoomJoinUrl,
        },
      );

      booking.emailStatus = 'sent';
      booking.emailLastError = undefined;
    } catch (emailError) {
      emailStatus = 'failed';

      booking.emailStatus = 'failed';

      booking.emailLastError = (
        emailError instanceof Error
          ? emailError.message
          : 'Unable to send confirmation email.'
      ).slice(0, 1000);
    }

    await booking.save();

    return {
      success: true,

      message:
        'Session assigned and confirmation email sent.',

      data: this.sanitizeBooking(
        booking.toObject(),
      ),
    };
  }

  /* =======================================================
     ADMIN — ALL BOOKINGS
  ======================================================= */

  async findAll() {
    return this.bookingModel
      .find()
      .select(
        '-activeSlotKey -activeRegistrationKey',
      )
      .sort({
        createdAt:
          -1,
      })
      .lean()
      .exec();
  }

  /* =======================================================
     ADMIN — BOOKINGS GROUPED BY SESSION TYPE -> SLOT
  ======================================================= */

  /*
   * Dashboard drill-down:
   *
   *   Session Type (e.g. "Webinar")
   *     -> its time slots (each date + time)
   *          -> everyone who registered for
   *             that exact slot, with their
   *             details + payment status.
   *
   * Also carries each slot's Zoom join link so
   * admin can join straight from here, for both
   * individual sessions AND webinars.
   */
  /* =======================================================
     ADMIN — QUICK STATS (used by dashboard overview)
  ======================================================= */

  async countStats() {
    const [total, pending] = await Promise.all([
      this.bookingModel.countDocuments().exec(),
      this.bookingModel.countDocuments({ status: 'pending' }).exec(),
    ]);

    return { total, new: pending };
  }

  async getBookingsOverview() {
    const settings =
      await this.getOrCreateSettings();

    const [
      slots,
      bookings,
    ] = await Promise.all([
      this.slotModel
        .find()
        .sort({
          bookingDate:
            1,
          timeSlot:
            1,
        })
        .lean()
        .exec(),

      this.bookingModel
        .find()
        .select(
          'name email phone slotId sessionType bookingDate timeSlot status paymentStatus amountPaid message createdAt',
        )
        .sort({
          createdAt:
            -1,
        })
        .lean()
        .exec() as Promise<
        Array<
          Booking & {
            _id: Types.ObjectId;
            createdAt?: Date;
          }
        >
      >,
    ]);

    /*
     * Group bookings by slotId when present.
     * Older bookings (pre-slotId) fall back to
     * a date+time+sessionType composite key so
     * they still show up under the right slot.
     */
    const bookingsBySlot =
      new Map<
        string,
        typeof bookings
      >();

    const keyFor = (
      slotId:
        unknown,
      sessionType:
        string,
      bookingDate:
        string,
      timeSlot:
        string,
    ) =>
      slotId
        ? String(slotId)
        : `${sessionType}|${bookingDate}|${timeSlot}`;

    for (
      const booking of
      bookings
    ) {
      const key =
        keyFor(
          booking.slotId,
          booking.sessionType,
          booking.bookingDate,
          booking.timeSlot,
        );

      const existing =
        bookingsBySlot.get(
          key,
        ) || [];

      existing.push(
        booking,
      );

      bookingsBySlot.set(
        key,
        existing,
      );
    }

    const sessionGroups =
      new Map<
        string,
        {
          title: string;
          bookingMode:
            'individual' | 'webinar';
          duration: string;
          slots: any[];
        }
      >();

    for (
      const slot of
      slots
    ) {
      const session =
        settings.sessionTypes.find(
          (item) =>
            item.title ===
            slot.sessionType,
        );

      const resolvedPrice =
        this.resolveSlotPrice(
          slot.price,
          session?.price,
        );

      const key =
        keyFor(
          slot._id,
          slot.sessionType,
          slot.bookingDate,
          slot.timeSlot,
        );

      const registrations = (
        bookingsBySlot.get(
          key,
        ) || []
      ).map((booking) => ({
        id: String(booking._id),
        name: booking.name,
        email: booking.email,
        phone: booking.phone,
        status: booking.status,
        paymentStatus:
          booking.paymentStatus,
        amountPaid:
          booking.amountPaid,
        message: booking.message,
        createdAt:
          booking.createdAt,
      }));

      const slotValue = {
        id: slot._id.toString(),
        bookingDate: slot.bookingDate,
        timeSlot: slot.timeSlot,
        capacity: slot.capacity,
        bookedCount: slot.bookedCount,
        remainingSeats:
          slot.remainingSeats,
        isActive: slot.isActive,
        price: resolvedPrice,
        isPaid: resolvedPrice > 0,
        zoomJoinUrl: slot.zoomJoinUrl,
        zoomMeetingId:
          slot.zoomMeetingId,
        zoomStatus: slot.zoomStatus,
        registrations,
        registrationCount:
          registrations.length,
      };

      const group =
        sessionGroups.get(
          slot.sessionType,
        );

      if (group) {
        group.slots.push(
          slotValue,
        );
      } else {
        sessionGroups.set(
          slot.sessionType,
          {
            title:
              slot.sessionType,

            bookingMode:
              slot.bookingMode,

            duration:
              session?.duration ||
              '',

            slots: [
              slotValue,
            ],
          },
        );
      }
    }

    /*
     * Bookings whose slot has since been
     * deleted still deserve to be visible
     * somewhere on the dashboard — group them
     * under their original sessionType too,
     * as a "slot" made purely from the booking
     * date/time (no live capacity data).
     */
    for (
      const [
        key,
        groupBookings,
      ] of bookingsBySlot
    ) {
      const alreadyCovered =
        slots.some(
          (slot) =>
            keyFor(
              slot._id,
              slot.sessionType,
              slot.bookingDate,
              slot.timeSlot,
            ) === key,
        );

      if (alreadyCovered) continue;

      const sample =
        groupBookings[0];

      if (!sample) continue;

      const registrations =
        groupBookings.map(
          (booking) => ({
            id: String(booking._id),
            name: booking.name,
            email: booking.email,
            phone: booking.phone,
            status: booking.status,
            paymentStatus:
              booking.paymentStatus,
            amountPaid:
              booking.amountPaid,
            message: booking.message,
            createdAt:
              booking.createdAt,
          }),
        );

      const slotValue = {
        id: key,
        bookingDate:
          sample.bookingDate,
        timeSlot:
          sample.timeSlot,
        capacity:
          registrations.length,
        bookedCount:
          registrations.length,
        remainingSeats: 0,
        isActive: false,
        price: 0,
        isPaid: false,
        zoomJoinUrl: undefined,
        zoomMeetingId: undefined,
        zoomStatus: undefined,
        registrations,
        registrationCount:
          registrations.length,
      };

      const group =
        sessionGroups.get(
          sample.sessionType,
        );

      if (group) {
        group.slots.push(
          slotValue,
        );
      } else {
        sessionGroups.set(
          sample.sessionType,
          {
            title:
              sample.sessionType,

            bookingMode:
              'individual',

            duration: '',

            slots: [
              slotValue,
            ],
          },
        );
      }
    }

    const sessionTypesOverview =
      Array.from(
        sessionGroups.values(),
      ).map((group) => ({
        ...group,

        slots:
          group.slots.sort(
            (a, b) =>
              a.bookingDate ===
              b.bookingDate
                ? a.timeSlot.localeCompare(
                    b.timeSlot,
                  )
                : a.bookingDate.localeCompare(
                    b.bookingDate,
                  ),
          ),

        totalSlots:
          group.slots.length,

        totalBookings:
          group.slots.reduce(
            (sum, slot) =>
              sum +
              slot.registrationCount,
            0,
          ),
      }));

    sessionTypesOverview.sort(
      (a, b) =>
        a.title.localeCompare(
          b.title,
        ),
    );

    return {
      success: true,

      data: {
        sessionTypes:
          sessionTypesOverview,
      },
    };
  }

  /* =======================================================
     ADMIN — UPDATE BOOKING STATUS
  ======================================================= */

  async updateStatus(
    id: string,
    status: BookingStatus,
  ) {
    if (
      !Types.ObjectId.isValid(
        id,
      )
    ) {
      throw new NotFoundException(
        'Booking not found.',
      );
    }

    const booking =
      await this.bookingModel
        .findById(id)
        .select(
          '+activeSlotKey +activeRegistrationKey',
        )
        .exec();

    if (!booking) {
      throw new NotFoundException(
        'Booking not found.',
      );
    }

    if (
      booking.status ===
      status
    ) {
      return {
        success: true,

        data:
          this.sanitizeBooking(
            booking.toObject(),
          ),
      };
    }

    /*
     * New slot-based booking.
     */
    if (booking.slotId) {
      const wasOccupying =
        OCCUPYING_STATUSES.includes(
          booking.status,
        );

      const willOccupy =
        OCCUPYING_STATUSES.includes(
          status,
        );

      /* ---------------------------------
         ACTIVE -> CANCELLED
      --------------------------------- */

      if (
        wasOccupying &&
        !willOccupy
      ) {
        const releasedSlot =
          await this.slotModel
            .findOneAndUpdate(
              {
                _id:
                  booking.slotId,

                bookedCount: {
                  $gt: 0,
                },
              },
              {
                $inc: {
                  bookedCount:
                    -1,

                  remainingSeats:
                    1,
                },
              },
              {
                new:
                  true,
              },
            )
            .exec();

        try {
          const updated =
            await this.bookingModel
              .findByIdAndUpdate(
                id,
                {
                  $set: {
                    status,
                  },

                  $unset: {
                    activeRegistrationKey:
                      1,

                    activeSlotKey:
                      1,
                  },
                },
                {
                  new:
                    true,

                  runValidators:
                    true,
                },
              )
              .select(
                '-activeSlotKey -activeRegistrationKey',
              )
              .lean()
              .exec();

          return {
            success: true,
            data:
              updated,
          };
        } catch (error) {
          /*
           * Roll back seat release if
           * booking update failed.
           */
          if (releasedSlot) {
            await this.slotModel
              .updateOne(
                {
                  _id:
                    booking.slotId,
                },
                {
                  $inc: {
                    bookedCount:
                      1,

                    remainingSeats:
                      -1,
                  },
                },
              )
              .exec();
          }

          throw error;
        }
      }

      /* ---------------------------------
         CANCELLED -> ACTIVE
      --------------------------------- */

      if (
        !wasOccupying &&
        willOccupy
      ) {
        const slot =
          await this.slotModel
            .findById(
              booking.slotId,
            )
            .exec();

        if (
          !slot ||
          !slot.isActive
        ) {
          throw new ConflictException(
            'This session slot is no longer active.',
          );
        }

        const registrationKey =
          `${slot._id.toString()}|${booking.email.toLowerCase()}`;

        const duplicate =
          await this.bookingModel.exists({
            _id: {
              $ne:
                booking._id,
            },

            activeRegistrationKey:
              registrationKey,

            status: {
              $in:
                OCCUPYING_STATUSES,
            },
          });

        if (duplicate) {
          throw new ConflictException(
            'This customer already has an active registration for this session.',
          );
        }

        const reserved =
          await this.slotModel
            .findOneAndUpdate(
              {
                _id:
                  slot._id,

                isActive:
                  true,

                remainingSeats: {
                  $gt: 0,
                },
              },
              {
                $inc: {
                  bookedCount:
                    1,

                  remainingSeats:
                    -1,
                },
              },
              {
                new:
                  true,
              },
            )
            .exec();

        if (!reserved) {
          throw new ConflictException(
            slot.bookingMode ===
              'webinar'
              ? 'This webinar is already full.'
              : 'This session has already been booked.',
          );
        }

        try {
          const updated =
            await this.bookingModel
              .findByIdAndUpdate(
                id,
                {
                  $set: {
                    status,

                    activeRegistrationKey:
                      registrationKey,
                  },

                  $unset: {
                    activeSlotKey:
                      1,
                  },
                },
                {
                  new:
                    true,

                  runValidators:
                    true,
                },
              )
              .select(
                '-activeSlotKey -activeRegistrationKey',
              )
              .lean()
              .exec();

          return {
            success: true,
            data:
              updated,
          };
        } catch (error) {
          /*
           * Restore reserved seat.
           */
          await this.slotModel
            .updateOne(
              {
                _id:
                  slot._id,

                bookedCount: {
                  $gt: 0,
                },
              },
              {
                $inc: {
                  bookedCount:
                    -1,

                  remainingSeats:
                    1,
                },
              },
            )
            .exec();

          if (
            this.isDuplicateKeyError(
              error,
            )
          ) {
            throw new ConflictException(
              'This customer already has an active registration for this session.',
            );
          }

          throw error;
        }
      }

      /*
       * pending -> confirmed
       * confirmed -> completed
       * etc.
       *
       * Seat count doesn't change.
       */
      const updated =
        await this.bookingModel
          .findByIdAndUpdate(
            id,
            {
              $set: {
                status,
              },
            },
            {
              new:
                true,

              runValidators:
                true,
            },
          )
          .select(
            '-activeSlotKey -activeRegistrationKey',
          )
          .lean()
          .exec();

      return {
        success: true,
        data:
          updated,
      };
    }

    /* =====================================================
       LEGACY BOOKING SUPPORT
       ===================================================== */

    if (
      status ===
      'cancelled'
    ) {
      const updated =
        await this.bookingModel
          .findByIdAndUpdate(
            id,
            {
              $set: {
                status:
                  'cancelled',
              },

              $unset: {
                activeSlotKey:
                  1,
              },
            },
            {
              new:
                true,

              runValidators:
                true,
            },
          )
          .select(
            '-activeSlotKey -activeRegistrationKey',
          )
          .lean()
          .exec();

      return {
        success: true,
        data:
          updated,
      };
    }

    const activeSlotKey =
      `${booking.bookingDate}|${booking.timeSlot}`;

    try {
      const updated =
        await this.bookingModel
          .findByIdAndUpdate(
            id,
            {
              $set: {
                status,
                activeSlotKey,
              },
            },
            {
              new:
                true,

              runValidators:
                true,
            },
          )
          .select(
            '-activeSlotKey -activeRegistrationKey',
          )
          .lean()
          .exec();

      return {
        success: true,
        data:
          updated,
      };
    } catch (error) {
      if (
        this.isDuplicateKeyError(
          error,
        )
      ) {
        throw new ConflictException(
          'This time slot has already been booked by another customer.',
        );
      }

      throw error;
    }
  }

  /* =======================================================
     ADMIN — MONTH SLOT LIST
  ======================================================= */

  async getAdminSlots(
    month: string,
  ) {
    this.validateMonth(month);

    const settings =
      await this.getOrCreateSettings();

    const storedSlots =
      await this.slotModel
        .find({
          bookingDate: {
            $regex:
              `^${month}-`,
          },
        })
        .lean()
        .exec();

    const grouped =
      new Map<
        string,
        any[]
      >();

    for (
      const slot of
      storedSlots
    ) {
      const session =
        settings.sessionTypes.find(
          (item) =>
            item.title ===
            slot.sessionType,
        );

      const resolvedPrice =
        this.resolveSlotPrice(
          slot.price,
          session?.price,
        );

      const value = {
        _id:
          slot._id.toString(),

        id:
          slot._id.toString(),

        bookingDate:
          slot.bookingDate,

        timeSlot:
          slot.timeSlot,

        sessionType:
          slot.sessionType,

        duration:
          session?.duration ||
          '',

        bookingMode:
          slot.bookingMode,

        capacity:
          slot.capacity,

        bookedCount:
          slot.bookedCount,

        remainingSeats:
          slot.remainingSeats,

        isActive:
          slot.isActive,

        price:
          resolvedPrice,

        isPaid:
          resolvedPrice > 0,

        hasCustomPrice:
          slot.price !== null &&
          slot.price !== undefined,
      };

      const existing =
        grouped.get(
          slot.bookingDate,
        ) || [];

      existing.push(value);

      grouped.set(
        slot.bookingDate,
        existing,
      );
    }

    const dates =
      Array.from(
        grouped.entries(),
      )
        .map(
          ([
            bookingDate,
            dateSlots,
          ]) => {
            const sorted =
              [...dateSlots].sort(
                (a, b) =>
                  this.parseTimeSlotToMinutes(
                    a.timeSlot,
                  ) -
                  this.parseTimeSlotToMinutes(
                    b.timeSlot,
                  ),
              );

            return {
              bookingDate,

              /*
               * Compatibility with old
               * BookingsSection until Step 3.
               */
              timeSlots:
                sorted.map(
                  (slot) =>
                    slot.timeSlot,
                ),

              slots:
                sorted,

              isActive:
                sorted.some(
                  (slot) =>
                    slot.isActive,
                ),
            };
          },
        )
        .sort(
          (a, b) =>
            a.bookingDate.localeCompare(
              b.bookingDate,
            ),
        );

    return {
      success: true,

      data: {
        month,
        dates,

        timezone:
          settings.timezone,
      },
    };
  }

  /* =======================================================
     ADMIN — CREATE SLOT
  ======================================================= */

  async createAdminSlot(
    dto: CreateBookingSlotDto,
  ) {
    const settings =
      await this.getOrCreateSettings();

    this.validateBookingDate(
      dto.bookingDate,
      settings.maxMonthsAhead,
    );

    const session =
      this.findActiveSession(
        settings,
        dto.sessionType,
      );

    const timeSlot =
      this.normalizeSingleTime(
        dto.timeSlot,
      );

    this.validateFutureTime(
      dto.bookingDate,
      timeSlot,
    );

    const bookingMode =
      this.getBookingMode(
        session,
      );

    const capacity =
      bookingMode ===
      'webinar'
        ? this.resolveWebinarCapacity(
            dto.capacity,
            session.defaultCapacity,
          )
        : 1;

    /*
     * Admin can set an explicit price for this
     * exact slot. Omitted => inherits the
     * session type's default price.
     */
    const slotPrice:
      number | null =
      typeof dto.price ===
      'number'
        ? dto.price
        : null;

    try {
      const slot =
        await this.slotModel.create(
          {
            bookingDate:
              dto.bookingDate,

            timeSlot,

            sessionType:
              session.title,

            bookingMode,

            capacity,

            bookedCount:
              0,

            remainingSeats:
              capacity,

            isActive:
              true,

            price:
              slotPrice,
          },
        );

      /*
       * Webinar slots: create the Zoom meeting
       * right away instead of waiting for the
       * first booking. Every attendee who books
       * this slot later reuses the same link
       * straight from the DB.
       *
       * Best-effort only — a Zoom hiccup here
       * must not block slot creation. If it
       * fails, zoomStatus is left as 'failed'
       * and ensureZoomMeetingForSlot() will
       * transparently retry the moment someone
       * actually books this slot.
       */
      if (
        bookingMode ===
        'webinar'
      ) {
        try {
          await this.ensureZoomMeetingForSlot(
            slot,
            session.duration,
            settings.timezone,
          );
        } catch (
          zoomError
        ) {
          this.logger.warn(
            `Zoom meeting could not be pre-created for slot ${slot._id.toString()}. It will be retried on first booking. Reason: ${
              zoomError instanceof
              Error
                ? zoomError.message
                : 'Unknown error'
            }`,
          );
        }
      }

      /*
       * Re-fetch so the response (and admin
       * calendar) reflect the just-created
       * Zoom fields, not the stale in-memory
       * copy from before ensureZoomMeetingForSlot
       * mutated the DB.
       */
      const freshSlot =
        (await this.slotModel
          .findById(
            slot._id,
          )
          .exec()) ||
        slot;

      /*
       * Announce the new session to every
       * registered user — in-app notification
       * for all, email for those who haven't
       * opted out. Best-effort: announcement
       * problems must never fail slot creation.
       */
      void this.announceNewSession({
        sessionType: session.title,
        bookingDate: slot.bookingDate,
        timeSlot: slot.timeSlot,
        timezone: settings.timezone,
        seats: capacity,
        price: slotPrice,
      });

      return {
        success: true,

        message:
          'Session slot created successfully.',

        data:
          this.serializeAdminSlot(
            freshSlot,
            session.duration,
            session.price,
          ),
      };
    } catch (error) {
      if (
        this.isDuplicateKeyError(
          error,
        )
      ) {
        throw new ConflictException(
          'A session is already configured for this date and time.',
        );
      }

      throw error;
    }
  }

  /*
   * Fan-out for a newly published session: one
   * in-app notification per user, plus an email
   * to everyone who hasn't opted out.
   *
   * Intentionally swallows its own errors — the
   * caller fires this without awaiting, so an
   * unhandled rejection here would crash the
   * process rather than surface anywhere useful.
   */
  private async announceNewSession(input: {
    sessionType: string;
    bookingDate: string;
    timeSlot: string;
    timezone: string;
    seats: number;
    price: number;
  }) {
    try {
      const formattedDate =
        this.formatAnnouncementDate(
          input.bookingDate,
        );

      await this.usersService.notifyAllUsers({
        type: 'new_session',

        title: `New ${input.sessionType} on ${formattedDate}`,

        body: `${input.timeSlot} (${input.timezone}) · ${
          input.seats
        } seats · ${
          input.price > 0
            ? `₹${input.price}`
            : 'Free'
        }`,

        link: '/book-session',
      });

      /*
       * Everyone captured from any form on the site —
       * not just registered accounts — so people who
       * only ever sent an enquiry still hear about it.
       */
      const recipients =
        await this.audienceService.getAnnouncementRecipients();

      const result =
        await this.userMailService.sendNewSessionAnnouncement(
          recipients,
          input,
        );

      this.logger.log(
        `New-session announcement: ${result.sent} sent, ${result.failed} failed.`,
      );
    } catch (error) {
      this.logger.warn(
        `Could not announce the new session. Reason: ${
          error instanceof Error
            ? error.message
            : 'Unknown error'
        }`,
      );
    }
  }

  private formatAnnouncementDate(value: string) {
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
      month: 'short',
      year: 'numeric',
      timeZone: 'UTC',
    }).format(date);
  }

  /*
   * Manually (re)create the Zoom meeting for a
   * webinar slot — covers slots created before
   * eager creation existed, and gives the admin
   * a retry button instead of waiting for the
   * first booking to trigger it.
   */
  async createZoomForSlot(
    id: string,
  ) {
    if (
      !Types.ObjectId.isValid(
        id,
      )
    ) {
      throw new NotFoundException(
        'Slot not found.',
      );
    }

    const slot =
      await this.slotModel
        .findById(id)
        .exec();

    if (!slot) {
      throw new NotFoundException(
        'Slot not found.',
      );
    }

    if (
      slot.bookingMode !==
      'webinar'
    ) {
      throw new BadRequestException(
        'Zoom links are only pre-created for webinar slots — individual sessions get one when the booking is confirmed.',
      );
    }

    const settings =
      await this.getOrCreateSettings();

    const session =
      this.findActiveSession(
        settings,
        slot.sessionType,
      );

    if (
      slot.zoomStatus !==
        'scheduled' ||
      !slot.zoomJoinUrl
    ) {
      await this.ensureZoomMeetingForSlot(
        slot,
        session.duration,
        settings.timezone,
      );
    }

    const freshSlot =
      (await this.slotModel
        .findById(id)
        .exec()) || slot;

    return {
      success: true,

      message:
        freshSlot.zoomStatus ===
        'scheduled'
          ? 'Zoom meeting is ready.'
          : 'Zoom meeting could not be created. Please try again.',

      data:
        this.serializeAdminSlot(
          freshSlot,
          session.duration,
          session.price,
        ),
    };
  }

  /* =======================================================
     ADMIN — UPDATE SLOT
  ======================================================= */

  async updateAdminSlot(
    id: string,
    dto: UpdateBookingSlotDto,
  ) {
    if (
      !Types.ObjectId.isValid(
        id,
      )
    ) {
      throw new NotFoundException(
        'Booking slot not found.',
      );
    }

    const settings =
      await this.getOrCreateSettings();

    const slot =
      await this.slotModel
        .findById(id)
        .exec();

    if (!slot) {
      throw new NotFoundException(
        'Booking slot not found.',
      );
    }

    const activeBookings =
      await this.bookingModel.countDocuments(
        {
          slotId:
            slot._id,

          status: {
            $in:
              OCCUPYING_STATUSES,
          },
        },
      );

    /*
     * Use real booking count to repair any
     * accidental counter difference.
     */
    slot.bookedCount =
      activeBookings;

    const targetSession =
      dto.sessionType
        ? this.findActiveSession(
            settings,
            dto.sessionType,
          )
        : this.findActiveSession(
            settings,
            slot.sessionType,
          );

    const sessionChanged =
      targetSession.title !==
      slot.sessionType;

    if (
      sessionChanged &&
      activeBookings > 0
    ) {
      throw new ConflictException(
        'A slot with active bookings cannot change its session type. Cancel the bookings first.',
      );
    }

    const targetTime =
      dto.timeSlot
        ? this.normalizeSingleTime(
            dto.timeSlot,
          )
        : slot.timeSlot;

    if (
      targetTime !==
        slot.timeSlot &&
      activeBookings > 0
    ) {
      throw new ConflictException(
        'A slot with active bookings cannot change its time. Cancel the bookings first.',
      );
    }

    this.validateFutureTime(
      slot.bookingDate,
      targetTime,
    );

    const targetMode =
      this.getBookingMode(
        targetSession,
      );

    let targetCapacity:
      number;

    if (
      targetMode ===
      'individual'
    ) {
      if (
        activeBookings >
        1
      ) {
        throw new ConflictException(
          'This slot has multiple registrations and cannot be converted to an individual session.',
        );
      }

      targetCapacity =
        1;
    } else {
      targetCapacity =
        this.resolveWebinarCapacity(
          dto.capacity ??
            slot.capacity,

          targetSession.defaultCapacity,
        );

      if (
        targetCapacity <
        activeBookings
      ) {
        throw new ConflictException(
          `Capacity cannot be lower than the ${activeBookings} existing booking(s).`,
        );
      }
    }

    if (
      dto.isActive ===
        false &&
      activeBookings >
        0
    ) {
      throw new ConflictException(
        'A slot with active bookings cannot be disabled. Cancel the bookings first.',
      );
    }

    slot.timeSlot =
      targetTime;

    slot.sessionType =
      targetSession.title;

    slot.bookingMode =
      targetMode;

    slot.capacity =
      targetCapacity;

    slot.bookedCount =
      activeBookings;

    slot.remainingSeats =
      Math.max(
        targetCapacity -
          activeBookings,
        0,
      );

    if (
      typeof dto.isActive ===
      'boolean'
    ) {
      slot.isActive =
        dto.isActive;
    }

    /*
     * Admin explicitly changed this slot's
     * price (paid amount, or 0 for free).
     * Leave untouched when omitted.
     */
    if (
      typeof dto.price ===
      'number'
    ) {
      slot.price =
        dto.price;
    }

    try {
      await slot.save();

      return {
        success: true,

        message:
          'Session slot updated successfully.',

        data:
          this.serializeAdminSlot(
            slot,
            targetSession.duration,
            targetSession.price,
          ),
      };
    } catch (error) {
      if (
        this.isDuplicateKeyError(
          error,
        )
      ) {
        throw new ConflictException(
          'Another session already exists at this date and time.',
        );
      }

      throw error;
    }
  }

  /* =======================================================
     ADMIN — REMOVE ONE SLOT
  ======================================================= */

  async removeAdminSlot(
    id: string,
  ) {
    if (
      !Types.ObjectId.isValid(
        id,
      )
    ) {
      throw new NotFoundException(
        'Booking slot not found.',
      );
    }

    const slot =
      await this.slotModel
        .findById(id)
        .exec();

    if (!slot) {
      throw new NotFoundException(
        'Booking slot not found.',
      );
    }

    const activeBookings =
      await this.bookingModel.countDocuments(
        {
          slotId:
            slot._id,

          status: {
            $in:
              OCCUPYING_STATUSES,
          },
        },
      );

    if (
      activeBookings >
      0
    ) {
      throw new ConflictException(
        'This session has active bookings. Cancel them before deleting the slot.',
      );
    }

    await this.slotModel
      .deleteOne({
        _id:
          slot._id,
      })
      .exec();

    return {
      success: true,

      message:
        'Session slot removed successfully.',
    };
  }

  /* =======================================================
     ADMIN — CLOSE COMPLETE DATE
  ======================================================= */

  async removeDateSlots(
    date: string,
  ) {
    if (
      !this.parseDate(
        date,
      )
    ) {
      throw new BadRequestException(
        'Please provide a valid date in YYYY-MM-DD format.',
      );
    }

    const activeBookings =
      await this.bookingModel.countDocuments(
        {
          bookingDate:
            date,

          status: {
            $in:
              OCCUPYING_STATUSES,
          },
        },
      );

    if (
      activeBookings >
      0
    ) {
      throw new ConflictException(
        'This date has active bookings. Cancel those bookings before closing the date.',
      );
    }

    await this.slotModel
      .deleteMany({
        bookingDate:
          date,
      })
      .exec();

    /*
     * Also remove legacy embedded date config.
     */
    await this.settingsModel
      .updateOne(
        {
          key:
            'default',
        },
        {
          $pull: {
            dateSlots: {
              bookingDate:
                date,
            },
          },
        },
      )
      .exec();

    return {
      success: true,

      message:
        'Booking date closed successfully.',
    };
  }

  /* =======================================================
     SETTINGS + SAFE MIGRATION
  ======================================================= */

 private async getOrCreateSettings() {
  let settings =
    await this.settingsModel
      .findOne({
        key: 'default',
      })
      .exec();

  /* =====================================================
     CREATE SETTINGS IF THEY DO NOT EXIST
  ===================================================== */

  if (!settings) {
    try {
      settings =
        await this.settingsModel.create(
          DEFAULT_BOOKING_SETTINGS,
        );
    } catch (error: unknown) {
      /*
       * Two simultaneous requests can both
       * try creating the default settings.
       *
       * Because key is unique, one succeeds
       * and the other gets duplicate-key.
       */
      if (
        !this.isDuplicateKeyError(
          error,
        )
      ) {
        throw error;
      }

      settings =
        await this.settingsModel
          .findOne({
            key: 'default',
          })
          .exec();
    }
  }

  if (!settings) {
    throw new Error(
      'Unable to load booking settings.',
    );
  }

  /* =====================================================
     NORMALIZE + DEDUPLICATE SESSION TYPES
  ===================================================== */

  const uniqueSessions =
    new Map<
      string,
      {
        title: string;
        duration: string;
        bookingMode:
          | 'individual'
          | 'webinar';
        defaultCapacity: number;
        price: number;
        isActive: boolean;
      }
    >();

  for (
    const session of
    settings.sessionTypes || []
  ) {
    const title =
      session.title?.trim();

    if (!title) {
      continue;
    }

    const key =
      title.toLowerCase();

    /*
     * Ignore duplicate titles.
     *
     * Example:
     * Webinar
     * Webinar
     *
     * becomes one Webinar.
     */
    if (
      uniqueSessions.has(
        key,
      )
    ) {
      continue;
    }

    const isWebinar =
      key === 'webinar' ||
      session.bookingMode ===
        'webinar';

    const bookingMode:
      | 'individual'
      | 'webinar' =
      isWebinar
        ? 'webinar'
        : 'individual';

    let defaultCapacity =
      bookingMode ===
      'webinar'
        ? Number(
            session.defaultCapacity ||
              100,
          )
        : 1;

    if (
      !Number.isInteger(
        defaultCapacity,
      ) ||
      defaultCapacity < 1
    ) {
      defaultCapacity =
        bookingMode ===
        'webinar'
          ? 100
          : 1;
    }

    let price =
      Number(session.price || 0);

    if (
      !Number.isFinite(price) ||
      price < 0
    ) {
      price = 0;
    }

    uniqueSessions.set(
      key,
      {
        title,

        duration:
          session.duration?.trim() ||
          (bookingMode ===
          'webinar'
            ? '60 minutes'
            : ''),

        bookingMode,

        defaultCapacity,

        price,

        isActive:
          session.isActive !==
          false,
      },
    );
  }

  /* =====================================================
     ENSURE WEBINAR EXISTS
  ===================================================== */

  if (
    !uniqueSessions.has(
      'webinar',
    )
  ) {
    uniqueSessions.set(
      'webinar',
      {
        title: 'Webinar',

        duration:
          '60 minutes',

        bookingMode:
          'webinar',

        defaultCapacity:
          100,

        price: 0,

        isActive:
          true,
      },
    );
  }

  const normalizedSessions =
    Array.from(
      uniqueSessions.values(),
    );

  /* =====================================================
     UPDATE ONLY WHEN REQUIRED
  ===================================================== */

  const currentSessions =
    (
      settings.sessionTypes ||
      []
    ).map((session) => ({
      title:
        session.title?.trim(),

      duration:
        session.duration?.trim(),

      bookingMode:
        session.bookingMode ||
        'individual',

      defaultCapacity:
        session.defaultCapacity ||
        1,

      price:
        session.price || 0,

      isActive:
        session.isActive !==
        false,
    }));

  const requiresUpdate =
    JSON.stringify(
      currentSessions,
    ) !==
    JSON.stringify(
      normalizedSessions,
    );

  if (requiresUpdate) {
    /*
     * IMPORTANT:
     *
     * Do NOT call settings.save() here.
     *
     * updateOne avoids Mongoose document
     * version conflicts when multiple
     * /bookings/config requests arrive
     * simultaneously.
     */
    await this.settingsModel
      .updateOne(
        {
          key: 'default',
        },
        {
          $set: {
            sessionTypes:
              normalizedSessions,
          },
        },
      )
      .exec();
  }

  /* =====================================================
     ALWAYS RETURN FRESH SETTINGS
  ===================================================== */

  const refreshedSettings =
    await this.settingsModel
      .findOne({
        key: 'default',
      })
      .exec();

  if (!refreshedSettings) {
    throw new Error(
      'Unable to reload booking settings.',
    );
  }

  return refreshedSettings;
}

  /* =======================================================
     SESSION HELPERS
  ======================================================= */

  /*
   * PRICE RESOLUTION
   *
   * A slot's own `price` (set by admin when
   * creating/editing that specific slot) always
   * wins. If the slot has no override, we fall
   * back to the parent session type's price.
   *
   * This is what lets admin mark one specific
   * slot as paid/free independently, while every
   * other slot of the same session type keeps
   * using the session's default price.
   */
  private resolveSlotPrice(
    slotPrice:
      number | null | undefined,
    sessionPrice:
      number | null | undefined,
  ): number {
    const effective =
      slotPrice === null ||
      slotPrice === undefined
        ? Number(
            sessionPrice || 0,
          )
        : Number(slotPrice);

    if (
      !Number.isFinite(effective) ||
      effective < 0
    ) {
      return 0;
    }

    return effective;
  }

  private findActiveSession(
    settings:
      BookingSettingsDocument,
    title: string,
  ) {    const normalized =
      title
        .trim()
        .toLowerCase();

    const session =
      settings.sessionTypes.find(
        (item) =>
          item.isActive &&
          item.title
            .trim()
            .toLowerCase() ===
            normalized,
      );

    if (!session) {
      throw new BadRequestException(
        'The selected session type is not available.',
      );
    }

    return session;
  }

  private getBookingMode(
    session: {
      title: string;
      bookingMode?: BookingMode;
    },
  ): BookingMode {
    if (
      session.bookingMode ===
      'webinar'
    ) {
      return 'webinar';
    }

    if (
      session.title
        .trim()
        .toLowerCase() ===
      'webinar'
    ) {
      return 'webinar';
    }

    return 'individual';
  }

  private resolveWebinarCapacity(
    requested:
      number | undefined,
    defaultCapacity:
      number | undefined,
  ) {
    const capacity =
      requested ??
      defaultCapacity ??
      100;

    if (
      !Number.isInteger(
        capacity,
      ) ||
      capacity <
        1 ||
      capacity >
        10000
    ) {
      throw new BadRequestException(
        'Webinar capacity must be between 1 and 10000.',
      );
    }

    return capacity;
  }



  /* =======================================================
   ZOOM MEETING
======================================================= */

private async ensureZoomMeetingForSlot(
  slot: BookingSlotDocument,
  durationText: string,
  timezone: string,
): Promise<{
  meetingId: string;
  joinUrl: string;
}> {
  /*
   * Meeting already exists.
   */
  if (
    slot.zoomStatus ===
      'scheduled' &&
    slot.zoomMeetingId &&
    slot.zoomJoinUrl
  ) {
    return {
      meetingId:
        slot.zoomMeetingId,

      joinUrl:
        slot.zoomJoinUrl,
    };
  }

  /*
   * Only one request is allowed to
   * become Zoom meeting creator.
   *
   * Very important for Webinar because
   * multiple customers may book the same
   * slot at nearly the same time.
   */
  const claimedSlot =
    await this.slotModel
      .findOneAndUpdate(
        {
          _id:
            slot._id,

          $or: [
            {
              zoomStatus: {
                $exists:
                  false,
              },
            },
            {
              zoomStatus:
                'not_created',
            },
            {
              zoomStatus:
                'failed',
            },
          ],
        },
        {
          $set: {
            zoomStatus:
              'creating',
          },

          $unset: {
            zoomLastError:
              1,
          },
        },
        {
          new:
            true,
        },
      )
      .exec();

  /*
   * This request owns Zoom creation.
   */
  if (claimedSlot) {
    try {
      const meeting =
        await this.zoomService
          .createMeeting({
            topic:
              `Neusoma Healing - ${slot.sessionType}`,

            startTime:
              this.buildZoomStartTime(
                slot.bookingDate,
                slot.timeSlot,
              ),

            duration:
              this.parseSessionDuration(
                durationText,
              ),

            timezone:
              timezone ||
              'Asia/Kolkata',
          });

      /*
       * Save meeting at slot level.
       *
       * Every booking of this slot
       * will reuse this Zoom meeting.
       */
      await this.slotModel
        .updateOne(
          {
            _id:
              slot._id,
          },
          {
            $set: {
              zoomMeetingId:
                meeting.meetingId,

              zoomJoinUrl:
                meeting.joinUrl,

              zoomStatus:
                'scheduled',
            },

            $unset: {
              zoomLastError:
                1,
            },
          },
        )
        .exec();

      return meeting;
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Unable to create Zoom meeting.';

      /*
       * Do not expose Zoom credentials /
       * internal response data in DB.
       */
      await this.slotModel
        .updateOne(
          {
            _id:
              slot._id,
          },
          {
            $set: {
              zoomStatus:
                'failed',

              zoomLastError:
                errorMessage.slice(
                  0,
                  1000,
                ),
            },
          },
        )
        .exec()
        .catch(() => undefined);

      throw error;
    }
  }

  /*
   * Another booking request is currently
   * creating the Zoom meeting.
   *
   * Wait briefly and reuse its result
   * instead of creating duplicate meetings.
   */
  for (
    let attempt = 0;
    attempt < 20;
    attempt += 1
  ) {
    await new Promise<void>(
      (resolve) =>
        setTimeout(
          resolve,
          250,
        ),
    );

    const currentSlot =
      await this.slotModel
        .findById(
          slot._id,
        )
        .select(
          'zoomMeetingId zoomJoinUrl zoomStatus',
        )
        .exec();

    if (!currentSlot) {
      throw new ServiceUnavailableException(
        'The selected booking slot is no longer available.',
      );
    }

    if (
      currentSlot.zoomStatus ===
        'scheduled' &&
      currentSlot.zoomMeetingId &&
      currentSlot.zoomJoinUrl
    ) {
      return {
        meetingId:
          currentSlot.zoomMeetingId,

        joinUrl:
          currentSlot.zoomJoinUrl,
      };
    }

    if (
      currentSlot.zoomStatus ===
      'failed'
    ) {
      throw new ServiceUnavailableException(
        'Unable to create the Zoom meeting. Please try again.',
      );
    }
  }

  throw new ServiceUnavailableException(
    'The Zoom meeting is still being prepared. Please try again shortly.',
  );
}

/* =======================================================
   ZOOM START TIME
======================================================= */

private buildZoomStartTime(
  bookingDate: string,
  timeSlot: string,
): string {
  const minutes =
    this.parseTimeSlotToMinutes(
      timeSlot,
    );

  if (
    minutes ===
    Number.MAX_SAFE_INTEGER
  ) {
    throw new ServiceUnavailableException(
      'The Zoom meeting time is configured incorrectly.',
    );
  }

  const hour =
    Math.floor(
      minutes / 60,
    );

  const minute =
    minutes % 60;

  return `${bookingDate}T${String(
    hour,
  ).padStart(
    2,
    '0',
  )}:${String(
    minute,
  ).padStart(
    2,
    '0',
  )}:00`;
}

/* =======================================================
   SESSION DURATION
======================================================= */

private parseSessionDuration(
  value: string,
): number {
  const duration =
    Number.parseInt(
      String(
        value ||
        '',
      ),
      10,
    );

  if (
    !Number.isInteger(
      duration,
    ) ||
    duration <
      1 ||
    duration >
      1440
  ) {
    throw new ServiceUnavailableException(
      'The session duration is configured incorrectly.',
    );
  }

  return duration;
}


  /* =======================================================
     DATE VALIDATION
  ======================================================= */

  private validateBookingDate(
    date: string,
    maxMonthsAhead: number,
  ) {
    const parsed =
      this.parseDate(
        date,
      );

    if (!parsed) {
      throw new BadRequestException(
        'Please select a valid booking date.',
      );
    }

    const today =
      this.getIstNow().date;

    if (
      date <
      today
    ) {
      throw new BadRequestException(
        'Past dates cannot be booked.',
      );
    }

    const maxDate =
      this.getMaximumBookingDate(
        today,
        maxMonthsAhead,
      );

    if (
      date >
      maxDate
    ) {
      throw new BadRequestException(
        `Bookings can only be made up to ${maxMonthsAhead} months in advance.`,
      );
    }
  }

  private validateFutureTime(
    bookingDate:
      string,
    timeSlot:
      string,
  ) {
    const currentIst =
      this.getIstNow();

    if (
      bookingDate ===
        currentIst.date &&
      this.parseTimeSlotToMinutes(
        timeSlot,
      ) <=
        currentIst.minutes
    ) {
      throw new BadRequestException(
        'Please select a future time.',
      );
    }
  }

  private validateMonth(
    month: string,
  ) {
    const match =
      /^(\d{4})-(\d{2})$/.exec(
        month || '',
      );

    if (!match) {
      throw new BadRequestException(
        'Month must be in YYYY-MM format.',
      );
    }

    const monthNumber =
      Number(
        match[2],
      );

    if (
      monthNumber <
        1 ||
      monthNumber >
        12
    ) {
      throw new BadRequestException(
        'Please provide a valid month.',
      );
    }
  }

  private parseDate(
    date: string,
  ) {
    const match =
      /^(\d{4})-(\d{2})-(\d{2})$/.exec(
        date,
      );

    if (!match) {
      return null;
    }

    const year =
      Number(
        match[1],
      );

    const month =
      Number(
        match[2],
      );

    const day =
      Number(
        match[3],
      );

    const value =
      new Date(
        Date.UTC(
          year,
          month - 1,
          day,
        ),
      );

    if (
      value.getUTCFullYear() !==
        year ||
      value.getUTCMonth() !==
        month - 1 ||
      value.getUTCDate() !==
        day
    ) {
      return null;
    }

    return {
      weekday:
        value.getUTCDay(),
    };
  }

  /* =======================================================
     IST
  ======================================================= */

  private getIstNow() {
    const formatter =
      new Intl.DateTimeFormat(
        'en-US',
        {
          timeZone:
            'Asia/Kolkata',

          year:
            'numeric',

          month:
            '2-digit',

          day:
            '2-digit',

          hour:
            '2-digit',

          minute:
            '2-digit',

          hour12:
            false,
        },
      );

    const parts =
      formatter.formatToParts(
        new Date(),
      );

    const map =
      new Map(
        parts.map(
          (part) => [
            part.type,
            part.value,
          ],
        ),
      );

    const year =
      map.get('year')!;

    const month =
      map.get('month')!;

    const day =
      map.get('day')!;

    const hour =
      Number(
        map.get('hour') ||
          0,
      ) % 24;

    const minute =
      Number(
        map.get('minute') ||
          0,
      );

    return {
      date:
        `${year}-${month}-${day}`,

      minutes:
        hour * 60 +
        minute,
    };
  }

  private getMaximumBookingDate(
    today: string,
    monthsAhead: number,
  ) {
    const [
      year,
      month,
      day,
    ] =
      today
        .split('-')
        .map(Number);

    const value =
      new Date(
        Date.UTC(
          year,
          month - 1,
          day,
        ),
      );

    value.setUTCMonth(
      value.getUTCMonth() +
        monthsAhead,
    );

    const y =
      value.getUTCFullYear();

    const m =
      String(
        value.getUTCMonth() +
          1,
      ).padStart(
        2,
        '0',
      );

    const d =
      String(
        value.getUTCDate(),
      ).padStart(
        2,
        '0',
      );

    return `${y}-${m}-${d}`;
  }

  /* =======================================================
     TIME
  ======================================================= */

  private normalizeSingleTime(
    value: string,
  ) {
    const normalized =
      value
        .trim()
        .replace(
          /\s+/g,
          ' ',
        )
        .toUpperCase();

    if (
      !/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.test(
        normalized,
      )
    ) {
      throw new BadRequestException(
        'Time must use format such as 11:00 AM.',
      );
    }

    const minutes =
      this.parseTimeSlotToMinutes(
        normalized,
      );

    if (
      minutes ===
      Number.MAX_SAFE_INTEGER
    ) {
      throw new BadRequestException(
        'Please provide a valid time.',
      );
    }

    const match =
      /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(
        normalized,
      )!;

    const hour =
      Number(
        match[1],
      );

    if (
      hour <
        1 ||
      hour >
        12
    ) {
      throw new BadRequestException(
        'Please provide a valid time.',
      );
    }

    return `${String(
      hour,
    ).padStart(
      2,
      '0',
    )}:${match[2]} ${match[3].toUpperCase()}`;
  }

  private parseTimeSlotToMinutes(
    slot: string,
  ) {
    const match =
      /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(
        slot.trim(),
      );

    if (!match) {
      return Number.MAX_SAFE_INTEGER;
    }

    let hour =
      Number(
        match[1],
      );

    const minute =
      Number(
        match[2],
      );

    if (
      hour <
        1 ||
      hour >
        12 ||
      minute <
        0 ||
      minute >
        59
    ) {
      return Number.MAX_SAFE_INTEGER;
    }

    const meridiem =
      match[3]
        .toUpperCase();

    if (
      hour ===
      12
    ) {
      hour =
        0;
    }

    if (
      meridiem ===
      'PM'
    ) {
      hour +=
        12;
    }

    return (
      hour * 60 +
      minute
    );
  }

  /* =======================================================
     SERIALIZATION
  ======================================================= */

  private serializeAdminSlot(
    slot:
      BookingSlotDocument,
    duration:
      string,
    sessionPrice?:
      number,
  ) {
    const price =
      this.resolveSlotPrice(
        slot.price,
        sessionPrice,
      );

    return {
      _id:
        slot._id.toString(),

      id:
        slot._id.toString(),

      bookingDate:
        slot.bookingDate,

      timeSlot:
        slot.timeSlot,

      sessionType:
        slot.sessionType,

      duration,

      bookingMode:
        slot.bookingMode,

      capacity:
        slot.capacity,

      bookedCount:
        slot.bookedCount,

      remainingSeats:
        slot.remainingSeats,

      isActive:
        slot.isActive,

      /*
       * Effective price for this exact slot
       * (own override, else session default).
       */
      price,

      isPaid:
        price > 0,

      /*
       * Whether this slot has its own price
       * override, or is just inheriting the
       * session type's default price.
       */
      hasCustomPrice:
        slot.price !== null &&
        slot.price !== undefined,

      /*
       * Zoom meeting for this slot — same
       * link every attendee who books it
       * will receive. 'not_created' until
       * the first webinar booking (or the
       * eager pre-creation for webinars)
       * schedules it.
       */
      zoomStatus:
        slot.zoomStatus ||
        'not_created',

      zoomJoinUrl:
        slot.zoomJoinUrl,

      zoomMeetingId:
        slot.zoomMeetingId,

      zoomLastError:
        slot.zoomLastError,
    };
  }

  private sanitizeBooking(
    booking:
      Record<string, any>,
  ) {
    const {
      activeSlotKey,
      activeRegistrationKey,
      ...safe
    } = booking;

    return safe;
  }

  /* =======================================================
     DATABASE ERROR
  ======================================================= */

  private isDuplicateKeyError(
    error: unknown,
  ) {
    return (
      typeof error ===
        'object' &&
      error !==
        null &&
      'code' in
        error &&
      (
        error as {
          code?: number;
        }
      ).code ===
        11000
    );
  }
}