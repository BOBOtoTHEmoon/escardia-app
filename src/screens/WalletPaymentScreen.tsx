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
import { auth, db } from '../config/firebase';
import { doc, getDoc, updateDoc, addDoc, collection, serverTimestamp, increment } from 'firebase/firestore';
import { calculatePaymentSplit, generateReference } from '../services/paystackService';
import { creditWallet } from '../services/walletService';

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

interface WalletPaymentScreenProps {
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

export const WalletPaymentScreen: React.FC<WalletPaymentScreenProps> = ({
  onNavigateBack,
  onPaymentComplete,
  totalAmount,
  bookingData,
}) => {
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);

  // Fetch wallet balance on mount
  useEffect(() => {
    fetchWalletBalance();
  }, []);

  const fetchWalletBalance = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const walletDoc = await getDoc(doc(db, 'wallets', user.uid));
      if (walletDoc.exists()) {
        setWalletBalance(walletDoc.data().balance || 0);
      } else {
        setWalletBalance(0);
      }
    } catch (error) {
      console.error('Error fetching wallet:', error);
      setWalletBalance(0);
    } finally {
      setLoading(false);
    }
  };

  const hasSufficientBalance = walletBalance >= totalAmount;
  const balanceAfterPayment = walletBalance - totalAmount;
  const split = calculatePaymentSplit(totalAmount);

  // Create booking and process wallet payment
  const handlePayWithWallet = async () => {
    if (!hasSufficientBalance) {
      Alert.alert(
        'Insufficient Balance',
        `You need ₦${(totalAmount - walletBalance).toLocaleString()} more. Would you like to top up your wallet?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Top Up', onPress: onNavigateBack },
        ]
      );
      return;
    }

    if (!bookingData?.tripData) {
      Alert.alert('Error', 'Booking data is missing.');
      return;
    }

    Alert.alert(
      'Confirm Payment',
      `Pay ₦${totalAmount.toLocaleString()} from your wallet?\n\nBalance after: ₦${balanceAfterPayment.toLocaleString()}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Pay Now', onPress: processWalletPayment },
      ]
    );
  };

  const processWalletPayment = async () => {
    setProcessing(true);

    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert('Error', 'Please log in to continue.');
        setProcessing(false);
        return;
      }

      const tripData = bookingData!.tripData;

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
      const startDate = parseDate(tripData.startDate);
      startDate.setHours(0, 0, 0, 0);
      const endDate = parseDate(tripData.endDate);
      endDate.setHours(0, 0, 0, 0);

      let status = 'upcoming';
      if (now >= startDate && now <= endDate) {
        status = 'ongoing';
      } else if (now > endDate) {
        status = 'past';
      }

      const paymentReference = generateReference('WLT-BKG');

      // ✅ Step 1: Create booking
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
        escort: bookingData!.escortData?.escorts || null,
        totalPrice: totalAmount,
        status: status,
        paymentStatus: 'paid',
        paymentMethod: 'wallet',
        paymentReference: paymentReference,
        durationType: tripData.durationType,
        duration: tripData.duration,
        paidAt: serverTimestamp(),
        createdAt: serverTimestamp(),
      };

      const bookingRef = await addDoc(collection(db, 'bookings'), booking);
      console.log('✅ Booking created:', bookingRef.id);

      // ✅ Step 2: Deduct from user wallet
      await updateDoc(doc(db, 'wallets', user.uid), {
        balance: increment(-totalAmount),
        updatedAt: serverTimestamp(),
      });

      // ✅ Step 3: Record transaction in user's wallet
      await addDoc(collection(db, 'transactions'), {
        userId: user.uid,
        type: 'debit',
        amount: totalAmount,
        description: `Booking payment: ${tripData.car.brand} ${tripData.car.model}`,
        reference: paymentReference,
        bookingId: bookingRef.id,
        status: 'completed',
        createdAt: serverTimestamp(),
      });

      // ✅ Step 4: Credit vendor wallet (90%)
      if (tripData.car.vendorId) {
        await creditWallet(
          tripData.car.vendorId,
          split.vendorAmount,
          `Booking payment: ${tripData.car.brand} ${tripData.car.model}`,
          'booking_payment',
          'wallet',
          paymentReference
        );
      }

      // ✅ Step 5: Record Escardia commission
      await addDoc(collection(db, 'commissions'), {
        bookingId: bookingRef.id,
        vendorId: tripData.car.vendorId,
        userId: user.uid,
        totalAmount: totalAmount,
        commissionAmount: split.escardiaCommission,
        vendorAmount: split.vendorAmount,
        commissionRate: 0.13,
        paymentMethod: 'wallet',
        reference: paymentReference,
        createdAt: serverTimestamp(),
      });

      // ============================================
      // ✅ SEND PUSH NOTIFICATION TO VENDOR
      // ============================================
      if (tripData.car.vendorId) {
        try {
          console.log('🔍 Looking up vendor:', tripData.car.vendorId);
          const vendorDoc = await getDoc(doc(db, 'vendors', tripData.car.vendorId));
          
          if (vendorDoc.exists()) {
            const vendorData = vendorDoc.data();
            const vendorToken = vendorData?.pushToken;
            
            console.log('🔍 Vendor push token:', vendorToken);

            if (vendorToken) {
              const carName = `${tripData.car.brand} ${tripData.car.model}`;
              await sendPushNotification(
                vendorToken,
                '🚗 New Booking!',
                `Someone booked your ${carName} for ₦${totalAmount.toLocaleString()}`,
                { 
                  bookingId: bookingRef.id, 
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
        const userToken = userProfile?.pushToken;

        if (userToken) {
          const carName = `${tripData.car.brand} ${tripData.car.model}`;
          await sendPushNotification(
            userToken,
            '✅ Booking Confirmed!',
            `Your ${carName} booking is confirmed!`,
            { 
              bookingId: bookingRef.id, 
              type: 'booking_confirmed',
            }
          );
        }
      } catch (notifError) {
        console.error('❌ Failed to send user notification:', notifError);
      }

      Alert.alert(
        '✅ Payment Successful!',
        `₦${totalAmount.toLocaleString()} has been deducted from your wallet.\n\nNew balance: ₦${balanceAfterPayment.toLocaleString()}`,
        [
          {
            text: 'Continue',
            onPress: () => onPaymentComplete('wallet'),
          },
        ]
      );
    } catch (error: any) {
      console.error('Wallet payment error:', error);
      Alert.alert('Payment Failed', error.message || 'Something went wrong. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const tripData = bookingData?.tripData;

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={onNavigateBack}>
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Wallet Payment</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading wallet...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onNavigateBack}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Wallet Payment</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Wallet Balance Card */}
        <View style={[styles.walletCard, !hasSufficientBalance && styles.walletCardInsufficient]}>
          <Text style={styles.walletLabel}>Wallet Balance</Text>
          <Text style={[styles.walletBalance, !hasSufficientBalance && styles.walletBalanceInsufficient]}>
            ₦{walletBalance.toLocaleString()}
          </Text>
          {!hasSufficientBalance && (
            <View style={styles.insufficientBadge}>
              <Text style={styles.insufficientText}>
                ⚠️ Insufficient funds (Need ₦{(totalAmount - walletBalance).toLocaleString()} more)
              </Text>
            </View>
          )}
        </View>

        {/* Amount Card */}
        <View style={styles.amountCard}>
          <Text style={styles.amountLabel}>Amount to Pay</Text>
          <Text style={styles.amountText}>₦{totalAmount.toLocaleString()}</Text>
        </View>

        {/* Balance After Payment */}
        {hasSufficientBalance && (
          <View style={styles.afterPaymentCard}>
            <Text style={styles.afterPaymentLabel}>Balance After Payment</Text>
            <Text style={styles.afterPaymentValue}>₦{balanceAfterPayment.toLocaleString()}</Text>
          </View>
        )}

        {/* Booking Summary */}
        {tripData && (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Booking Summary</Text>
            <Text style={styles.summaryText}>🚗 {tripData.car.brand} {tripData.car.model}</Text>
            <Text style={styles.summaryText}>⏱️ {tripData.duration} {tripData.durationType}{tripData.duration > 1 ? 's' : ''}</Text>
            <Text style={styles.summaryText}>📅 {tripData.startDate} - {tripData.endDate}</Text>
          </View>
        )}

        {/* Pay Button */}
        {hasSufficientBalance ? (
          <Button
            title={processing ? 'Processing...' : `Pay ₦${totalAmount.toLocaleString()}`}
            onPress={handlePayWithWallet}
            disabled={processing}
            style={styles.payButton}
          />
        ) : (
          <Button
            title="Top Up Wallet"
            onPress={onNavigateBack}
            style={styles.topUpButton}
          />
        )}

        {processing && (
          <View style={styles.processingOverlay}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.processingText}>Processing payment...</Text>
          </View>
        )}

        {/* Security Note */}
        <View style={styles.securityNote}>
          <Text style={styles.securityText}>
            🔒 Instant payment from your Escardia wallet
          </Text>
        </View>
      </ScrollView>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xl * 2,
  },
  walletCard: {
    backgroundColor: '#D1FAE5',
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#10B981',
  },
  walletCardInsufficient: {
    backgroundColor: '#FEE2E2',
    borderColor: '#EF4444',
  },
  walletLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  walletBalance: {
    fontSize: 32,
    fontWeight: '700',
    color: '#059669',
  },
  walletBalanceInsufficient: {
    color: '#DC2626',
  },
  insufficientBadge: {
    marginTop: spacing.sm,
    backgroundColor: '#FEF2F2',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  insufficientText: {
    fontSize: typography.fontSize.sm,
    color: '#DC2626',
    fontWeight: '500',
  },
  amountCard: {
    backgroundColor: colors.primary + '15',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    alignItems: 'center',
  },
  amountLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  amountText: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.primary,
  },
  afterPaymentCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  afterPaymentLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  afterPaymentValue: {
    fontSize: typography.fontSize.lg,
    fontWeight: '700',
    color: '#3B82F6',
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
  payButton: {
    marginBottom: spacing.lg,
  },
  topUpButton: {
    marginBottom: spacing.lg,
    backgroundColor: '#F59E0B',
  },
  processingOverlay: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  processingText: {
    marginTop: spacing.sm,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  securityNote: {
    padding: spacing.md,
    backgroundColor: '#D1FAE5',
    borderRadius: borderRadius.md,
  },
  securityText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});

export default WalletPaymentScreen;