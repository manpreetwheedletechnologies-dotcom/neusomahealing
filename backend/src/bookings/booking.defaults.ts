export const DEFAULT_BOOKING_SETTINGS = {
  key: 'default',
  sessionTypes: [
  {
    title: 'Discovery Call',
    duration: '20 minutes',
    bookingMode: 'individual',
    defaultCapacity: 1,
    isActive: true,
  },

  {
    title: '1:1 Coaching Session',
    duration: '60 minutes',
    bookingMode: 'individual',
    defaultCapacity: 1,
    isActive: true,
  },

  {
    title: 'Deep Transformation Session',
    duration: '90 minutes',
    bookingMode: 'individual',
    defaultCapacity: 1,
    isActive: true,
  },

  {
    title: 'Webinar',
    duration: '60 minutes',
    bookingMode: 'webinar',
    defaultCapacity: 100,
    isActive: true,
  },
],
  timeSlots: ['11:00 AM', '12:00 PM', '02:00 PM', '04:00 PM', '06:00 PM'],
  timezone: 'Asia/Kolkata',
  maxMonthsAhead: 6,
  activeWeekdays: [0, 1, 2, 3, 4, 5, 6],
} as const;
