import { db } from '../config/firebase';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';

export interface CarData {
  brand: string;
  model: string;
  year: string;
  type: string;
  pricePerDay: number;
  pricePerHour: number;
  seats: number;
  doors: number;
  transmission: string;
  fuelType: string;
  location: string;
  description: string;
  photos: string[];
  vendorId: string;
  status: 'available' | 'booked' | 'maintenance';
  isActive: boolean;
  totalBookings: number;
  totalEarnings: number;
  rating?: {
    averageOverall: number;
    totalReviews: number;
  };
  createdAt: any;
  updatedAt: any;
}

export interface Car extends CarData {
  id: string;
}

// ✅ HELPER FUNCTION - Get approved vendor IDs (reusable!)
const getApprovedVendorIds = async (): Promise<Set<string>> => {
  try {
    const vendorsQuery = query(
      collection(db, 'vendors'),
      where('status', '==', 'approved')
    );
    const vendorsSnapshot = await getDocs(vendorsQuery);
    
    const approvedVendorIds = new Set<string>();
    vendorsSnapshot.forEach((doc) => {
      approvedVendorIds.add(doc.id);
    });
    
    console.log(`✅ Found ${approvedVendorIds.size} approved vendors`);
    return approvedVendorIds;
  } catch (error) {
    console.error('Error getting approved vendors:', error);
    return new Set<string>();
  }
};

/**
 * STEP 1: Add a new car to vendor's fleet
 */
export const addCar = async (
  carData: Omit<CarData, 'vendorId' | 'status' | 'isActive' | 'totalBookings' | 'totalEarnings' | 'createdAt' | 'updatedAt'>,
  vendorId: string
): Promise<{ success: boolean; carId?: string; error?: string }> => {
  try {
    console.log('🔵 Step 1: Adding car to Firebase...');
    
    const carRef = doc(collection(db, 'cars'));
    
    const carDocument: Omit<Car, 'id'> = {
      ...carData,
      pricePerDay: Number(carData.pricePerDay),
      pricePerHour: Number(carData.pricePerHour),
      seats: Number(carData.seats),
      doors: Number(carData.doors),
      vendorId,
      status: 'available',
      isActive: true,
      totalBookings: 0,
      totalEarnings: 0,
      rating: {
        averageOverall: 0,
        totalReviews: 0,
      },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    
    await setDoc(carRef, carDocument);
    
    console.log('✅ Car added successfully! ID:', carRef.id);
    
    return {
      success: true,
      carId: carRef.id,
    };
  } catch (error) {
    console.error('❌ Error adding car:', error);
    return {
      success: false,
      error: 'Failed to add car',
    };
  }
};

/**
 * STEP 2: Get all cars for a specific vendor
 */
export const getVendorCars = async (
  vendorId: string
): Promise<{ success: boolean; cars?: Car[]; error?: string }> => {
  try {
    console.log('🔵 Fetching vendor cars...');
    
    const carsQuery = query(
      collection(db, 'cars'),
      where('vendorId', '==', vendorId)
    );
    
    const carsSnapshot = await getDocs(carsQuery);
    
    const cars: Car[] = [];
    carsSnapshot.forEach((doc) => {
      cars.push({
        id: doc.id,
        ...doc.data(),
      } as Car);
    });
    
    console.log(`✅ Found ${cars.length} cars for vendor`);
    
    return {
      success: true,
      cars,
    };
  } catch (error) {
    console.error('❌ Error fetching cars:', error);
    return {
      success: false,
      error: 'Failed to load cars',
    };
  }
};

/**
 * STEP 3: Get a single car by ID
 */
export const getCar = async (
  carId: string
): Promise<{ success: boolean; car?: Car; error?: string }> => {
  try {
    console.log('🔵 Fetching car details...');
    
    const carDoc = await getDoc(doc(db, 'cars', carId));
    
    if (!carDoc.exists()) {
      return {
        success: false,
        error: 'Car not found',
      };
    }
    
    const carData = {
      id: carDoc.id,
      ...carDoc.data(),
    } as Car;
    
    // ✅ Check if vendor is approved
    const approvedVendorIds = await getApprovedVendorIds();
    
    if (!approvedVendorIds.has(carData.vendorId)) {
      return {
        success: false,
        error: 'This car is no longer available',
      };
    }
    
    console.log('✅ Car fetched:', carData.brand, carData.model);
    
    return {
      success: true,
      car: carData,
    };
  } catch (error) {
    console.error('❌ Error fetching car:', error);
    return {
      success: false,
      error: 'Failed to load car',
    };
  }
};

/**
 * STEP 4: Update car details
 */
export const updateCar = async (
  carId: string,
  updates: Partial<CarData>
): Promise<{ success: boolean; error?: string }> => {
  try {
    console.log('🔵 Updating car...');
    
    const carRef = doc(db, 'cars', carId);
    
    await updateDoc(carRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
    
    console.log('✅ Car updated successfully');
    
    return { success: true };
  } catch (error) {
    console.error('❌ Error updating car:', error);
    return {
      success: false,
      error: 'Failed to update car',
    };
  }
};

/**
 * STEP 5: Delete a car
 */
export const deleteCar = async (
  carId: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    console.log('🔵 Deleting car...');
    
    await deleteDoc(doc(db, 'cars', carId));
    
    console.log('✅ Car deleted successfully');
    
    return { success: true };
  } catch (error) {
    console.error('❌ Error deleting car:', error);
    return {
      success: false,
      error: 'Failed to delete car',
    };
  }
};

/**
 * STEP 6: Update car status (available, booked, maintenance)
 */
export const updateCarStatus = async (
  carId: string,
  status: 'available' | 'booked' | 'maintenance'
): Promise<{ success: boolean; error?: string }> => {
  try {
    console.log('🔵 Updating car status to:', status);
    
    const carRef = doc(db, 'cars', carId);
    
    await updateDoc(carRef, {
      status,
      updatedAt: serverTimestamp(),
    });
    
    console.log('✅ Car status updated');
    
    return { success: true };
  } catch (error) {
    console.error('❌ Error updating car status:', error);
    return {
      success: false,
      error: 'Failed to update status',
    };
  }
};

/**
 * STEP 7: Get all available cars (for users to browse)
 */
export const getAvailableCars = async (): Promise<{
  success: boolean;
  cars?: any[];
  error?: string;
}> => {
  try {
    console.log('🔵 Fetching available cars...');
    
    // ✅ Get approved vendors first
    const approvedVendorIds = await getApprovedVendorIds();
    
    // Get all cars
    const carsSnapshot = await getDocs(collection(db, 'cars'));
    
    // ✅ Filter cars - only from approved vendors AND available status
const cars = carsSnapshot.docs
  .map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }))
  .filter((car: any) => 
    approvedVendorIds.has(car.vendorId) && // ✅ Approved vendor
    car.status === 'available' // ✅ Car is available
  );
    
    console.log(`✅ Loaded ${cars.length} cars from approved vendors (filtered from ${carsSnapshot.size} total)`);
    
    return {
      success: true,
      cars,
    };
  } catch (error) {
    console.error('❌ Error fetching cars:', error);
    return {
      success: false,
      error: 'Failed to fetch cars',
    };
  }
};

/**
 * Get popular cars (for user home screen)
 */
export const getPopularCars = async () => {
  try {
    // ✅ Get approved vendors
    const approvedVendorIds = await getApprovedVendorIds();
    
    const q = query(
      collection(db, 'cars'), 
      where('isPopular', '==', true),
      where('status', '==', 'available')
    );
    const snapshot = await getDocs(q);
    
    // ✅ Filter by approved vendors
    const cars = snapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      .filter((car: any) => approvedVendorIds.has(car.vendorId));
    
    return { success: true, cars };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

/**
 * Get deal cars (for user home screen)
 */
export const getDealCars = async () => {
  try {
    // ✅ Get approved vendors
    const approvedVendorIds = await getApprovedVendorIds();
    
    const q = query(
      collection(db, 'cars'), 
      where('isDiscounted', '==', true),
      where('status', '==', 'available')
    );
    const snapshot = await getDocs(q);
    
    // ✅ Filter cars - only from approved vendors AND available status
const cars = snapshot.docs
  .map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }))
  .filter((car: any) => 
    approvedVendorIds.has(car.vendorId) && // ✅ Approved vendor
    car.status === 'available' // ✅ Car is available
  );
    
    return { success: true, cars };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

/**
 * Get all cars (for user browse screen)
 */
export const getAllCars = async () => {
  try {
    // ✅ Get approved vendors
    const approvedVendorIds = await getApprovedVendorIds();
    
    const carsSnapshot = await getDocs(collection(db, 'cars'));
    
   // ✅ Filter cars - only from approved vendors AND available status
const cars = carsSnapshot.docs
  .map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }))
  .filter((car: any) => 
    approvedVendorIds.has(car.vendorId) && // ✅ Approved vendor
    car.status === 'available' // ✅ Car is available
  );
    
    console.log(`✅ Loaded ${cars.length} cars from approved vendors`);
    
    return { success: true, cars };
  } catch (error: any) {
    console.error('Error fetching cars:', error);
    return { success: false, error: error.message };
  }
};