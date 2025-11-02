// src/services/driverservice.ts
import { db, auth } from '../config/firebase';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
  orderBy,
} from 'firebase/firestore';

export interface Driver {
  id?: string;
  vendorId: string;
  name: string;
  phone: string;
  email?: string;
  licenseNumber: string;
  experience?: string;
  status: 'available' | 'busy';
  totalTrips: number;
  rating: number;
  photo?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Get all drivers for vendor
export const getDrivers = async (): Promise<Driver[]> => {
  const user = auth.currentUser;
  if (!user) return [];

  const q = query(
    collection(db, 'drivers'),
    where('vendorId', '==', user.uid),
    orderBy('createdAt', 'desc')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  } as Driver));
};

// Add new driver
export const addDriver = async (driver: Omit<Driver, 'id' | 'vendorId' | 'totalTrips' | 'rating' | 'status'>): Promise<void> => {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');

  await addDoc(collection(db, 'drivers'), {
    vendorId: user.uid,
    ...driver,
    status: 'available',
    totalTrips: 0,
    rating: 5.0,
    createdAt: new Date().toISOString(),
  });
};

// Update driver
export const updateDriver = async (id: string, updates: Partial<Driver>): Promise<void> => {
  await updateDoc(doc(db, 'drivers', id), {
    ...updates,
    updatedAt: new Date().toISOString(),
  });
};

// Delete driver
export const deleteDriver = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, 'drivers', id));
};

// Assign driver to booking (call from booking flow)
export const assignDriverToBooking = async (bookingId: string, driverId: string): Promise<void> => {
  await updateDoc(doc(db, 'bookings', bookingId), {
    assignedDriverId: driverId,
    status: 'confirmed',
    assignedAt: new Date().toISOString(),
  });

  // Update driver status
  await updateDoc(doc(db, 'drivers', driverId), {
    status: 'busy',
  });
};