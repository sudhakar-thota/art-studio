import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Returns today's date formatted as YYYY-MM-DD in local time
 */
export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Returns date N days from today formatted as YYYY-MM-DD
 */
export function getDateDaysFromNow(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Computes difference in full calendar days between today and target date (target - today)
 */
export function getDaysDifferenceFromToday(targetDateStr: string): number {
  const todayStr = getTodayDateString();
  const [tY, tM, tD] = todayStr.split("-").map(Number);
  const [targetY, targetM, targetD] = targetDateStr.split("-").map(Number);

  const d1 = Date.UTC(tY, tM - 1, tD);
  const d2 = Date.UTC(targetY, targetM - 1, targetD);

  const diffMs = d2 - d1;
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Validates Wall Booking constraints:
 * - date must be 7 to 90 days away
 * - wall size must be 10 to 500 sq ft
 */
export function validateWallBookingInput(
  bookingDate: string,
  wallSizeSqFt: number,
  address: string
): { isValid: boolean; error?: string } {
  if (!bookingDate) {
    return { isValid: false, error: "Booking date is required." };
  }
  const daysAway = getDaysDifferenceFromToday(bookingDate);
  if (daysAway < 7 || daysAway > 90) {
    return {
      isValid: false,
      error: `Booking date must be between 7 and 90 days away. The selected date is ${daysAway} day(s) away.`,
    };
  }

  if (typeof wallSizeSqFt !== "number" || isNaN(wallSizeSqFt) || wallSizeSqFt < 10 || wallSizeSqFt > 500) {
    return {
      isValid: false,
      error: "Wall size must be between 10 and 500 square feet.",
    };
  }

  if (!address || address.trim().length < 5) {
    return {
      isValid: false,
      error: "A valid installation address is required (at least 5 characters).",
    };
  }

  return { isValid: true };
}

/**
 * Validates Wall Booking cancellation rule:
 * Customer can cancel until 3 days before the date
 */
export function canCancelWallBooking(bookingDate: string): { canCancel: boolean; error?: string } {
  const daysUntilBooking = getDaysDifferenceFromToday(bookingDate);
  if (daysUntilBooking < 3) {
    return {
      canCancel: false,
      error: `Wall paintings can only be cancelled at least 3 days before the scheduled date. This booking is ${daysUntilBooking} day(s) away.`,
    };
  }
  return { canCancel: true };
}

/**
 * Validates Pottery Request constraints:
 * - quantity: 1 to 12
 * - neededByDate: at least 14 days away
 */
export function validatePotteryRequestInput(
  quantity: number,
  neededByDate: string,
  item: string,
  glaze: string
): { isValid: boolean; error?: string } {
  if (!item || !item.trim()) {
    return { isValid: false, error: "Please select a pottery item." };
  }

  if (!glaze || !glaze.trim()) {
    return { isValid: false, error: "Please select a glaze finish." };
  }

  if (!quantity || quantity < 1 || quantity > 12) {
    return {
      isValid: false,
      error: "Quantity must be between 1 and 12 pieces.",
    };
  }

  if (!neededByDate) {
    return { isValid: false, error: "Needed-by date is required." };
  }

  const daysAway = getDaysDifferenceFromToday(neededByDate);
  if (daysAway < 14) {
    return {
      isValid: false,
      error: `Pottery requests require at least 14 days curing and firing lead time. Selected date is ${daysAway} day(s) away.`,
    };
  }

  return { isValid: true };
}
