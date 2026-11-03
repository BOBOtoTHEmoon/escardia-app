// ============================================
// ESCARDIA - How a trip is priced from its pick-up and return times.
// Keep this in step with quote_booking in the database.
//
//  - Under 24 hours on a car with an hourly price: charged by the hour (never more than one day).
//  - Otherwise: full days, plus any extra hours at the hourly price (never more than one more day).
//  - Daily-only cars: any time past the pick-up time counts as another day.
// ============================================

export interface RentalTime {
  durationType: 'day' | 'hour';
  /** Days for a daily trip, hours for an hourly trip. */
  duration: number;
  /** Hours past the last full day (daily trips on cars with an hourly price). */
  extraHours: number;
  /** Total hours, rounded up. */
  hours: number;
  /** Car rental before fees. */
  base: number;
}

const HOUR = 60 * 60 * 1000;

export const priceRental = (start: Date, end: Date, pricePerDay: number, pricePerHour: number): RentalTime => {
  const day = Number(pricePerDay) || 0;
  const hourly = Number(pricePerHour) || 0;
  const hours = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / HOUR));

  if (hourly > 0 && hours < 24) {
    return { durationType: 'hour', duration: hours, extraHours: 0, hours, base: Math.min(hours * hourly, day || Infinity) };
  }

  let days = Math.floor(hours / 24);
  let extra = hours - days * 24;
  if (days === 0) {
    days = 1;
    extra = 0;
  }
  if (extra > 0 && hourly <= 0) {
    days += 1;
    extra = 0;
  }
  const extraCost = extra > 0 ? Math.min(extra * hourly, day) : 0;
  return { durationType: 'day', duration: days, extraHours: extra, hours, base: day * days + extraCost };
};

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

/** "3 hours", "2 days" or "2 days 4 hours". */
export const rentalLabel = (r: { duration: number; durationType: string; extraHours?: number | null }) => {
  if (r.durationType === 'hour') return plural(r.duration, 'hour');
  return r.extraHours ? `${plural(r.duration, 'day')} ${plural(r.extraHours, 'hour')}` : plural(r.duration, 'day');
};
