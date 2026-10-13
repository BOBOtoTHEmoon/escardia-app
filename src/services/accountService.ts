// ============================================
// ESCARDIA - Delete account (Apple and Google require this inside the app)
// The work happens in the delete-account Edge Function; the app only asks.
// ============================================
import { supabase } from '../config/supabase';

const call = async (action: 'check' | 'delete') => {
  const { data, error } = await supabase.functions.invoke('delete-account', { body: { action } });
  if (error) {
    let message = 'We could not reach Escardia. Check your connection and try again.';
    try {
      const ctx = (error as any).context;
      if (ctx?.json) message = (await ctx.json())?.error ?? message;
    } catch {
      // keep the default message
    }
    throw new Error(message);
  }
  if (data?.error) throw new Error(data.error);
  return data;
};

/** Whether the account can be deleted right now, and why not if it cannot. */
export const checkAccountDeletion = async (): Promise<{ ok: boolean; reason?: string }> => {
  try {
    const r = await call('check');
    return r?.ok ? { ok: true } : { ok: false, reason: r?.reason };
  } catch (e: any) {
    return { ok: false, reason: e.message };
  }
};

/** Deletes the signed-in account, then signs out on this phone. */
export const deleteMyAccount = async (): Promise<{ success: boolean; error?: string }> => {
  try {
    await call('delete');
    await supabase.auth.signOut({ scope: 'local' }).catch(() => {});
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
};
