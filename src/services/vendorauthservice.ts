// ============================================
// ESCARDIA - Vendor auth (Supabase)
// Flow: account details -> email code -> business details -> ID upload -> registerVendor()
// ============================================
import { supabase, friendlyError, uploadIfLocal } from '../config/supabase';

export interface VendorAccountData {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  password: string;
}

export interface VendorRegistrationData extends VendorAccountData {
  businessName: string;
  cacCertificate: string | null;
  nin: string;
  idType: 'national-id' | 'passport' | 'voters-card';
  idFront: string;
  idBack: string;
  proofOfAddress: string | null;
}

export interface VendorProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  businessName: string;
  businessPhone: string;
  logoUrl: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  rejectionReason: string | null;
  isVerified: boolean;
  cacCertificate: string | null;
  nin: string;
  idType: string;
  idFront: string;
  idBack: string;
  proofOfAddress: string | null;
  bankDetails: { bankName: string; bankCode: string; accountNumber: string; accountName: string } | null;
  createdAt: string;
  updatedAt: string;
}

const clean = (email: string) => email.trim().toLowerCase();

/**
 * STEP 1: Create the vendor login and send a 6-digit code to their email.
 * Call this when the vendor finishes the account creation screen.
 */
export const startVendorSignUp = async (
  data: VendorAccountData
): Promise<{ success: boolean; needsVerification?: boolean; error?: string }> => {
  try {
    const { data: res, error } = await supabase.auth.signUp({
      email: clean(data.email),
      password: data.password,
      options: {
        data: {
          role: 'vendor',
          first_name: data.firstName.trim(),
          last_name: data.lastName.trim(),
          phone: data.phoneNumber.trim(),
        },
      },
    });
    if (error) return { success: false, error: friendlyError(error) };
    if (res.user && res.user.identities && res.user.identities.length === 0) {
      return { success: false, error: 'Email already registered. Please sign in instead.' };
    }
    // No session means Supabase wants the email code first.
    return { success: true, needsVerification: !res.session };
  } catch (error) {
    return { success: false, error: friendlyError(error) };
  }
};

/**
 * STEP 2 is the email code: use verifyEmailCode() from authservice.
 *
 * STEP 3: Save business + ID details (vendor must be signed in, which happens after the code is verified).
 * Kept the old name so App.tsx does not need to change much.
 */
export const registerVendor = async (
  vendorData: VendorRegistrationData
): Promise<{ success: boolean; vendorId?: string; error?: string }> => {
  try {
    const { data: userRes } = await supabase.auth.getUser();
    const user = userRes.user;
    if (!user) return { success: false, error: 'Please verify your email first' };

    // Upload documents to private storage.
    const [cacPath, idFrontPath, idBackPath, proofPath] = await Promise.all([
      uploadIfLocal(vendorData.cacCertificate, 'vendor-docs', 'cac'),
      uploadIfLocal(vendorData.idFront, 'vendor-docs', 'id-front'),
      uploadIfLocal(vendorData.idBack, 'vendor-docs', 'id-back'),
      uploadIfLocal(vendorData.proofOfAddress, 'vendor-docs', 'proof-of-address'),
    ]);

    const { error: vError } = await supabase
      .from('vendors')
      .update({ business_name: vendorData.businessName?.trim(), business_phone: vendorData.phoneNumber?.trim() })
      .eq('id', user.id);
    if (vError) throw vError;

    const { error: pError } = await supabase
      .from('vendor_private')
      .update({
        nin: vendorData.nin?.trim(),
        id_type: vendorData.idType,
        id_front_path: idFrontPath,
        id_back_path: idBackPath,
        cac_certificate_path: cacPath,
        proof_of_address_path: proofPath,
      })
      .eq('vendor_id', user.id);
    if (pError) throw pError;

    return { success: true, vendorId: user.id };
  } catch (error) {
    console.error('Vendor registration error:', error);
    return { success: false, error: friendlyError(error, 'Registration failed') };
  }
};

/** Vendor sign in. Customer accounts are turned away. */
export const signInVendor = async (
  email: string,
  password: string
): Promise<{ success: boolean; vendorId?: string; error?: string; needsVerification?: boolean }> => {
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
    if (profile?.role !== 'vendor') {
      await supabase.auth.signOut();
      return { success: false, error: 'This account is not registered as a vendor' };
    }
    return { success: true, vendorId: data.user.id };
  } catch (error) {
    return { success: false, error: friendlyError(error, 'Sign in failed') };
  }
};

/** Vendor profile: profile + business + KYC/bank details in the old shape. */
export const getVendorProfile = async (
  vendorId: string
): Promise<{ success: boolean; data?: VendorProfile; error?: string }> => {
  try {
    const [{ data: p }, { data: v }, { data: vp }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', vendorId).maybeSingle(),
      supabase.from('vendors').select('*').eq('id', vendorId).maybeSingle(),
      supabase.from('vendor_private').select('*').eq('vendor_id', vendorId).maybeSingle(),
    ]);
    if (!v) return { success: false, error: 'Vendor not found' };

    return {
      success: true,
      data: {
        id: v.id,
        firstName: p?.first_name ?? '',
        lastName: p?.last_name ?? '',
        email: p?.email ?? '',
        phoneNumber: p?.phone ?? v.business_phone ?? '',
        businessName: v.business_name ?? '',
        businessPhone: v.business_phone ?? '',
        logoUrl: v.logo_url ?? null,
        status: v.status,
        rejectionReason: v.rejection_reason ?? null,
        isVerified: v.status === 'approved',
        cacCertificate: vp?.cac_certificate_path ?? null,
        nin: vp?.nin ?? '',
        idType: vp?.id_type ?? '',
        idFront: vp?.id_front_path ?? '',
        idBack: vp?.id_back_path ?? '',
        proofOfAddress: vp?.proof_of_address_path ?? null,
        bankDetails: vp?.account_number
          ? {
              bankName: vp.bank_name ?? '',
              bankCode: vp.bank_code ?? '',
              accountNumber: vp.account_number,
              accountName: vp.account_name ?? '',
            }
          : null,
        createdAt: v.created_at,
        updatedAt: v.updated_at,
      },
    };
  } catch (error) {
    return { success: false, error: 'Failed to load profile' };
  }
};

export const updateVendorBusiness = async (
  vendorId: string,
  updates: { businessName?: string; businessPhone?: string; logoUrl?: string }
) => {
  const row: Record<string, unknown> = {};
  if (updates.businessName !== undefined) row.business_name = updates.businessName;
  if (updates.businessPhone !== undefined) row.business_phone = updates.businessPhone;
  if (updates.logoUrl !== undefined) row.logo_url = updates.logoUrl;
  const { error } = await supabase.from('vendors').update(row).eq('id', vendorId);
  return error ? { success: false, error: friendlyError(error) } : { success: true };
};

export const signOutVendor = async (): Promise<{ success: boolean; error?: string }> => {
  const { error } = await supabase.auth.signOut();
  return error ? { success: false, error: 'Failed to sign out' } : { success: true };
};

/** What customers can see about a vendor (business name and phone only). */
export const getPublicVendorDetails = async (vendorId: string) => {
  const { data } = await supabase.from('vendors').select('business_name, business_phone').eq('id', vendorId).maybeSingle();
  if (!data) return null;
  return {
    businessName: data.business_name ?? '',
    firstName: data.business_name ?? '',
    lastName: '',
    phoneNumber: data.business_phone ?? '',
    businessAddress: '',
  };
};
