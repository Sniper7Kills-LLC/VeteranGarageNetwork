/**
 * Form Utilities
 * Shared utility functions for form handling across the application
 */

/**
 * Convert 24-hour time format to 12-hour AM/PM format
 * @param time24 - Time string in 24-hour format (HH:mm)
 * @returns Time string in 12-hour format (h:mm AM/PM)
 */
export function formatTimeTo12Hour(time24: string): string {
  if (!time24) return '';
  const [hours, minutes] = time24.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
}

/**
 * Format time string for database storage based on event category
 * @param category - Event category (Ride, Meetup, etc.)
 * @param times - Object containing time values
 * @returns Formatted time string for storage
 */
export function formatTimeForStorage(
  category: string,
  times: {
    registration?: string;
    kickstandsUp?: string;
    start?: string;
    end?: string;
  }
): string {
  if (category === 'Ride') {
    return `Registration: ${formatTimeTo12Hour(times.registration!)} | Kickstands Up: ${formatTimeTo12Hour(times.kickstandsUp!)}`;
  } else {
    if (times.end) {
      return `${formatTimeTo12Hour(times.start!)} - ${formatTimeTo12Hour(times.end)}`;
    }
    return formatTimeTo12Hour(times.start!);
  }
}

/**
 * Parse stored time string back into form fields
 * @param timeString - Stored time string from database
 * @param category - Event category
 * @returns Object with parsed time values
 */
export function parseTimeFromStorage(
  timeString: string,
  category: string
): {
  registration?: string;
  kickstandsUp?: string;
  start?: string;
  end?: string;
} {
  if (!timeString) return {};

  if (category === 'Ride') {
    // Parse "Registration: 9:00 AM | Kickstands Up: 10:00 AM"
    const parts = timeString.split('|').map(p => p.trim());
    const registration = parts[0]?.replace('Registration:', '').trim();
    const kickstandsUp = parts[1]?.replace('Kickstands Up:', '').trim();

    return {
      registration: registration ? convertTo24Hour(registration) : undefined,
      kickstandsUp: kickstandsUp ? convertTo24Hour(kickstandsUp) : undefined,
    };
  } else {
    // Parse "9:00 AM - 5:00 PM" or "9:00 AM"
    if (timeString.includes('-')) {
      const [start, end] = timeString.split('-').map(t => t.trim());
      return {
        start: start ? convertTo24Hour(start) : undefined,
        end: end ? convertTo24Hour(end) : undefined,
      };
    } else {
      return {
        start: convertTo24Hour(timeString.trim()),
      };
    }
  }
}

/**
 * Convert 12-hour time format to 24-hour format
 * @param time12 - Time string in 12-hour format (h:mm AM/PM)
 * @returns Time string in 24-hour format (HH:mm)
 */
function convertTo24Hour(time12: string): string {
  if (!time12) return '';
  
  const [time, period] = time12.split(' ');
  const [hours, minutes] = time.split(':');
  let hour = parseInt(hours);

  if (period === 'PM' && hour !== 12) {
    hour += 12;
  } else if (period === 'AM' && hour === 12) {
    hour = 0;
  }

  return `${hour.toString().padStart(2, '0')}:${minutes}`;
}

/**
 * Validate email address format
 * @param email - Email address to validate
 * @returns True if valid, false otherwise
 */
export function validateEmail(email: string): boolean {
  if (!email) return true; // Empty is valid (optional field)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate phone number (E.164 format)
 * @param phone - Phone number to validate
 * @returns True if valid, false otherwise
 */
export function validatePhone(phone: string): boolean {
  if (!phone) return true; // Empty is valid (optional field)
  // E.164 format: +[country code][number]
  const phoneRegex = /^\+[1-9]\d{1,14}$/;
  return phoneRegex.test(phone);
}

/**
 * Common validation error messages
 */
export const ValidationMessages = {
  REQUIRED: 'This field is required',
  MIN_LENGTH: (min: number) => `Must be at least ${min} characters`,
  MAX_LENGTH: (max: number) => `Must be no more than ${max} characters`,
  INVALID_EMAIL: 'Please enter a valid email address',
  INVALID_PHONE: 'Please enter a valid phone number in international format',
  INVALID_URL: 'Please enter a valid URL',
  FUTURE_DATE: 'Date must be in the future',
  INVALID_TIME: 'Please enter a valid time',
  TIME_ORDER: 'End time must be after start time',
};
