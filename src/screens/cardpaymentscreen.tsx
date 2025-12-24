import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { colors, typography, spacing, borderRadius } from '../constants';
import { Button } from '../components';
import { PaystackWebView } from '../components/PaystackWebView';
import { 
  initializeBookingPayment, 
  verifyPayment,
  calculatePaymentSplit,
} from '../services/paystackService';
import { creditWallet } from '../services/walletService';
import { auth, db } from '../config/firebase';
import { doc, updateDoc, getDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';

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
    console.log('📨 Sending push notification to:', expoPushToken);
    
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: expoPushToken,
        sound: 'default',
        title,
        body,
        data: data || {},
      }),
    });
    
    const result = await response.json();
    console.log('📨 Push notification result:', result);
    return { success: true, result };
  } catch (error) {
    console.error('❌ Push notification error:', error);
    return { success: false, error };
  }
};

interface CardPaymentScreenProps {
  onNavigateBack: () => void;
  onPaymentComplete: (paymentMethod: string) => void;
  totalAmount: number;
  bookingData?: {
    tripData: {
      car: any;
      pickupLocation: string;
      pickupMethod: string;
      rideMode: string;
      startDate: string;
      endDate: string;
      startTime: string;
      stopTime: string;
      duration: number;
      durationType: string;
    };
    escortData?: any;
  };
}

export const CardPaymentScreen: React.FC<CardPaymentScreenProps> = ({
  onNavigateBack,
  onPaymentComplete,
  totalAmount,
  bookingData,
}) => {
  const [loading, setLoading] = useState(false);
  const [showPaystack, setShowPaystack] = useState(false);
  const [authorizationUrl, setAuthorizationUrl] = useState('');
  const [paymentReference, setPaymentReference] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [createdBookingId, setCreatedBookingId] = useState<string | null>(null);

  // Get user email on mount
  useEffect(() => {
    const fetchUserEmail = async () => {
      const user = auth.currentUser;
      if (user) {
        if (user.email) {
          setUserEmail(user.email);
        } else {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            setUserEmail(userDoc.data().email || '');
          }
        }
      }
    };
    fetchUserEmail();
  }, []);

  // Calculate split
  const split = calculatePaymentSplit(totalAmount);

  // Create booking with pending_payment status
  const createPendingBooking = async (): Promise<string | null> => {
    try {
      const user = auth.currentUser;
      if (!user || !bookingData?.tripData) return null;

      // Get user profile
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const userProfile = userDoc.exists() ? userDoc.data() : {};

      // Parse dates for status
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

      const now = new Date();
      now.setHours(0, 0, 0, 0);
      const startDate = parseDate(bookingData.tripData.startDate);
      startDate.setHours(0, 0, 0, 0);
      const endDate = parseDate(bookingData.tripData.endDate);
      endDate.setHours(0, 0, 0, 0);

      let status = 'upcoming';
      if (now >= startDate && now <= endDate) {
        status = 'ongoing';
      } else if (now > endDate) {
        status = 'past';
      }

      const tripData = bookingData.tripData;

      const booking = {
        userId: user.uid,
        customerName: `${userProfile?.firstName || ''} ${userProfile?.lastName || ''}`.trim() || 'Guest',
        customerPhone: userProfile?.phoneNumber || 'N/A',
        customerEmail: userProfile?.email || user.email || 'N/A',
        carId: tripData.car.id,
        vendorId: tripData.car.vendorId,
        carBrand: tripData.car.brand,
        carModel: tripData.car.model,
        carYear: tripData.car.year,
        car: {
          id: tripData.car.id,
          brand: tripData.car.brand,
          model: tripData.car.model,
          year: tripData.car.year,
          pricePerDay: tripData.car.pricePerDay,
          pricePerHour: tripData.car.pricePerHour,
          photos: tripData.car.photos || [],
          seats: tripData.car.seats,
          doors: tripData.car.doors,
          transmission: tripData.car.transmission,
          location: tripData.car.location,
          vendorId: tripData.car.vendorId,
        },
        pickupLocation: tripData.pickupLocation,
        pickupMethod: tripData.pickupMethod,
        startDate: tripData.startDate,
        endDate: tripData.endDate,
        startTime: tripData.startTime,
        stopTime: tripData.stopTime,
        rideMode: tripData.rideMode,
        escort: bookingData.escortData?.escorts || null,
        totalPrice: totalAmount,
        status: status,
        paymentStatus: 'pending',
        paymentMethod: 'card',
        durationType: tripData.durationType,
        duration: tripData.duration,
        createdAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, 'bookings'), booking);
      console.log('✅ Created pending booking:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error creating pending booking:', error);
      return null;
    }
  };

  // Initialize payment
  const handlePayNow = async () => {
    if (!userEmail) {
      Alert.alert('Error', 'Could not retrieve your email. Please try again.');
      return;
    }

    if (!bookingData?.tripData) {
      Alert.alert('Error', 'Booking data is missing.');
      return;
    }

    setLoading(true);

    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert('Error', 'Please log in to continue.');
        setLoading(false);
        return;
      }

      // ✅ Step 1: Create booking with pending status FIRST
      const bookingId = await createPendingBooking();
      if (!bookingId) {
        Alert.alert('Error', 'Failed to create booking. Please try again.');
        setLoading(false);
        return;
      }
      setCreatedBookingId(bookingId);

      const tripData = bookingData.tripData;

      // ✅ Step 2: Initialize payment with real booking ID
      const result = await initializeBookingPayment(
        userEmail,
        totalAmount,
        {
          bookingId: bookingId,
          userId: user.uid,
          vendorId: tripData.car.vendorId || '',
          carId: tripData.car.id || '',
          carName: `${tripData.car.brand} ${tripData.car.model}`,
          duration: `${tripData.duration} ${tripData.durationType}${tripData.duration > 1 ? 's' : ''}`,
        }
      );

      if (result.success && result.authorizationUrl) {
        setAuthorizationUrl(result.authorizationUrl);
        setPaymentReference(result.reference || '');
        setShowPaystack(true);
      } else {
        // ✅ If payment init fails, mark booking as failed
        await updateDoc(doc(db, 'bookings', bookingId), {
          status: 'cancelled',
          paymentStatus: 'failed',
          cancelledAt: serverTimestamp(),
        });
        Alert.alert('Payment Error', result.error || 'Failed to initialize payment');
      }
    } catch (error: any) {
      console.error('Payment initialization error:', error);
      Alert.alert('Error', error.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  // Handle successful payment
  const handlePaymentSuccess = async (reference: string) => {
    setShowPaystack(false);
    setLoading(true);

    try {
      // Verify payment with Paystack
      const verification = await verifyPayment(reference);
      const tripData = bookingData?.tripData;

      if (verification.success && createdBookingId) {
        // ✅ Update booking status to paid
        await updateDoc(doc(db, 'bookings', createdBookingId), {
          paymentStatus: 'paid',
          paymentReference: reference,
          paidAt: serverTimestamp(),
        });

        // ✅ Credit vendor wallet (90%)
        if (tripData?.car?.vendorId) {
          await creditWallet(
            tripData.car.vendorId,
            split.vendorAmount,
            `Booking payment: ${tripData.car.brand} ${tripData.car.model}`,
            'booking_payment',
            'card',
            reference
          );
        }

        // ============================================
        // ✅ SEND PUSH NOTIFICATION TO VENDOR
        // ============================================
        if (tripData?.car?.vendorId) {
          try {
            console.log('🔍 Looking up vendor:', tripData.car.vendorId);
            const vendorDoc = await getDoc(doc(db, 'vendors', tripData.car.vendorId));
            
            if (vendorDoc.exists()) {
              const vendorData = vendorDoc.data();
              const vendorToken = vendorData?.pushToken;
              
              console.log('🔍 Vendor data:', vendorData);
              console.log('🔍 Vendor push token:', vendorToken);

              if (vendorToken) {
                const carName = `${tripData.car.brand} ${tripData.car.model}`;
                await sendPushNotification(
                  vendorToken,
                  '🚗 New Booking!',
                  `Someone booked your ${carName} for ₦${totalAmount.toLocaleString()}`,
                  { 
                    bookingId: createdBookingId, 
                    type: 'new_booking',
                    carId: tripData.car.id,
                  }
                );
              } else {
                console.log('⚠️ Vendor has no push token');
              }
            } else {
              console.log('⚠️ Vendor document not found');
            }
          } catch (notifError) {
            console.error('❌ Failed to send vendor notification:', notifError);
          }
        }

        // ============================================
        // ✅ SEND PUSH NOTIFICATION TO USER (confirmation)
        // ============================================
        try {
          const user = auth.currentUser;
          if (user) {
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            const userToken = userDoc.data()?.pushToken;

            if (userToken) {
              const carName = `${tripData?.car.brand} ${tripData?.car.model}`;
              await sendPushNotification(
                userToken,
                '✅ Booking Confirmed!',
                `Your ${carName} booking is confirmed!`,
                { 
                  bookingId: createdBookingId, 
                  type: 'booking_confirmed',
                }
              );
            }
          }
        } catch (notifError) {
          console.error('❌ Failed to send user notification:', notifError);
        }

        Alert.alert(
          '✅ Payment Successful!',
          `Your payment of ₦${totalAmount.toLocaleString()} has been processed.`,
          [
            {
              text: 'Continue',
              onPress: () => onPaymentComplete('card'),
            },
          ]
        );
      } else {
        Alert.alert('Payment Verification Failed', verification.error || 'Please contact support.');
      }
    } catch (error: any) {
      console.error('Payment verification error:', error);
      Alert.alert('Error', 'Payment verification failed. Please contact support.');
    } finally {
      setLoading(false);
    }
  };

  // Handle cancelled payment
  const handlePaymentCancel = async () => {
    setShowPaystack(false);
    
    if (createdBookingId) {
      await updateDoc(doc(db, 'bookings', createdBookingId), {
        paymentStatus: 'cancelled',
        cancelledAt: serverTimestamp(),
      });
    }
    
    Alert.alert('Payment Cancelled', 'You cancelled the payment. Please try again.');
  };

  const tripData = bookingData?.tripData;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onNavigateBack}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Card Payment</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Amount Card */}
        <View style={styles.amountCard}>
          <Text style={styles.amountLabel}>Amount to Pay</Text>
          <Text style={styles.amountText}>₦{totalAmount.toLocaleString()}</Text>
        </View>
   
        {/* Booking Summary */}
        {tripData && (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Booking Summary</Text>
            <Text style={styles.summaryText}>🚗 {tripData.car.brand} {tripData.car.model}</Text>
            <Text style={styles.summaryText}>⏱️ {tripData.duration} {tripData.durationType}{tripData.duration > 1 ? 's' : ''}</Text>
            <Text style={styles.summaryText}>📅 {tripData.startDate} - {tripData.endDate}</Text>
          </View>
        )}

        {/* Payment Methods Info */}
        <View style={styles.methodsCard}>
          <Text style={styles.methodsTitle}>💳 Accepted Payment Methods</Text>
          <Text style={styles.methodsText}>
            • Visa / Mastercard / Verve{'\n'}
            • Bank Transfer{'\n'}
            • USSD{'\n'}
            • Bank Account
          </Text>
        </View>

        {/* Security Note */}
        <View style={styles.securityNote}>
          <Text style={styles.securityText}>
            🔒 Your payment is secured with 256-bit SSL encryption via Paystack
          </Text>
        </View>

        {/* Pay Button */}
        <Button
          title={loading ? 'Processing...' : `Pay ₦${totalAmount.toLocaleString()}`}
          onPress={handlePayNow}
          disabled={loading}
          style={styles.payButton}
        />

        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>
              {createdBookingId ? 'Initializing payment...' : 'Creating booking...'}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Paystack WebView Modal */}
      <PaystackWebView
        visible={showPaystack}
        authorizationUrl={authorizationUrl}
        reference={paymentReference}
        onSuccess={handlePaymentSuccess}
        onCancel={handlePaymentCancel}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingTop: 60,
    paddingBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.background,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.inputBackground,
    borderRadius: borderRadius.md,
  },
  backArrow: {
    fontSize: 20,
    color: colors.text,
  },
  headerTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '700',
    color: colors.text,
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xl * 2,
  },
  amountCard: {
    backgroundColor: colors.primary + '15',
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    alignItems: 'center',
  },
  amountLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  amountText: {
    fontSize: 36,
    fontWeight: '700',
    color: colors.primary,
  },
  summaryCard: {
    backgroundColor: colors.inputBackground,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  summaryTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  summaryText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  methodsCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  methodsTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  methodsText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  securityNote: {
    padding: spacing.md,
    backgroundColor: '#D1FAE5',
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
  },
  securityText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  payButton: {
    marginTop: spacing.md,
  },
  loadingOverlay: {
    marginTop: spacing.lg,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.sm,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
});

export default CardPaymentScreen;