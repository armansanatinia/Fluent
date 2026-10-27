// Study days start at a reset hour (4 am by default, like Anki), so a late
// night session still counts toward the day you started it.

export const MIN = 60_000;
export const HOUR = 3_600_000;
export const DAY = 86_400_000;

const pad = (n: number) => String(n).padStart(2, '0');

/** Local calendar date 'YYYY-MM-DD' of the study day containing `ts`. */
export function dayKey(ts: number, resetHour = 4): string {
  // Local calendar date, moved back a day before the reset hour. (Subtracting
  // hours instead would drift by one hour on daylight-saving days.)
  const d = new Date(ts);
  if (d.getHours() < resetHour) d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Timestamp where the study day `key` begins (local time). */
export function keyStart(key: string, resetHour = 4): number {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d, resetHour, 0, 0, 0).getTime();
}

/** Timestamp where the study day after the one containing `ts` begins. */
export function nextDayStart(ts: number, resetHour = 4): number {
  return keyStart(addDays(dayKey(ts, resetHour), 1), resetHour);
}

export function addDays(key: string, n: number): string {
  const [y, m, d] = key.split('-').map(Number);
  const dt = new Date(y, m - 1, d + n, 12);
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`;
}

/** 0 = Sunday … 6 = Saturday. */
export function weekday(key: string): number {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d, 12).getDay();
}

/** Whole days from a to b (b − a). */
export function daysBetween(a: string, b: string): number {
  const [y1, m1, d1] = a.split('-').map(Number);
  const [y2, m2, d2] = b.split('-').map(Number);
  return Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / DAY);
}

export function formatInterval(ms: number): string {
  if (ms < HOUR) return `${Math.max(1, Math.round(ms / MIN))}m`;
  if (ms < DAY) return `${Math.round(ms / HOUR)}h`;
  const days = ms / DAY;
  if (days < 30) return `${Math.round(days)}d`;
  if (days < 365) return `${+(days / 30.4).toFixed(1)}mo`;
  return `${+(days / 365).toFixed(1)}y`;
}

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export function prettyDate(key: string): string {
  const [y, m, d] = key.split('-').map(Number);
  const dt = new Date(y, m - 1, d, 12);
  return `${WEEKDAYS[dt.getDay()]}, ${MONTHS[m - 1]} ${d}`;
}

export const weekdayName = (i: number) => WEEKDAYS[i];
