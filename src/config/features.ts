// ============================================
// ESCARDIA - Feature switches
// Turned on and off from the admin dashboard (Settings > App features).
// The app loads them at launch, keeps the last known values on the phone,
// and checks again whenever the app comes back to the foreground.
// ============================================
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';

export interface Features {
  /** LEGION / PRIVATE security escorts and Hilux backup. */
  security: boolean;
  /** Self-drive rentals. */
  selfDrive: boolean;
}

const STORAGE_KEY = 'escardia.features';

/** Read these at render time (not at the top of a file) so changes show up. Everything is off until the admin turns it on. */
export const FEATURES: Features = { security: false, selfDrive: false };

const apply = (f: Partial<Features>) => {
  if (typeof f.security === 'boolean') FEATURES.security = f.security;
  if (typeof f.selfDrive === 'boolean') FEATURES.selfDrive = f.selfDrive;
};

const fetchLive = async () => {
  const { data, error } = await supabase.from('settings').select('security_enabled, self_drive_enabled').maybeSingle();
  if (error || !data) return;
  const live: Features = { security: !!data.security_enabled, selfDrive: !!data.self_drive_enabled };
  apply(live);
  AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(live)).catch(() => {});
};

/** Called once at launch. Uses the saved values straight away and waits briefly for the live ones. */
export const loadFeatures = async (waitMs = 2500) => {
  try {
    const saved = await AsyncStorage.getItem(STORAGE_KEY);
    if (saved) apply(JSON.parse(saved));
  } catch {
    // keep the defaults
  }
  await Promise.race([fetchLive().catch(() => {}), new Promise((resolve) => setTimeout(resolve, waitMs))]);
};

// Pick up changes made in the admin while the app was in the background.
AppState.addEventListener('change', (state) => {
  if (state === 'active') fetchLive().catch(() => {});
});
