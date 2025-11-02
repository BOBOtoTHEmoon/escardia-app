// src/services/payoutservice.ts
import { db, auth } from '../config/firebase';
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  addDoc,
  query,
  where,
  getDocs,
  orderBy,
  limit,
} from 'firebase/firestore';

export interface BankDetails {
  accountNumber: string;
  accountName: string;
  bankName: string;
}

export interface Withdrawal {
  id?: string;
  amount: number;
  bankName: string;
  accountNumber: string;
  accountName: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  requestedAt: string;
}

// Save or update bank details
export const saveBankDetails = async (details: BankDetails): Promise<void> => {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');

  await updateDoc(doc(db, 'vendors', user.uid), {
    bankDetails: {
      ...details,
      updatedAt: new Date().toISOString(),
    },
  });
};

// Get bank details
export const getBankDetails = async (): Promise<BankDetails | null> => {
  const user = auth.currentUser;
  if (!user) return null;

  const docSnap = await getDoc(doc(db, 'vendors', user.uid));
  if (!docSnap.exists()) return null;

  return docSnap.data()?.bankDetails || null;
};

// Request withdrawal
export const requestWithdrawal = async (amount: number, bank: BankDetails): Promise<void> => {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');

  await addDoc(collection(db, 'withdrawals'), {
    vendorId: user.uid,
    amount,
    ...bank,
    status: 'pending',
    requestedAt: new Date().toISOString(),
  });
};

// Get recent withdrawals
export const getRecentWithdrawals = async (limitCount = 5): Promise<Withdrawal[]> => {
  const user = auth.currentUser;
  if (!user) return [];

  const q = query(
    collection(db, 'withdrawals'),
    where('vendorId', '==', user.uid),
    orderBy('requestedAt', 'desc'),
    limit(limitCount)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  } as Withdrawal));
};