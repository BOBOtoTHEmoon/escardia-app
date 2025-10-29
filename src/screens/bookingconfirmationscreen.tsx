import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Clipboard,
  Alert,
} from 'react-native';
import { Button } from '../components';
import { colors, typography, spacing, borderRadius } from '../constants';

interface BookingConfirmationScreenProps {
  onBackToHome: () => void;
  bookingData: {
    bookingId?: string; // Firebase booking ID
    tripData: {
      car: any;
      pickupLocation: string;
      deliveryAddress?: string;
      pickupMethod: 'vendor' | 'delivery';
      rideMode: 'self-drive' | 'with-driver';
      startDate: string;
      endDate: string;
      startTime: string;
      stopTime: string;
      duration: number;
      durationType: 'day' | 'hour';
    };
    escortData?: {
      escorts: Array<{
        type: 'basic' | 'premium' | 'vip';
        count: number;
        price: number;
      }> | null;
    };
  };
  totalAmount: number;
  paymentMethod: string;
}

export const BookingConfirmationScreen: React.FC<BookingConfirmationScreenProps> = ({
  onBackToHome,
  bookingData,
  totalAmount,
  paymentMethod,
}) => {
  const [tripId, setTripId] = useState('');

  useEffect(() => {
  // Use Firebase booking ID if available, otherwise generate one
  if (bookingData.bookingId) {
    setTripId(bookingData.bookingId);
  } else {
    const generateTripId = () => {
      const timestamp = Date.now();
      const random = Math.floor(Math.random() * 10000);
      return `ESC${timestamp}${random}`;
    };
    setTripId(generateTripId());
  }
}, [bookingData.bookingId]);
  const copyTripId = () => {
    Clipboard.setString(tripId);
    Alert.alert('Copied!', 'Trip ID copied to clipboard');
  };

  const { tripData, escortData } = bookingData;

  // Calculate total escorts
  const totalEscorts = escortData?.escorts?.reduce((sum, escort) => sum + escort.count, 0) || 0;

  // Get escort details string
  const getEscortDetails = () => {
    if (!escortData?.escorts || escortData.escorts.length === 0) {
      return 'None';
    }
    return escortData.escorts
      .map(escort => `${escort.count} ${escort.type}`)
      .join(', ');
  };

  // Format payment method
  const formatPaymentMethod = (method: string) => {
    if (method === 'card') return 'Credit/Debit Card';
    if (method === 'bank') return 'Bank Transfer';
    if (method === 'wallet') return 'Escardia Wallet';
    return method;
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Success Icon */}
        <View style={styles.successSection}>
          <View style={styles.successIcon}>
            <Text style={styles.checkmark}>✓</Text>
          </View>
          <Text style={styles.successTitle}>Booking Confirmed!</Text>
          <Text style={styles.successSubtitle}>
            Your rental has been successfully booked
          </Text>
        </View>

        {/* Car Image */}
        <View style={styles.carImageSection}>
          <View style={styles.carImageContainer}>
            <Text style={styles.carImagePlaceholder}>🚗</Text>
          </View>
          <View style={styles.carImageDots}>
            <View style={[styles.dot, styles.dotActive]} />
            <View style={styles.dot} />
            <View style={styles.dot} />
          </View>
        </View>

        {/* Car Details */}
        <View style={styles.carDetailsSection}>
          <Text style={styles.carName}>
            {tripData.car.brand || 'Lexus'} {tripData.car.model}
          </Text>
          <View style={styles.carMetaRow}>
            <Text style={styles.carMeta}>{tripData.car.year}</Text>
            <View style={styles.dividerDot} />
            <Text style={styles.carPrice}>
              ₦{(tripData.durationType === 'day' 
                ? tripData.car.pricePerDay 
                : tripData.car.pricePerHour
              ).toLocaleString()}/{tripData.durationType}
            </Text>
          </View>
        </View>

        {/* Booking Information */}
        <View style={styles.section}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Trip Duration</Text>
            <Text style={styles.infoValue}>
              {tripData.duration} {tripData.durationType}{tripData.duration > 1 ? 's' : ''}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Start Time</Text>
            <Text style={styles.infoValue}>
              {tripData.startDate}, {tripData.startTime}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>End Time</Text>
            <Text style={styles.infoValue}>
              {tripData.endDate}, {tripData.stopTime}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Pickup Location</Text>
            <Text style={styles.infoValue}>
              {tripData.pickupMethod === 'vendor' ? 'At Vendor' : 'Delivery'}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Escort Option</Text>
            <Text style={styles.infoValue}>
              {getEscortDetails()}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Ride Mode</Text>
            <Text style={styles.infoValue}>
              {tripData.rideMode === 'with-driver' ? 'With Driver' : 'Self-Drive'}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Trip ID</Text>
            <TouchableOpacity style={styles.tripIdContainer} onPress={copyTripId}>
              <Text style={styles.infoValue} numberOfLines={1}>{tripId}</Text>
              <Text style={styles.copyIcon}>📋</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Payment Method</Text>
            <Text style={styles.infoValue}>{formatPaymentMethod(paymentMethod)}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Cost</Text>
            <Text style={styles.totalValue}>₦{totalAmount.toLocaleString()}</Text>
          </View>
        </View>

        {/* Driver/Vendor Details - Only show if with driver or delivery */}
        {(tripData.rideMode === 'with-driver' || tripData.pickupMethod === 'delivery') && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {tripData.rideMode === 'with-driver' ? 'Driver Details' : 'Vendor Details'}
            </Text>

            <View style={styles.driverCard}>
              <View style={styles.driverInfo}>
                <View style={styles.driverAvatar}>
                  <Text style={styles.driverAvatarText}>👤</Text>
                </View>
                <View style={styles.driverTextInfo}>
                  <Text style={styles.driverName}>
                    {tripData.rideMode === 'with-driver' ? 'Driver' : 'Vendor'} will be assigned
                  </Text>
                  <Text style={styles.driverPhone}>You'll be notified shortly</Text>
                </View>
              </View>
              <View style={styles.driverActions}>
                <TouchableOpacity style={styles.actionButton} disabled>
                  <Text style={styles.actionIcon}>💬</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton} disabled>
                  <Text style={styles.actionIcon}>📞</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.infoCard}>
              <Text style={styles.infoCardText}>
                📌 {tripData.rideMode === 'with-driver' ? 'Your driver' : 'The vendor'} will contact you before the trip start time
              </Text>
            </View>
          </View>
        )}

        {/* Next Steps */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What's Next?</Text>
          <View style={styles.stepsCard}>
            <View style={styles.stepRow}>
              <Text style={styles.stepNumber}>1</Text>
              <Text style={styles.stepText}>
                You'll receive a confirmation email with your trip details
              </Text>
            </View>
            <View style={styles.stepRow}>
              <Text style={styles.stepNumber}>2</Text>
              <Text style={styles.stepText}>
                {tripData.pickupMethod === 'vendor' 
                  ? 'Visit the vendor location at the scheduled time'
                  : 'The car will be delivered to your address'}
              </Text>
            </View>
            <View style={styles.stepRow}>
              <Text style={styles.stepNumber}>3</Text>
              <Text style={styles.stepText}>
                Enjoy your trip! Drive safely
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <Button
          title="Back to Home"
          onPress={onBackToHome}
          style={styles.homeButton}
        />
        <TouchableOpacity style={styles.viewTripsButton}>
          <Text style={styles.viewTripsText}>View My Trips</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  successSection: {
    alignItems: 'center',
    paddingTop: spacing['2xl'] * 2,
    paddingBottom: spacing.xl,
    backgroundColor: colors.backgroundGray,
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.success,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  checkmark: {
    fontSize: 48,
    color: colors.textWhite,
    fontWeight: typography.fontWeight.bold,
  },
  successTitle: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  successSubtitle: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  carImageSection: {
    backgroundColor: colors.backgroundGray,
    paddingBottom: spacing.xl,
    alignItems: 'center',
  },
  carImageContainer: {
    width: 200,
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
  },
  carImagePlaceholder: {
    fontSize: 100,
  },
  carImageDots: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
  },
  dotActive: {
    backgroundColor: colors.primary,
    width: 24,
  },
  carDetailsSection: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    backgroundColor: colors.backgroundGray,
  },
  carName: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  carMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  carMeta: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  dividerDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.textSecondary,
  },
  carPrice: {
    fontSize: typography.fontSize.sm,
    color: colors.primary,
    fontWeight: typography.fontWeight.semiBold,
  },
  section: {
    padding: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  infoLabel: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    flex: 1,
  },
  infoValue: {
    fontSize: typography.fontSize.base,
    color: colors.text,
    fontWeight: typography.fontWeight.medium,
    flex: 1,
    textAlign: 'right',
  },
  tripIdContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flex: 1,
    justifyContent: 'flex-end',
  },
  copyIcon: {
    fontSize: 16,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
  },
  totalValue: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
  },
  driverCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.inputBackground,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
  },
  driverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  driverAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  driverAvatarText: {
    fontSize: 24,
  },
  driverTextInfo: {
    flex: 1,
  },
  driverName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  driverPhone: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  driverActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary + '40',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionIcon: {
    fontSize: 20,
  },
  infoCard: {
    backgroundColor: colors.info + '15',
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
  infoCardText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    lineHeight: typography.fontSize.sm * 1.5,
  },
  stepsCard: {
    backgroundColor: colors.inputBackground,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    color: colors.textWhite,
    textAlign: 'center',
    lineHeight: 28,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    marginRight: spacing.md,
  },
  stepText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    lineHeight: typography.fontSize.sm * 1.5,
  },
  bottomSpacing: {
    height: 100,
  },
  footer: {
    padding: spacing.lg,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  homeButton: {
    marginBottom: spacing.sm,
  },
  viewTripsButton: {
    padding: spacing.md,
    alignItems: 'center',
  },
  viewTripsText: {
    fontSize: typography.fontSize.base,
    color: colors.primary,
    fontWeight: typography.fontWeight.semiBold,
  },
});