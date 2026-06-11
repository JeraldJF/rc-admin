import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Parse a date-only string ("yyyy-MM-dd") into a LOCAL Date (local midnight).
// Native `new Date("2024-06-10")` parses date-only strings as UTC midnight, which
// renders as the previous day in timezones west of UTC — this avoids that shift.
// Falls back to native parsing for full timestamps (e.g. ISO strings with a time).
export function parseLocalDate(s?: string): Date | undefined {
  if (!s) return undefined;
  const [y, m, d] = s.split("-").map(Number);
  if (!y || !m || !d) {
    const dt = new Date(s);
    return isNaN(dt.getTime()) ? undefined : dt;
  }
  return new Date(y, m - 1, d);
}
