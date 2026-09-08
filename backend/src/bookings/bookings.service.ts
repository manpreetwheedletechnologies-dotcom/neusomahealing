import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';
import { ZoomService } from './zoom.service';
import { BookingMailService } from './booking-mail.service';

import {
  Model,
  Types,
} from 'mongoose';

import { CreateBookingDto } from './dto/create-booking.dto';

import {
  CreateBookingSlotDto,
  UpdateBookingSlotDto,
} from './dto/admin-booking.dto';

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
     CREATE BOOKING
  ======================================================= */

  async create(
    dto: CreateBookingDto,
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

  const booking =
    await this.bookingModel.create(
      {
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

        status:
          'pending',
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
          },
        );

      return {
        success: true,

        message:
          'Session slot created successfully.',

        data:
          this.serializeAdminSlot(
            slot,
            session.duration,
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

  private findActiveSession(
    settings:
      BookingSettingsDocument,
    title: string,
  ) {
    const normalized =
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
  ) {
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