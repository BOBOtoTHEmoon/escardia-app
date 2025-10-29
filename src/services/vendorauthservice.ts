import { auth, db } from '../config/firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
} from 'firebase/firestore';

export interface VendorRegistrationData {
  // From Account Creation
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  password: string;
  
  // From Business Registration
  businessName: string;
  cacCertificate: string | null;
  
  // From ID Verification
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
  cacCertificate: string | null;
  nin: string;
  idType: string;
  idFront: string;
  idBack: string;
  proofOfAddress: string | null;
  isVerified: boolean;
  createdAt: any;
  updatedAt: any;
}

/**
 * STEP 1: Register a new vendor
 * This creates both Firebase Auth account AND Firestore vendor document
 */
export const registerVendor = async (
  vendorData: VendorRegistrationData
): Promise<{ success: boolean; vendorId?: string; error?: string }> => {
  try {
    console.log('🔵 Step 1: Creating Firebase Auth account...');
    
    // Create Firebase Authentication account
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      vendorData.email,
      vendorData.password
    );
    
    const user = userCredential.user;
    console.log('✅ Auth account created with ID:', user.uid);

    // Update display name in Firebase Auth
    await updateProfile(user, {
      displayName: `${vendorData.firstName} ${vendorData.lastName}`,
    });

    console.log('🔵 Step 2: Creating vendor document in Firestore...');
    
    // Create vendor profile in Firestore 'vendors' collection
    const vendorProfile: Omit<VendorProfile, 'id'> = {
      firstName: vendorData.firstName,
      lastName: vendorData.lastName,
      email: vendorData.email,
      phoneNumber: vendorData.phoneNumber,
      businessName: vendorData.businessName,
      cacCertificate: vendorData.cacCertificate,
      nin: vendorData.nin,
      idType: vendorData.idType,
      idFront: vendorData.idFront,
      idBack: vendorData.idBack,
      proofOfAddress: vendorData.proofOfAddress,
      isVerified: false, // Admin will verify later
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    // Save to Firestore
    await setDoc(doc(db, 'vendors', user.uid), vendorProfile);
    
    console.log('✅ Vendor document created in Firestore');
    console.log('✅ Registration complete!');

    return {
      success: true,
      vendorId: user.uid,
    };
  } catch (error: any) {
    console.error('❌ Registration error:', error);
    
    // Friendly error messages
    let errorMessage = 'Registration failed';
    if (error.code === 'auth/email-already-in-use') {
      errorMessage = 'Email already registered';
    } else if (error.code === 'auth/weak-password') {
      errorMessage = 'Password is too weak';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'Invalid email address';
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
};

/**
 * STEP 2: Sign in vendor
 * This logs in using Firebase Auth
 */
export const signInVendor = async (
  email: string,
  password: string
): Promise<{ success: boolean; vendorId?: string; error?: string }> => {
  try {
    console.log('🔵 Signing in vendor...');
    
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );

    const user = userCredential.user;
    
    console.log('🔵 Checking if user is a vendor...');
    
    // Check if this user is a vendor (exists in vendors collection)
    const vendorDoc = await getDoc(doc(db, 'vendors', user.uid));
    
    if (!vendorDoc.exists()) {
      // This user is not a vendor, sign them out
      await signOut(auth);
      console.log('❌ User is not a vendor');
      return {
        success: false,
        error: 'This account is not registered as a vendor',
      };
    }

    console.log('✅ Vendor signed in successfully');

    return {
      success: true,
      vendorId: user.uid,
    };
  } catch (error: any) {
    console.error('❌ Sign in error:', error);
    
    let errorMessage = 'Sign in failed';
    if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
      errorMessage = 'Invalid email or password';
    } else if (error.code === 'auth/too-many-requests') {
      errorMessage = 'Too many failed attempts. Try again later';
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
};

/**
 * STEP 3: Get vendor profile
 * Fetch vendor data from Firestore
 */
export const getVendorProfile = async (
  vendorId: string
): Promise<{ success: boolean; data?: VendorProfile; error?: string }> => {
  try {
    console.log('🔵 Fetching vendor profile...');
    
    const vendorDoc = await getDoc(doc(db, 'vendors', vendorId));

    if (!vendorDoc.exists()) {
      return {
        success: false,
        error: 'Vendor not found',
      };
    }

    const vendorData = {
      id: vendorDoc.id,
      ...vendorDoc.data(),
    } as VendorProfile;

    console.log('✅ Vendor profile fetched');

    return {
      success: true,
      data: vendorData,
    };
  } catch (error) {
    console.error('❌ Error fetching vendor profile:', error);
    return {
      success: false,
      error: 'Failed to load profile',
    };
  }
};

/**
 * STEP 4: Sign out vendor
 */
export const signOutVendor = async (): Promise<{ success: boolean; error?: string }> => {
  try {
    console.log('🔵 Signing out vendor...');
    await signOut(auth);
    console.log('✅ Vendor signed out');
    
    return { success: true };
  } catch (error) {
    console.error('❌ Sign out error:', error);
    return {
      success: false,
      error: 'Failed to sign out',
    };
  }
};