import { collection, addDoc, getDocs, getDoc, query, where, orderBy, doc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

// ============================================
// PUSH NOTIFICATION HELPER
// ============================================

const sendPushNotification = async (
  expoPushToken: string,
  title: string,
  body: string,
  data?: any
) => {
  try {
    const message = {
      to: expoPushToken,
      sound: 'default',
      title,
      body,
      data: data || {},
    };

    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    const result = await response.json();
    console.log('📨 Push notification sent:', result);
    return { success: true };
  } catch (error) {
    console.error('❌ Push notification error:', error);
    return { success: false, error };
  }
};

// ============================================
// CANCELLATION LOGIC
// ============================================

interface CancellationResult {
  success: boolean;
  refundPercentage?: number;
  error?: string;
}

/**Calculate refund percentage based on time until trip starts*/
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

/*Cancel a booking*/
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

    // ✅ Send notification to vendor about cancellation
    if (booking.vendorId) {
      try {
        const vendorDoc = await getDoc(doc(db, 'vendors', booking.vendorId));
        const vendorToken = vendorDoc.data()?.pushToken;

        if (vendorToken) {
          await sendPushNotification(
            vendorToken,
            '❌ Booking Cancelled',
            `A booking for your ${booking.carBrand || booking.car?.brand} ${booking.carModel || booking.car?.model} was cancelled`,
            { bookingId, type: 'booking_cancelled' }
          );
        }
      } catch (notifError) {
        console.error('Failed to send cancellation notification:', notifError);
      }
    }

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

// ============================================
// CREATE BOOKING (with Push Notification)
// ============================================

export const createBooking = async (bookingData: any) => {
  try {
    console.log('🔵 Creating booking with data:', bookingData);
    
    // Try to get vendorId from multiple sources
    let vendorId = bookingData.vendorId || bookingData.car?.vendorId;
    
    // If no vendorId yet, try to get from car document
    if (!vendorId && bookingData.carId) {
      console.log('🚗 Looking up car document for carId:', bookingData.carId);
      const carDoc = await getDoc(doc(db, 'cars', bookingData.carId));
      
      if (carDoc.exists()) {
        const carData = carDoc.data();
        vendorId = carData.vendorId;
        console.log('✅ Found vendorId from car doc:', vendorId);
        
        // ✅ Also add vendorId to car object for easy access
        if (!bookingData.car) bookingData.car = {};
        bookingData.car.vendorId = vendorId;
      } else {
        console.log('❌ Car document does not exist for carId:', bookingData.carId);
      }
    }
    
    if (!vendorId) {
      console.warn('⚠️ No vendorId found! Booking will be created without vendor reference.');
    }
    
    const booking = {
      ...bookingData,
      vendorId: vendorId, // ✅ Add at top level
      createdAt: new Date().toISOString(),
    };

    console.log('💾 Final booking object to be saved:', booking);

    const docRef = await addDoc(collection(db, 'bookings'), booking);
    console.log('✅ Booking created with ID:', docRef.id);

    // ============================================
    // ✅ SEND PUSH NOTIFICATION TO VENDOR
    // ============================================
    if (vendorId) {
      try {
        const vendorDoc = await getDoc(doc(db, 'vendors', vendorId));
        const vendorData = vendorDoc.data();
        const vendorToken = vendorData?.pushToken;

        if (vendorToken) {
          const carName = `${bookingData.carBrand || bookingData.car?.brand || ''} ${bookingData.carModel || bookingData.car?.model || ''}`.trim();
          const customerName = bookingData.customerName || 'A customer';
          const duration = bookingData.duration && bookingData.durationType 
            ? `${bookingData.duration} ${bookingData.durationType}${bookingData.duration > 1 ? 's' : ''}`
            : '';

          await sendPushNotification(
            vendorToken,
            '🚗 New Booking!',
            `${customerName} booked your ${carName}${duration ? ` for ${duration}` : ''}`,
            { 
              bookingId: docRef.id, 
              type: 'new_booking',
              carId: bookingData.carId,
            }
          );
          console.log('📨 Vendor notified of new booking');
        } else {
          console.log('⚠️ Vendor has no push token, notification not sent');
        }
      } catch (notifError) {
        console.error('❌ Failed to send booking notification:', notifError);
        // Don't fail the booking if notification fails
      }
    }

    // ============================================
    // ✅ SEND PUSH NOTIFICATION TO USER (confirmation)
    // ============================================
    if (bookingData.userId) {
      try {
        const userDoc = await getDoc(doc(db, 'users', bookingData.userId));
        const userData = userDoc.data();
        const userToken = userData?.pushToken;

        if (userToken) {
          const carName = `${bookingData.carBrand || bookingData.car?.brand || ''} ${bookingData.carModel || bookingData.car?.model || ''}`.trim();

          await sendPushNotification(
            userToken,
            '✅ Booking Confirmed!',
            `Your ${carName} booking is confirmed. Trip ID: ${docRef.id.slice(-6).toUpperCase()}`,
            { 
              bookingId: docRef.id, 
              type: 'booking_confirmed',
            }
          );
          console.log('📨 User notified of booking confirmation');
        }
      } catch (notifError) {
        console.error('❌ Failed to send user confirmation notification:', notifError);
        // Don't fail the booking if notification fails
      }
    }

    return { success: true, id: docRef.id };
  } catch (error: any) {
    console.error('❌ Error creating booking:', error);
    return { success: false, error: error.message };
  }
};

// ============================================
// UPDATE BOOKING
// ============================================

export const updateBooking = async (bookingId: string, updatedData: any) => {
  try {
    const bookingRef = doc(db, 'bookings', bookingId);
    await updateDoc(bookingRef, updatedData);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// ============================================
// GET USER BOOKINGS
// ============================================

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

// ============================================
// GET BOOKINGS BY STATUS
// ============================================

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
      // ✅ Handle cancelled bookings
      if (booking.status === 'cancelled') {
        return 'cancelled';
      }

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

// ============================================
// RECALCULATE BOOKING STATUS
// ============================================

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

// ============================================
// GET VENDOR BOOKINGS
// ============================================

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