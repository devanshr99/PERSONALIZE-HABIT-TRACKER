/**
 * Get local date string in YYYY-MM-DD format (no timezone bugs)
 */
export function toLocalDateString(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Parse YYYY-MM-DD back to a Date at local midnight
 */
export function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/**
 * Get today's local date string
 */
export function today(): string {
  return toLocalDateString(new Date());
}

/**
 * Get yesterday's local date string
 */
export function yesterday(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return toLocalDateString(d);
}

/**
 * Get date string N days ago
 */
export function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return toLocalDateString(d);
}

/**
 * Add N days to a date string
 */
export function addDays(dateStr: string, n: number): string {
  const d = parseLocalDate(dateStr);
  d.setDate(d.getDate() + n);
  return toLocalDateString(d);
}

/**
 * Subtract N days from a date string
 */
export function subtractDays(dateStr: string, n: number): string {
  return addDays(dateStr, -n);
}

/**
 * Compare date strings (returns negative if a < b)
 */
export function compareDates(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/**
 * Check if two dates are consecutive
 */
export function areConsecutive(earlier: string, later: string): boolean {
  return addDays(earlier, 1) === later;
}

/**
 * Get all dates in a range [start, end] inclusive
 */
export function dateRange(start: string, end: string): string[] {
  const dates: string[] = [];
  let current = start;
  while (current <= end) {
    dates.push(current);
    current = addDays(current, 1);
  }
  return dates;
}

/**
 * Get all dates in a month
 */
export function datesInMonth(year: number, month: number): string[] {
  // month is 1-indexed
  const start = `${year}-${String(month).padStart(2, '0')}-01`;
  const daysCount = new Date(year, month, 0).getDate();
  const end = `${year}-${String(month).padStart(2, '0')}-${String(daysCount).padStart(2, '0')}`;
  return dateRange(start, end);
}

/**
 * Format a date string for display
 */
export function formatDate(dateStr: string): string {
  const d = parseLocalDate(dateStr);
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Format a date string for compact display
 */
export function formatDateShort(dateStr: string): string {
  const d = parseLocalDate(dateStr);
  const t = today();
  const y = yesterday();
  if (dateStr === t) return 'Today';
  if (dateStr === y) return 'Yesterday';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * Get greeting based on time of day
 */
export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

/**
 * Format today's date for display (e.g. "Monday, September 21")
 */
export function getTodayDisplay(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Get first day of month (0=Sun, 1=Mon)
 */
export function firstDayOfMonth(year: number, month: number): number {
  return new Date(year, month - 1, 1).getDay();
}

/**
 * Get number of days in month
 */
export function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

/**
 * Get the day of week for a date (0=Sun ... 6=Sat)
 */
export function getDayOfWeek(dateStr: string): number {
  return parseLocalDate(dateStr).getDay();
}

/**
 * Format a date string month/year for display 
 */
export function formatMonthYear(year: number, month: number): string {
  return new Date(year, month - 1, 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric'
  });
}
