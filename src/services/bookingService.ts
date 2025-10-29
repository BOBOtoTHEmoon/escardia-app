import { collection, addDoc, getDocs, getDoc, query, where, orderBy, doc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

interface CancellationResult {
  success: boolean;
  refundPercentage?: number;
  error?: string;
}

/**
 * Calculate refund percentage based on time until trip starts
 */
const calculateRefund = (startDate: string, startTime: string): number => {
  const parseDate = (dateStr: string) => {
    const parts = dateStr.trim().split(' ');
    if (parts.length === 3) {
      const months: { [key: string]: number } = {
        'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
        'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
      };
      const day = parseInt(parts[0]);
      const month = months[parts[1]];
      const year = parseInt(parts[2]);
      return new Date(year, month, day);
    }
    return new Date();
  };

  const tripStart = parseDate(startDate);
  
  // Parse time (e.g., "10:00 AM")
  const timeParts = startTime.split(':');
  const hour = parseInt(timeParts[0]);
  const minutePart = timeParts[1].split(' ');
  const minute = parseInt(minutePart[0]);
  const ampm = minutePart[1];
  
  let finalHour = hour;
  if (ampm === 'PM' && hour !== 12) finalHour += 12;
  if (ampm === 'AM' && hour === 12) finalHour = 0;
  
  tripStart.setHours(finalHour, minute, 0, 0);

  const now = new Date();
  const hoursUntilTrip = (tripStart.getTime() - now.getTime()) / (1000 * 60 * 60);

  // Cancellation policy
  if (hoursUntilTrip >= 24) {
    return 100; // Full refund
  } else if (hoursUntilTrip >= 12) {
    return 50; // 50% refund
  } else if (hoursUntilTrip >= 2) {
    return 25; // 25% refund
  } else {
    return 0; // No refund
  }
};

/**
 * Cancel a booking
 */
export const cancelBooking = async (
  bookingId: string
): Promise<CancellationResult> => {
  try {
    // Get booking details first
    const bookingRef = doc(db, 'bookings', bookingId);
    const bookingSnap = await getDoc(bookingRef);

    if (!bookingSnap.exists()) {
      return {
        success: false,
        error: 'Booking not found',
      };
    }

    const booking = bookingSnap.data();

    // Check if booking can be cancelled
    if (booking.status === 'past') {
      return {
        success: false,
        error: 'Cannot cancel a completed trip',
      };
    }

    if (booking.status === 'cancelled') {
      return {
        success: false,
        error: 'This trip is already cancelled',
      };
    }

    if (booking.status === 'ongoing') {
      return {
        success: false,
        error: 'Cannot cancel an ongoing trip. Please contact support.',
      };
    }

    // Calculate refund
    const refundPercentage = calculateRefund(booking.startDate, booking.startTime);

    // Update booking status
    await updateDoc(bookingRef, {
      status: 'cancelled',
      cancelledAt: new Date().toISOString(),
      refundPercentage: refundPercentage,
    });

    return {
      success: true,
      refundPercentage: refundPercentage,
    };
  } catch (error: any) {
    console.error('Error cancelling booking:', error);
    return {
      success: false,
      error: error.message || 'Failed to cancel booking',
    };
  }
};

// Create a new booking
export const createBooking = async (bookingData: any) => {
  try {
    console.log('🔵 Creating booking with data:', bookingData);
    
    // Get the car document to find the vendorId
    const carId = bookingData.carId;
    console.log('🚗 Car ID from booking data:', carId); // ADD THIS
    
    if (carId) {
      const carDoc = await getDoc(doc(db, 'cars', carId));
      console.log('📄 Car document exists:', carDoc.exists()); // ADD THIS
      
      if (carDoc.exists()) {
        const carData = carDoc.data();
        console.log('🚗 Full car data:', carData); // ADD THIS
        bookingData.vendorId = carData.vendorId;
        console.log('✅ Found vendorId:', carData.vendorId);
        console.log('📝 Booking data after adding vendorId:', bookingData); // ADD THIS
      } else {
        console.log('❌ Car document does not exist!'); // ADD THIS
      }
    } else {
      console.log('❌ No carId in booking data!'); // ADD THIS
    }
    
    const booking = {
      ...bookingData,
      createdAt: new Date().toISOString(),
    };

    console.log('💾 Final booking object to be saved:', booking); // ADD THIS

    const docRef = await addDoc(collection(db, 'bookings'), booking);
    console.log('✅ Booking created with ID:', docRef.id);
    return { success: true, id: docRef.id };
  } catch (error: any) {
    console.error('❌ Error creating booking:', error);
    return { success: false, error: error.message };
  }
};
export const updateBooking = async (bookingId: string, updatedData: any) => {
  try {
    const bookingRef = doc(db, 'bookings', bookingId);
    await updateDoc(bookingRef, updatedData);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// Get user's bookings
export const getUserBookings = async (userId: string) => {
  try {
    const q = query(
      collection(db, 'bookings'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    const bookings = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    return { success: true, bookings };
  } catch (error: any) {
    console.error('Error fetching bookings:', error);
    return { success: false, error: error.message };
  }
};

// Get bookings by status
export const getBookingsByStatus = async (userId: string, status: 'upcoming' | 'ongoing' | 'past') => {
  try {
    const bookingsRef = collection(db, 'bookings');
    const q = query(bookingsRef, where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    
    const bookings = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    

    // Calculate real status based on current date
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const calculateRealStatus = (booking: any) => {
      const parseDate = (dateStr: string) => {
        const parts = dateStr.trim().split(' ');
        if (parts.length === 3) {
          const months: { [key: string]: number } = {
            'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
            'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
          };
          const day = parseInt(parts[0]);
          const month = months[parts[1]];
          const year = parseInt(parts[2]);
          return new Date(year, month, day);
        }
        return new Date();
      };

      const startDate = parseDate(booking.startDate);
      startDate.setHours(0, 0, 0, 0);
      
      const endDate = parseDate(booking.endDate);
      endDate.setHours(0, 0, 0, 0);

      if (now >= startDate && now <= endDate) {
        return 'ongoing';
      } else if (now > endDate) {
        return 'past';
      }
      return 'upcoming';
    };

    // Filter by calculated status instead of saved status
    const filteredBookings = bookings.filter(booking => {
      const realStatus = calculateRealStatus(booking);
      return realStatus === status;
    });

    return {
      success: true,
      bookings: filteredBookings
    };
  } catch (error: any) {
    console.error('Error fetching bookings:', error);
    return {
      success: false,
      error: error.message,
      bookings: []
    };
  }
};
// Recalculate booking status based on dates
const recalculateBookingStatus = (booking: any) => {
  const now = new Date();
  const startDate = new Date(booking.startDate);
  const endDate = new Date(booking.endDate);

  if (now < startDate) {
    return 'upcoming';
  } else if (now >= startDate && now <= endDate) {
    return 'ongoing';
  } else {
    return 'past';
  }
};

// Get bookings with recalculated status
export const getBookingsByStatusRecalculated = async (userId: string, status: string) => {
  try {
    const q = query(
      collection(db, 'bookings'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    const allBookings = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Recalculate status for each booking
    const bookingsWithUpdatedStatus = allBookings.map(booking => ({
      ...booking,
      currentStatus: recalculateBookingStatus(booking)
    }));

    // Filter by requested status
    const filteredBookings = bookingsWithUpdatedStatus.filter(
      booking => booking.currentStatus === status
    );

    return { success: true, bookings: filteredBookings };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};
/**
 * Get all bookings for a vendor's cars
 */
export const getVendorBookings = async (vendorId: string) => {
  try {
    console.log('🔵 Fetching bookings for vendor:', vendorId);
    
    const q = query(
      collection(db, 'bookings'),
      where('vendorId', '==', vendorId),
      orderBy('createdAt', 'desc')
    );
    
    const snapshot = await getDocs(q);
    const bookings = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    console.log(`✅ Found ${bookings.length} bookings for vendor`);
    return { success: true, bookings };
  } catch (error: any) {
    console.error('❌ Error fetching vendor bookings:', error);
    return { success: false, error: error.message };
  }
};