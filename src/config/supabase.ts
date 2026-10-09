// ============================================
// ESCARDIA - Supabase client (replaces config/firebase.ts)
// ============================================
import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState } from 'react-native';
import { createClient, User } from '@supabase/supabase-js';

export const SUPABASE_URL = 'https://twmojaxvuuptezskdwbj.supabase.co';
// Publishable key: safe to ship in the app. Never put a secret key here.
export const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_latNs_LJxwyPvPcdlkgTVA_12YWVaL0';

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Keep the login fresh only while the app is open.
AppState.addEventListener('change', (state) => {
  if (state === 'active') supabase.auth.startAutoRefresh();
  else supabase.auth.stopAutoRefresh();
});

// --------------------------------------------
// Firebase-style helpers so existing screens keep working.
// Screens can still use: auth.currentUser?.uid
// --------------------------------------------
export interface AppUser {
  uid: string;
  id: string;
  email: string | null;
  displayName: string | null;
}

const toAppUser = (u: User | null | undefined): AppUser | null => {
  if (!u) return null;
  const name = [u.user_metadata?.first_name, u.user_metadata?.last_name].filter(Boolean).join(' ');
  return { uid: u.id, id: u.id, email: u.email ?? null, displayName: name || null };
};

let currentUser: AppUser | null = null;
let authReady = false;
const listeners = new Set<(user: AppUser | null) => void>();

supabase.auth.onAuthStateChange((_event, session) => {
  currentUser = toAppUser(session?.user);
  authReady = true;
  listeners.forEach((cb) => cb(currentUser));
});

export const auth = {
  get currentUser(): AppUser | null {
    return currentUser;
  },
};

/** Same idea as Firebase's onAuthStateChanged. Returns an unsubscribe function. */
export const onAuthStateChanged = (callback: (user: AppUser | null) => void): (() => void) => {
  listeners.add(callback);
  if (authReady) callback(currentUser);
  return () => {
    listeners.delete(callback);
  };
};

/** Turns Supabase error text into something a customer can read. */
export const friendlyError = (error: unknown, fallback = 'Something went wrong. Please try again.'): string => {
  const msg = (error as { message?: string })?.message ?? '';
  if (!msg) return fallback;
  if (/Invalid login credentials/i.test(msg)) return 'Invalid email or password';
  if (/Email not confirmed/i.test(msg)) return 'Please verify your email first. We have sent you a new code.';
  if (/User already registered/i.test(msg)) return 'An account with this email already exists. Please sign in.';
  if (/Password should be at least/i.test(msg)) return 'Password must be at least 6 characters';
  if (/Token has expired|invalid/i.test(msg) && /otp|token/i.test(msg)) return 'That code is wrong or has expired';
  if (/rate limit|too many/i.test(msg)) return 'Too many attempts. Please wait a minute and try again.';
  if (/Network request failed|fetch/i.test(msg)) return 'No internet connection. Please try again.';
  return msg;
};

// --------------------------------------------
// File uploads (replaces Cloudinary)
// --------------------------------------------
export type Bucket = 'car-photos' | 'avatars' | 'vendor-docs';

/**
 * Uploads a local image (file:// or content://) and returns:
 *  - a public URL for car-photos and avatars
 *  - a storage path for vendor-docs (private; use getPrivateFileUrl to view)
 */
export const uploadImage = async (uri: string, bucket: Bucket, label = 'photo'): Promise<string> => {
  const user = currentUser;
  if (!user) throw new Error('Please sign in first');

  const ext = (uri.split('?')[0].split('.').pop() || 'jpg').toLowerCase().replace('jpeg', 'jpg');
  const contentType = ext === 'png' ? 'image/png' : ext === 'pdf' ? 'application/pdf' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
  const path = `${user.uid}/${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const body = await fetch(uri).then((res) => res.arrayBuffer());
  const { error } = await supabase.storage.from(bucket).upload(path, body, { contentType, upsert: false });
  if (error) throw new Error(friendlyError(error, 'Upload failed'));

  if (bucket === 'vendor-docs') return path;
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
};

/** Uploads only if the value is a local file; already-uploaded values are returned unchanged. */
export const uploadIfLocal = async (uri: string | null | undefined, bucket: Bucket, label?: string) => {
  if (!uri) return null;
  if (/^(file|content|ph|assets-library):/i.test(uri)) return uploadImage(uri, bucket, label);
  return uri;
};

/** Temporary link for a private document (vendor ID, CAC certificate). */
export const getPrivateFileUrl = async (path: string, expiresInSeconds = 3600): Promise<string | null> => {
  if (!path) return null;
  if (/^https?:/i.test(path)) return path;
  const { data } = await supabase.storage.from('vendor-docs').createSignedUrl(path, expiresInSeconds);
  return data?.signedUrl ?? null;
};

export default supabase;