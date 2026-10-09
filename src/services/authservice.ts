// ============================================
// ESCARDIA - Customer auth (Supabase)
// ============================================
import { supabase, friendlyError } from '../config/supabase';

const clean = (email: string) => email.trim().toLowerCase();

export interface UserProfile {
  uid: string;
  role: 'customer' | 'vendor' | 'admin';
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  avatarUrl: string | null;
  createdAt: string;
}

const mapProfile = (row: any): UserProfile => ({
  uid: row.id,
  role: row.role,
  email: row.email ?? '',
  firstName: row.first_name ?? '',
  lastName: row.last_name ?? '',
  phoneNumber: row.phone ?? '',
  avatarUrl: row.avatar_url ?? null,
  createdAt: row.created_at,
});

/** Step 1 of sign up. Sends a 6-digit code to the email. */
export const signUpWithEmail = async (
  email: string,
  password: string,
  firstName: string,
  lastName: string,
  phoneNumber?: string
) => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email: clean(email),
      password,
      options: { data: { role: 'customer', first_name: firstName.trim(), last_name: lastName.trim(), phone: phoneNumber ?? null } },
    });
    if (error) return { success: false, error: friendlyError(error) };

    // Supabase hides "already registered" by returning a user with no identities.
    if (data.user && data.user.identities && data.user.identities.length === 0) {
      return { success: false, error: 'An account with this email already exists. Please sign in.' };
    }
    return { success: true, user: data.user, needsVerification: !data.session };
  } catch (error) {
    return { success: false, error: friendlyError(error) };
  }
};

/** Step 2 of sign up (customers and vendors). Confirms the 6-digit email code and signs the user in. */
export const verifyEmailCode = async (email: string, code: string) => {
  try {
    let { data, error } = await supabase.auth.verifyOtp({ email: clean(email), token: code, type: 'email' });
    if (error) {
      // Older projects send sign up codes as type 'signup'.
      const retry = await supabase.auth.verifyOtp({ email: clean(email), token: code, type: 'signup' });
      data = retry.data;
      error = retry.error;
    }
    if (error) return { success: false, error: friendlyError(error) };
    return { success: true, user: data.user };
  } catch (error) {
    return { success: false, error: friendlyError(error) };
  }
};

/** Sends the sign up code again. */
export const resendVerificationCode = async (email: string) => {
  const { error } = await supabase.auth.resend({ type: 'signup', email: clean(email) });
  return error ? { success: false, error: friendlyError(error) } : { success: true };
};

/** Customer sign in. Vendor accounts are sent to the vendor portal. */
export const signInWithEmail = async (email: string, password: string) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email: clean(email), password });
    if (error) {
      if (/Email not confirmed/i.test(error.message)) {
        await supabase.auth.resend({ type: 'signup', email: clean(email) });
        return { success: false, needsVerification: true, error: friendlyError(error) };
      }
      return { success: false, error: friendlyError(error) };
    }

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', data.user.id).maybeSingle();
    if (profile?.role === 'vendor') {
      await supabase.auth.signOut();
      return { success: false, error: 'This is a vendor account. Please use the vendor portal to sign in.' };
    }
    return { success: true, user: data.user };
  } catch (error) {
    return { success: false, error: friendlyError(error) };
  }
};

export const logOut = async () => {
  const { error } = await supabase.auth.signOut();
  return error ? { success: false, error: friendlyError(error) } : { success: true };
};

export const getUserProfile = async (uid: string) => {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', uid).maybeSingle();
  if (error) return { success: false, error: friendlyError(error) };
  if (!data) return { success: false, error: 'User not found' };
  return { success: true, data: mapProfile(data) };
};

export const updateUserProfile = async (
  uid: string,
  updates: { firstName?: string; lastName?: string; phoneNumber?: string; avatarUrl?: string }
) => {
  const row: Record<string, unknown> = {};
  if (updates.firstName !== undefined) row.first_name = updates.firstName;
  if (updates.lastName !== undefined) row.last_name = updates.lastName;
  if (updates.phoneNumber !== undefined) row.phone = updates.phoneNumber;
  if (updates.avatarUrl !== undefined) row.avatar_url = updates.avatarUrl;
  const { error } = await supabase.from('profiles').update(row).eq('id', uid);
  return error ? { success: false, error: friendlyError(error) } : { success: true };
};

// ----- Password -----

/** Forgot password, step 1: emails a 6-digit reset code. */
export const sendPasswordResetCode = async (email: string) => {
  const { error } = await supabase.auth.resetPasswordForEmail(clean(email));
  return error ? { success: false, error: friendlyError(error) } : { success: true };
};

/** Forgot password, step 2: checks the code and sets the new password. */
export const resetPasswordWithCode = async (email: string, code: string, newPassword: string) => {
  const { error } = await supabase.auth.verifyOtp({ email: clean(email), token: code, type: 'recovery' });
  if (error) return { success: false, error: friendlyError(error) };
  const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
  return updateError ? { success: false, error: friendlyError(updateError) } : { success: true };
};

/** Signed-in user changes password (checks the current one first). */
export const changePassword = async (currentPassword: string, newPassword: string) => {
  const { data } = await supabase.auth.getUser();
  const email = data.user?.email;
  if (!email) return { success: false, error: 'Please sign in again' };

  const { error: checkError } = await supabase.auth.signInWithPassword({ email, password: currentPassword });
  if (checkError) return { success: false, error: 'Current password is incorrect' };

  const { error } = await supabase.auth.updateUser({ password: newPassword });
  return error ? { success: false, error: friendlyError(error) } : { success: true };
};