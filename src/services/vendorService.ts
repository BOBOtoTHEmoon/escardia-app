// ============================================
// ESCARDIA - Vendor data (Supabase)
// Dashboard numbers, drivers, withdrawals and documents for the signed-in vendor.
// Money never moves from here: withdrawals go through request_withdrawal on the server.
// ============================================
import { supabase, auth, friendlyError, uploadImage, getPrivateFileUrl } from '../config/supabase';

const me = () => auth.currentUser?.uid ?? null;

// ---------------- Dashboard ----------------

export interface VendorStats {
  totalCars: number;
  approvedCars: number;
  pendingCars: number;
  totalBookings: number;
  activeBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  totalEarnings: number;
  available: number;
  pending: number;
  averageRating: number;
  totalReviews: number;
}

export const EMPTY_STATS: VendorStats = {
  totalCars: 0,
  approvedCars: 0,
  pendingCars: 0,
  totalBookings: 0,
  activeBookings: 0,
  completedBookings: 0,
  cancelledBookings: 0,
  totalEarnings: 0,
  available: 0,
  pending: 0,
  averageRating: 0,
  totalReviews: 0,
};

export const getVendorStats = async (): Promise<VendorStats> => {
  const { data, error } = await supabase.rpc('vendor_stats');
  if (error || !data) return EMPTY_STATS;
  const n = (v: unknown) => Number(v ?? 0);
  return {
    totalCars: n(data.totalCars),
    approvedCars: n(data.approvedCars),
    pendingCars: n(data.pendingCars),
    totalBookings: n(data.totalBookings),
    activeBookings: n(data.activeBookings),
    completedBookings: n(data.completedBookings),
    cancelledBookings: n(data.cancelledBookings),
    totalEarnings: n(data.totalEarnings),
    available: n(data.available),
    pending: n(data.pending),
    averageRating: n(data.averageRating),
    totalReviews: n(data.totalReviews),
  };
};

/** Vendor account state: pending, approved, rejected or suspended. */
export const getVendorStatus = async (): Promise<{ status: string; reason: string | null } | null> => {
  const id = me();
  if (!id) return null;
  const { data } = await supabase.from('vendors').select('status, rejection_reason').eq('id', id).maybeSingle();
  return data ? { status: data.status, reason: data.rejection_reason ?? null } : null;
};

// ---------------- Drivers ----------------

export interface Driver {
  id: string;
  name: string;
  phone: string;
  email: string;
  licenseNumber: string;
  experience: string;
  photoUrl: string | null;
  status: 'available' | 'busy';
  totalTrips: number;
  rating: number;
}

const mapDriver = (r: any): Driver => ({
  id: r.id,
  name: r.name ?? '',
  phone: r.phone ?? '',
  email: r.email ?? '',
  licenseNumber: r.license_number ?? '',
  experience: r.experience ?? '',
  photoUrl: r.photo_url ?? null,
  status: r.status === 'busy' ? 'busy' : 'available',
  totalTrips: r.total_trips ?? 0,
  rating: Number(r.rating ?? 0),
});

export type DriverInput = { name: string; phone: string; email?: string; licenseNumber?: string; experience?: string; photoUrl?: string | null };

const driverRow = (d: Partial<DriverInput>) => {
  const row: Record<string, unknown> = {};
  if (d.name !== undefined) row.name = d.name.trim();
  if (d.phone !== undefined) row.phone = d.phone.trim();
  if (d.email !== undefined) row.email = d.email.trim() || null;
  if (d.licenseNumber !== undefined) row.license_number = d.licenseNumber.trim() || null;
  if (d.experience !== undefined) row.experience = d.experience.trim() || null;
  if (d.photoUrl !== undefined) row.photo_url = d.photoUrl;
  return row;
};

/** Uploads a driver photo if it is still on the phone. */
const driverPhoto = async (uri: string | null | undefined) =>
  uri && /^(file|content|ph|assets-library):/i.test(uri) ? uploadImage(uri, 'avatars', 'driver') : uri ?? null;

export const getDrivers = async (): Promise<Driver[]> => {
  const id = me();
  if (!id) return [];
  const { data, error } = await supabase.from('drivers').select('*').eq('vendor_id', id).order('created_at');
  if (error) throw new Error(friendlyError(error, 'Could not load your drivers'));
  return (data ?? []).map(mapDriver);
};

export const addDriver = async (d: DriverInput) => {
  const id = me();
  if (!id) return { success: false, error: 'Please sign in again' };
  try {
    const photo = await driverPhoto(d.photoUrl);
    const { error } = await supabase.from('drivers').insert({ ...driverRow({ ...d, photoUrl: photo }), vendor_id: id });
    if (error) throw error;
    return { success: true };
  } catch (e) {
    return { success: false, error: friendlyError(e, 'Could not add the driver') };
  }
};

export const updateDriver = async (driverId: string, d: Partial<DriverInput> & { status?: 'available' | 'busy' }) => {
  try {
    const row = driverRow({ ...d, photoUrl: d.photoUrl === undefined ? undefined : await driverPhoto(d.photoUrl) });
    if (d.status) row.status = d.status;
    const { error } = await supabase.from('drivers').update(row).eq('id', driverId);
    if (error) throw error;
    return { success: true };
  } catch (e) {
    return { success: false, error: friendlyError(e, 'Could not save the driver') };
  }
};

export const deleteDriver = async (driverId: string) => {
  const { error } = await supabase.from('drivers').delete().eq('id', driverId);
  return error ? { success: false, error: friendlyError(error, 'Could not remove the driver') } : { success: true };
};

// ---------------- Withdrawals ----------------

export interface Withdrawal {
  id: string;
  reference: string;
  amount: number;
  fee: number;
  netAmount: number;
  status: 'pending_approval' | 'approved' | 'processing' | 'success' | 'failed' | 'rejected';
  bankName: string;
  accountNumber: string;
  failureReason: string | null;
  createdAt: string;
}

export const WITHDRAWAL_STATUS: Record<Withdrawal['status'], { label: string; tone: 'amber' | 'blue' | 'green' | 'red' }> = {
  pending_approval: { label: 'In review', tone: 'amber' },
  approved: { label: 'Sending', tone: 'blue' },
  processing: { label: 'Sending', tone: 'blue' },
  success: { label: 'Paid', tone: 'green' },
  failed: { label: 'Failed, refunded', tone: 'red' },
  rejected: { label: 'Declined, refunded', tone: 'red' },
};

export const getWithdrawals = async (limit = 20): Promise<Withdrawal[]> => {
  const id = me();
  if (!id) return [];
  const { data } = await supabase
    .from('withdrawals')
    .select('id, reference, amount, fee, net_amount, status, bank_name, account_number, failure_reason, created_at')
    .eq('vendor_id', id)
    .order('created_at', { ascending: false })
    .limit(limit);
  return (data ?? []).map((w) => ({
    id: w.id,
    reference: w.reference,
    amount: Number(w.amount),
    fee: Number(w.fee),
    netAmount: Number(w.net_amount),
    status: w.status,
    bankName: w.bank_name ?? '',
    accountNumber: w.account_number ?? '',
    failureReason: w.failure_reason ?? null,
    createdAt: w.created_at,
  }));
};

// ---------------- Bank account ----------------

export interface BankAccount {
  bankName: string;
  bankCode: string;
  accountNumber: string;
  accountName: string;
}

export const getBankAccount = async (): Promise<BankAccount | null> => {
  const id = me();
  if (!id) return null;
  const { data } = await supabase.from('vendor_private').select('bank_name, bank_code, account_number, account_name').eq('vendor_id', id).maybeSingle();
  if (!data?.account_number) return null;
  return { bankName: data.bank_name ?? '', bankCode: data.bank_code ?? '', accountNumber: data.account_number, accountName: data.account_name ?? '' };
};

// ---------------- Documents ----------------

export type DocKey = 'idFront' | 'idBack' | 'cac' | 'proofOfAddress';

const DOC_COLUMN: Record<DocKey, string> = {
  idFront: 'id_front_path',
  idBack: 'id_back_path',
  cac: 'cac_certificate_path',
  proofOfAddress: 'proof_of_address_path',
};

export interface VendorDocs {
  idType: string;
  nin: string;
  files: Record<DocKey, { path: string | null; url: string | null }>;
}

export const getDocuments = async (): Promise<VendorDocs | null> => {
  const id = me();
  if (!id) return null;
  const { data } = await supabase
    .from('vendor_private')
    .select('id_type, nin, id_front_path, id_back_path, cac_certificate_path, proof_of_address_path')
    .eq('vendor_id', id)
    .maybeSingle();
  if (!data) return null;
  const row = data as Record<string, any>;
  const keys = Object.keys(DOC_COLUMN) as DocKey[];
  const urls = await Promise.all(keys.map((k) => (row[DOC_COLUMN[k]] ? getPrivateFileUrl(row[DOC_COLUMN[k]]) : Promise.resolve(null))));
  const files = {} as VendorDocs['files'];
  keys.forEach((k, i) => (files[k] = { path: row[DOC_COLUMN[k]] ?? null, url: urls[i] }));
  return { idType: row.id_type ?? '', nin: row.nin ?? '', files };
};

/** Uploads a new photo for one document and saves it. */
export const replaceDocument = async (key: DocKey, localUri: string) => {
  const id = me();
  if (!id) return { success: false, error: 'Please sign in again' };
  try {
    const path = await uploadImage(localUri, 'vendor-docs', key);
    const { error } = await supabase.from('vendor_private').update({ [DOC_COLUMN[key]]: path }).eq('vendor_id', id);
    if (error) throw error;
    return { success: true };
  } catch (e) {
    return { success: false, error: friendlyError(e, 'Upload failed') };
  }
};

// ---------------- Account ----------------

export const updateVendorAccount = async (u: { firstName: string; lastName: string; phone: string; businessName: string; businessPhone: string }) => {
  const id = me();
  if (!id) return { success: false, error: 'Please sign in again' };
  const [{ error: a }, { error: b }] = await Promise.all([
    supabase.from('profiles').update({ first_name: u.firstName.trim(), last_name: u.lastName.trim(), phone: u.phone.trim() }).eq('id', id),
    supabase.from('vendors').update({ business_name: u.businessName.trim(), business_phone: u.businessPhone.trim() }).eq('id', id),
  ]);
  const err = a || b;
  return err ? { success: false, error: friendlyError(err, 'Could not save your details') } : { success: true };
};

export const setBusinessLogo = async (localUri: string | null) => {
  const id = me();
  if (!id) return { success: false, error: 'Please sign in again' };
  try {
    const url = localUri ? await uploadImage(localUri, 'avatars', 'logo') : null;
    const { error } = await supabase.from('vendors').update({ logo_url: url }).eq('id', id);
    if (error) throw error;
    return { success: true, url };
  } catch (e) {
    return { success: false, error: friendlyError(e, 'Could not update the logo') };
  }
};
