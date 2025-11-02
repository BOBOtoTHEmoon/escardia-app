// src/services/authservice.ts
import { auth, db } from '../config/firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  User,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

// Cloudinary upload (using fetch)
const CLOUDINARY_UPLOAD_PRESET = 'escardia_profile'; // Set in Cloudinary
const CLOUDINARY_CLOUD_NAME = 'your-cloud-name'; // Replace with yours

export const uploadProfilePhoto = async (uri: string): Promise<string> => {
  const data = new FormData();
  data.append('file', {
    uri,
    type: 'image/jpeg',
    name: 'profile.jpg',
  } as any);
  data.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
    {
      method: 'POST',
      body: data,
    }
  );
  const result = await res.json();
  if (!result.secure_url) throw new Error('Upload failed');
  return result.secure_url;
};

// Sign up
export const signUpWithEmail = async (
  email: string,
  password: string,
  firstName: string,
  lastName: string,
  photoUrl?: string
) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    await setDoc(doc(db, 'users', user.uid), {
      uid: user.uid,
      email,
      firstName,
      lastName,
      photoUrl: photoUrl || null,
      createdAt: new Date().toISOString(),
    });

    return { success: true, user };
  } catch (error: any) {
    console.error('Sign up error:', error);
    return { success: false, error: error.message };
  }
};

// Sign in
export const signInWithEmail = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { success: true, user: userCredential.user };
  } catch (error: any) {
    console.error('Sign in error:', error);
    return { success: false, error: error.message };
  }
};

// Sign out
export const logOut = async () => {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error: any) {
    console.error('Sign out error:', error);
    return { success: false, error: error.message };
  }
};

// Get user profile
export const getUserProfile = async (uid: string) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      return { success: true, data: userDoc.data() };
    } else {
      return { success: false, error: 'User not found' };
    }
  } catch (error: any) {
    console.error('Get user profile error:', error);
    return { success: false, error: error.message };
  }
};

// Update profile photo
export const updateProfilePhoto = async (uid: string, photoUrl: string) => {
  try {
    await setDoc(doc(db, 'users', uid), { photoUrl }, { merge: true });
    return { success: true };
  } catch (error: any) {
    console.error('Update photo error:', error);
    return { success: false, error: error.message };
  }
};

// Update vendor photo
export const updateVendorPhoto = async (uid: string, photoUrl: string) => {
  try {
    await setDoc(doc(db, 'vendors', uid), { photoUrl }, { merge: true });
    return { success: true };
  } catch (error: any) {
    console.error('Update vendor photo error:', error);
    return { success: false, error: error.message };
  }
};