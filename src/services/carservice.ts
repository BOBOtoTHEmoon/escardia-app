// ============================================
// ESCARDIA - Cars (Supabase)
// Returns cars in the same shape the screens already use.
// ============================================
import { supabase, auth, friendlyError, uploadIfLocal } from '../config/supabase';

export interface CarData {
  brand: string;
  model: string;
  year: string;
  type: string;
  pricePerDay: number;
  pricePerHour: number;
  seats: number;
  doors: number;
  transmission: string;
  fuelType: string;
  location: string;
  description: string;
  photos: string[];
  vendorId: string;
  status: 'available' | 'booked' | 'maintenance';
  approvalStatus: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  isActive: boolean;
  totalBookings: number;
  totalEarnings: number;
  rating?: {
    averageOverall: number;
    totalReviews: number;
  };
  createdAt: any;
  updatedAt: any;
  approvedAt?: any;
  rejectedAt?: any;
}

export interface Car extends CarData {
  id: string;
  vendorName?: string;
}

/** Database row -> app shape */
export const mapCar = (r: any): Car => ({
  id: r.id,
  vendorId: r.vendor_id,
  brand: r.brand ?? '',
  model: r.model ?? '',
  year: r.year ?? '',
  type: r.type ?? '',
  pricePerDay: Number(r.price_per_day ?? 0),
  pricePerHour: Number(r.price_per_hour ?? 0),
  seats: r.seats ?? 0,
  doors: r.doors ?? 0,
  transmission: r.transmission ?? '',
  fuelType: r.fuel_type ?? '',
  location: r.location ?? '',
  description: r.description ?? '',
  photos: r.photos ?? [],
  status: r.status,
  approvalStatus: r.approval_status,
  rejectionReason: r.rejection_reason ?? undefined,
  isActive: r.is_active,
  totalBookings: r.total_bookings ?? 0,
  totalEarnings: 0,
  rating: { averageOverall: Number(r.rating_avg ?? 0), totalReviews: r.rating_count ?? 0 },
  createdAt: r.created_at,
  updatedAt: r.updated_at,
  approvedAt: r.approved_at,
  vendorName: r.vendors?.business_name ?? undefined,
});

/** App shape -> database columns (only the fields a vendor may set) */
const toRow = (c: Partial<CarData>) => {
  const row: Record<string, unknown> = {};
  if (c.brand !== undefined) row.brand = c.brand;
  if (c.model !== undefined) row.model = c.model;
  if (c.year !== undefined) row.year = String(c.year);
  if (c.type !== undefined) row.type = c.type;
  if (c.pricePerDay !== undefined) row.price_per_day = Number(c.pricePerDay);
  if (c.pricePerHour !== undefined) row.price_per_hour = Number(c.pricePerHour || 0);
  if (c.seats !== undefined) row.seats = Number(c.seats);
  if (c.doors !== undefined) row.doors = Number(c.doors);
  if (c.transmission !== undefined) row.transmission = c.transmission;
  if (c.fuelType !== undefined) row.fuel_type = c.fuelType;
  if (c.location !== undefined) row.location = c.location;
  if (c.description !== undefined) row.description = c.description;
  if (c.photos !== undefined) row.photos = c.photos;
  if (c.status !== undefined) row.status = c.status;
  if (c.isActive !== undefined) row.is_active = c.isActive;
  return row;
};

/** Uploads any photos still on the phone and returns their public URLs. */
export const uploadCarPhotos = async (photos: string[]): Promise<string[]> =>
  Promise.all(photos.map(async (p, i) => (await uploadIfLocal(p, 'car-photos', `car-${i + 1}`)) as string));

const LISTING = '*, vendors(business_name)';

/** Customer-facing list: the database only returns approved cars from approved vendors. */
const listCars = async (opts: { orderBy?: string; limit?: number } = {}) => {
  let q = supabase.from('cars').select(LISTING).eq('approval_status', 'approved').eq('is_active', true).eq('status', 'available');
  q = q.order(opts.orderBy ?? 'created_at', { ascending: false });
  if (opts.limit) q = q.limit(opts.limit);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []).map(mapCar);
};

// ---------------- Vendor ----------------

export const addCar = async (
  carData: Omit<CarData, 'vendorId' | 'status' | 'approvalStatus' | 'isActive' | 'totalBookings' | 'totalEarnings' | 'createdAt' | 'updatedAt'>,
  vendorId: string
): Promise<{ success: boolean; carId?: string; error?: string }> => {
  try {
    const photos = await uploadCarPhotos(carData.photos ?? []);
    const { data, error } = await supabase
      .from('cars')
      .insert({ ...toRow({ ...carData, photos }), vendor_id: vendorId, status: 'available', is_active: true })
      .select('id')
      .single();
    if (error) throw error;
    return { success: true, carId: data.id };
  } catch (error) {
    console.error('addCar error:', error);
    return { success: false, error: friendlyError(error, 'Failed to add car') };
  }
};

export const getVendorCars = async (vendorId: string): Promise<{ success: boolean; cars?: Car[]; error?: string }> => {
  const { data, error } = await supabase.from('cars').select('*').eq('vendor_id', vendorId).order('created_at', { ascending: false });
  if (error) return { success: false, error: 'Failed to load cars' };
  return { success: true, cars: (data ?? []).map(mapCar) };
};

export const getVendorCarById = async (carId: string, vendorId: string): Promise<{ success: boolean; car?: Car; error?: string }> => {
  const { data, error } = await supabase.from('cars').select('*').eq('id', carId).eq('vendor_id', vendorId).maybeSingle();
  if (error || !data) return { success: false, error: 'Car not found' };
  return { success: true, car: mapCar(data) };
};

export const updateCar = async (carId: string, updates: Partial<CarData>): Promise<{ success: boolean; error?: string }> => {
  try {
    const patch = { ...updates };
    if (patch.photos) patch.photos = await uploadCarPhotos(patch.photos);
    const { error } = await supabase.from('cars').update(toRow(patch)).eq('id', carId);
    if (error) throw error;
    return { success: true };
  } catch (error) {
    return { success: false, error: friendlyError(error, 'Failed to update car') };
  }
};

export const deleteCar = async (carId: string): Promise<{ success: boolean; error?: string }> => {
  const { error, count } = await supabase.from('cars').delete({ count: 'exact' }).eq('id', carId);
  if (error) return { success: false, error: 'Failed to delete car' };
  if (count === 0) {
    return { success: false, error: 'This car has bookings, so it cannot be deleted. Set it to inactive instead.' };
  }
  return { success: true };
};

export const updateCarStatus = async (
  carId: string,
  status: 'available' | 'booked' | 'maintenance'
): Promise<{ success: boolean; error?: string }> => {
  const { error } = await supabase.from('cars').update({ status }).eq('id', carId);
  return error ? { success: false, error: 'Failed to update status' } : { success: true };
};

// ---------------- Customer ----------------

export const getCar = async (carId: string): Promise<{ success: boolean; car?: Car; error?: string }> => {
  const { data, error } = await supabase.from('cars').select(LISTING).eq('id', carId).maybeSingle();
  if (error || !data || data.approval_status !== 'approved' || !data.is_active) {
    return { success: false, error: 'This car is no longer available' };
  }
  return { success: true, car: mapCar(data) };
};

export const getAvailableCars = async () => {
  try {
    return { success: true, cars: await listCars() };
  } catch (error) {
    return { success: false, error: 'Failed to fetch cars', cars: [] as Car[] };
  }
};

export const getAllCars = getAvailableCars;

/** Most booked cars. */
export const getPopularCars = async () => {
  try {
    return { success: true, cars: await listCars({ orderBy: 'total_bookings', limit: 10 }) };
  } catch (error) {
    return { success: false, error: friendlyError(error), cars: [] as Car[] };
  }
};

/** Highest rated cars. */
export const getFeaturedCars = async () => {
  try {
    return { success: true, cars: await listCars({ orderBy: 'rating_avg', limit: 10 }) };
  } catch (error) {
    return { success: false, error: friendlyError(error), cars: [] as Car[] };
  }
};

/** Newest cars (there is no discount system yet). */
export const getDealCars = async () => {
  try {
    return { success: true, cars: await listCars({ limit: 10 }) };
  } catch (error) {
    return { success: false, error: friendlyError(error), cars: [] as Car[] };
  }
};

/** Checks the car is free for these dates (other customers' bookings are hidden, so the server checks). */
export const checkCarAvailability = async (
  carId: string,
  start: Date,
  end: Date
): Promise<{ available: boolean; conflictStart?: string; conflictEnd?: string; message?: string }> => {
  const { data, error } = await supabase.rpc('check_car_availability', {
    p_car_id: carId,
    p_start: start.toISOString(),
    p_end: end.toISOString(),
  });
  if (error) return { available: true }; // never block a booking because of a network blip; create_booking re-checks
  return data;
};

export const currentVendorId = () => auth.currentUser?.uid ?? null;
