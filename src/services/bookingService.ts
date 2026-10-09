// ============================================
// ESCARDIA - Bookings (Supabase)
// Prices, availability and status changes are all decided by the database.
// Bookings come back in the same shape the screens already use.
// ============================================
import { supabase, friendlyError } from '../config/supabase';
import { parseDateTime } from '../utils/dateHelpers';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const fmtDate = (d: Date) => `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
const fmtTime = (d: Date) => {
  let h = d.getHours();
  const m = d.getMinutes().toString().padStart(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${m} ${ampm}`;
};

/** Database status -> the tab names the trips screens use. */
export const toLegacyStatus = (s: string): string => {
  switch (s) {
    case 'pending_payment': return 'pending';
    case 'confirmed': return 'upcoming';
    case 'ongoing': return 'ongoing';
    case 'completed':
    case 'resolved': return 'past';
    case 'disputed': return 'disputed';
    default: return 'cancelled'; // cancelled, expired
  }
};

export const BOOKING_SELECT = '*, customer:profiles!bookings_customer_id_fkey(first_name, last_name, phone, email), driver:drivers(id, name, phone, photo_url)';

/** Database row -> app shape */
export const mapBooking = (r: any) => {
  const start = new Date(r.start_at);
  const end = new Date(r.end_at);
  const snap = r.car_snapshot ?? {};
  const escorts = [
    r.legion_count > 0 ? { type: 'legion', count: r.legion_count, pricePerPerson: 0 } : null,
    r.private_count > 0 ? { type: 'private', count: r.private_count, pricePerPerson: 0 } : null,
  ].filter(Boolean);
  const customerName = [r.customer?.first_name, r.customer?.last_name].filter(Boolean).join(' ');

  return {
    id: r.id,
    code: r.code,
    userId: r.customer_id,
    vendorId: r.vendor_id,
    carId: r.car_id,
    carBrand: snap.brand ?? '',
    carModel: snap.model ?? '',
    carYear: snap.year ?? '',
    car: {
      id: r.car_id,
      brand: snap.brand ?? '',
      model: snap.model ?? '',
      year: snap.year ?? '',
      photos: snap.photo ? [snap.photo] : [],
      pricePerDay: Number(snap.pricePerDay ?? 0),
      pricePerHour: Number(snap.pricePerHour ?? 0),
      location: snap.location ?? '',
      vendorId: r.vendor_id,
      vendorName: snap.vendorName ?? '',
      vendorPhone: snap.vendorPhone ?? '',
    },
    customerName: customerName || 'Customer',
    customerPhone: r.customer?.phone ?? '',
    customerEmail: r.customer?.email ?? '',
    driver: r.driver ?? null,
    pickupLocation: r.pickup_location ?? '',
    pickupMethod: r.pickup_method,
    deliveryAddress: r.delivery_address ?? undefined,
    rideMode: r.ride_mode,
    startAt: r.start_at,
    endAt: r.end_at,
    startDate: fmtDate(start),
    endDate: fmtDate(end),
    startTime: fmtTime(start),
    stopTime: fmtTime(end),
    duration: r.duration,
    durationType: r.duration_type,
    escort: escorts.length ? escorts : null,
    escortCount: (r.legion_count ?? 0) + (r.private_count ?? 0),
    hiluxCount: r.hilux_count ?? 0,
    baseRental: Number(r.base_rental),
    deliveryFee: Number(r.delivery_fee),
    escortFee: Number(r.escort_fee),
    hiluxFee: Number(r.hilux_fee),
    serviceFee: Number(r.service_fee),
    totalPrice: Number(r.total),
    vendorAmount: Number(r.vendor_amount),
    commissionAmount: Number(r.commission_amount),
    status: toLegacyStatus(r.status),
    bookingStatus: r.status as string,
    paymentStatus: r.payment_status,
    paymentMethod: r.payment_method,
    paymentReference: r.payment_reference,
    paidAt: r.paid_at,
    completedAt: r.completed_at,
    releaseAt: r.release_at,
    releasedAt: r.released_at,
    disputeReason: r.dispute_reason,
    refundPercentage: r.refund_percent,
    refundAmount: Number(r.refund_amount ?? 0),
    cancelledAt: r.cancelled_at,
    cancelledBy: r.cancelled_by,
    rated: r.rated,
    createdAt: r.created_at,
  };
};

export type Booking = ReturnType<typeof mapBooking>;

// ---------------- Create ----------------

interface TripInput {
  tripData: {
    car: { id: string };
    pickupMethod: 'vendor' | 'delivery';
    deliveryAddress?: string;
    pickupLocation?: string;
    startDate: string;
    startTime: string;
    duration: number;
    durationType: 'day' | 'hour';
  };
  escortData?: {
    escorts?: Array<{ type: 'legion' | 'private'; count: number }> | null;
    hiluxCount?: number;
  } | null;
}

const escortCounts = (escortData: TripInput['escortData']) => {
  const list = escortData?.escorts ?? [];
  return {
    legion: list.filter((e) => e.type === 'legion').reduce((n, e) => n + (e.count || 0), 0),
    private: list.filter((e) => e.type === 'private').reduce((n, e) => n + (e.count || 0), 0),
    hilux: escortData?.hiluxCount ?? 0,
  };
};

/**
 * Creates a booking that waits 30 minutes for payment.
 * Returns the booking with the server-calculated total.
 */
export const createBookingFromTrip = async (input: TripInput): Promise<{ success: boolean; id?: string; booking?: Booking; error?: string }> => {
  try {
    const t = input.tripData;
    const start = parseDateTime(t.startDate, t.startTime);
    const counts = escortCounts(input.escortData);
    const deliveryAddress = t.pickupMethod === 'delivery' ? (t.deliveryAddress || t.pickupLocation || null) : null;

    const { data, error } = await supabase.rpc('create_booking', {
      p_car_id: t.car.id,
      p_start_at: start.toISOString(),
      p_duration: t.duration,
      p_duration_type: t.durationType,
      p_pickup_method: t.pickupMethod,
      p_delivery_address: deliveryAddress,
      p_legion: counts.legion,
      p_private: counts.private,
      p_hilux: counts.hilux,
    });
    if (error) return { success: false, error: error.message };
    return { success: true, id: data.id, booking: mapBooking(data) };
  } catch (error) {
    return { success: false, error: friendlyError(error, 'Could not create the booking') };
  }
};

/** Old flat booking objects still work (App.tsx). */
export const createBooking = async (b: any) =>
  createBookingFromTrip({
    tripData: {
      car: { id: b.carId ?? b.car?.id },
      pickupMethod: b.pickupMethod,
      deliveryAddress: b.deliveryAddress,
      pickupLocation: b.pickupLocation,
      startDate: b.startDate,
      startTime: b.startTime,
      duration: b.duration,
      durationType: b.durationType,
    },
    escortData: { escorts: b.escort ?? null, hiluxCount: b.hiluxCount ?? 0 },
  });

/** Price check before paying (same maths the database uses on create). */
export const quoteBooking = async (input: TripInput) => {
  const t = input.tripData;
  const counts = escortCounts(input.escortData);
  const { data, error } = await supabase.rpc('quote_booking', {
    p_car_id: t.car.id,
    p_duration: t.duration,
    p_duration_type: t.durationType,
    p_pickup_method: t.pickupMethod,
    p_legion: counts.legion,
    p_private: counts.private,
    p_hilux: counts.hilux,
  });
  if (error) throw new Error(error.message);
  return data as {
    baseRental: number; deliveryFee: number; escortFee: number; hiluxCount: number; hiluxFee: number;
    serviceFee: number; total: number; vendorAmount: number; commissionAmount: number; escortDays: number;
  };
};

// ---------------- Read ----------------

export const getBooking = async (bookingId: string) => {
  const { data, error } = await supabase.from('bookings').select(BOOKING_SELECT).eq('id', bookingId).maybeSingle();
  if (error || !data) return { success: false, error: 'Booking not found' };
  return { success: true, booking: mapBooking(data) };
};

export const getUserBookings = async (userId: string) => {
  const { data, error } = await supabase
    .from('bookings')
    .select(BOOKING_SELECT)
    .eq('customer_id', userId)
    .not('status', 'in', '(expired,pending_payment)')
    .order('created_at', { ascending: false });
  if (error) return { success: false, error: error.message, bookings: [] as Booking[] };
  return { success: true, bookings: (data ?? []).map(mapBooking) };
};

/** Trips tabs: 'upcoming' | 'ongoing' | 'past' | 'cancelled'. */
export const getBookingsByStatus = async (userId: string, status: 'upcoming' | 'ongoing' | 'past' | 'cancelled' | string) => {
  const res = await getUserBookings(userId);
  return { ...res, bookings: res.bookings.filter((b) => b.status === status || (status === 'past' && b.status === 'disputed')) };
};

export const getBookingsByStatusRecalculated = getBookingsByStatus;

export const getVendorBookings = async (vendorId: string) => {
  const { data, error } = await supabase
    .from('bookings')
    .select(BOOKING_SELECT)
    .eq('vendor_id', vendorId)
    .not('status', 'in', '(expired,pending_payment)')
    .order('created_at', { ascending: false });
  if (error) return { success: false, error: error.message, bookings: [] as Booking[] };
  return { success: true, bookings: (data ?? []).map(mapBooking) };
};

// ---------------- Actions ----------------

interface CancellationResult {
  success: boolean;
  refundPercentage?: number;
  refundAmount?: number;
  error?: string;
}

/** Cancel. Refund rules are applied by the database; refunds go to the customer's wallet. */
export const cancelBooking = async (bookingId: string, reason?: string): Promise<CancellationResult> => {
  const { data, error } = await supabase.rpc('cancel_booking', { p_booking_id: bookingId, p_reason: reason ?? null });
  if (error) return { success: false, error: error.message };
  return { success: true, refundPercentage: data.refund_percent ?? 100, refundAmount: Number(data.refund_amount ?? 0) };
};

/** Vendor: the car is back. Starts the 24-hour window before the money becomes withdrawable. */
export const completeTrip = async (bookingId: string) => {
  const { data, error } = await supabase.rpc('vendor_complete_trip', { p_booking_id: bookingId });
  return error ? { success: false, error: error.message } : { success: true, booking: mapBooking(data) };
};

/** Customer: something went wrong on the trip. Pauses the vendor payout until Escardia reviews it. */
export const reportProblem = async (bookingId: string, reason: string) => {
  const { data, error } = await supabase.rpc('report_problem', { p_booking_id: bookingId, p_reason: reason });
  return error ? { success: false, error: error.message } : { success: true, booking: mapBooking(data) };
};

export const assignDriver = async (bookingId: string, driverId: string) => {
  const { error } = await supabase.rpc('assign_driver', { p_booking_id: bookingId, p_driver_id: driverId });
  return error ? { success: false, error: error.message } : { success: true };
};

/** Paid trips can't be edited from the app (price and availability would change). */
export const updateBooking = async (_bookingId: string, _updatedData: any) => ({
  success: false,
  error: 'Paid trips cannot be changed in the app. Please cancel and rebook, or contact support.',
});
