// ============================================
// ESCARDIA - Live prices and rules from the admin Settings page
// The database uses the same row when it prices a booking, so the app always
// shows what the customer will actually pay.
// ============================================
import { supabase } from '../config/supabase';

export interface AppSettings {
  serviceFee: number;
  deliveryFee: number;
  legionPerDay: number;
  privatePerDay: number;
  hiluxPerDay: number;
  minHoursBeforeStart: number;
  paymentWindowMinutes: number;
  // Vendor rules
  commissionRate: number; // 0.13 means 13%
  payoutHoldHours: number;
  withdrawalFee: number;
  minWithdrawal: number;
}

// Used only until the first load finishes (or if the phone is offline).
export const DEFAULT_SETTINGS: AppSettings = {
  serviceFee: 2000,
  deliveryFee: 5000,
  legionPerDay: 25000,
  privatePerDay: 30000,
  hiluxPerDay: 80000,
  minHoursBeforeStart: 3,
  paymentWindowMinutes: 30,
  commissionRate: 0.13,
  payoutHoldHours: 24,
  withdrawalFee: 50,
  minWithdrawal: 1000,
};

let cache: { at: number; value: AppSettings } | null = null;

export const getAppSettings = async (): Promise<AppSettings> => {
  if (cache && Date.now() - cache.at < 5 * 60 * 1000) return cache.value;
  const { data, error } = await supabase
    .from('settings')
    .select('service_fee, delivery_fee, legion_price_per_day, private_price_per_day, hilux_price_per_day, min_hours_before_start, payment_window_minutes, commission_rate, payout_hold_hours, withdrawal_fee, min_withdrawal')
    .maybeSingle();
  if (error || !data) return cache?.value ?? DEFAULT_SETTINGS;
  const value: AppSettings = {
    serviceFee: Number(data.service_fee),
    deliveryFee: Number(data.delivery_fee),
    legionPerDay: Number(data.legion_price_per_day),
    privatePerDay: Number(data.private_price_per_day),
    hiluxPerDay: Number(data.hilux_price_per_day),
    minHoursBeforeStart: Number(data.min_hours_before_start),
    paymentWindowMinutes: Number(data.payment_window_minutes),
    commissionRate: Number(data.commission_rate),
    payoutHoldHours: Number(data.payout_hold_hours),
    withdrawalFee: Number(data.withdrawal_fee),
    minWithdrawal: Number(data.min_withdrawal),
  };
  cache = { at: Date.now(), value };
  return value;
};
