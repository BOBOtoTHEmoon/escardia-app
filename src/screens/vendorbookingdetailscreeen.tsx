import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { colors, typography, spacing, borderRadius } from '../constants';

interface VendorBookingDetailScreenProps {
  onNavigateBack: () => void;
  bookingId: string;
}

export const VendorBookingDetailScreen: React.FC<VendorBookingDetailScreenProps> = ({
  onNavigateBack,
  bookingId,
}) => {
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);

useEffect(() => {
  const fetchBookingDetails = async () => {
    try {
      console.log('🔵 Loading booking details:', bookingId);
      const { db } = await import('../config/firebase');
      const { doc, getDoc, updateDoc } = await import('firebase/firestore');
      const { calculateBookingStatus } = await import('../utils/dateHelpers'); // ✅ IMPORT

      const bookingDoc = await getDoc(doc(db, 'bookings', bookingId));
      
      if (bookingDoc.exists()) {
        const bookingData = bookingDoc.data();
        
        // ✅ USE NEW HELPER
        const actualStatus = calculateBookingStatus(
          bookingData.startDate,
          bookingData.startTime,
          bookingData.endDate,
          bookingData.stopTime
        );

        // Update status in Firebase if it changed
        if (actualStatus !== bookingData.status) {
          console.log(`🔄 Updating status from ${bookingData.status} to ${actualStatus}`);
          await updateDoc(doc(db, 'bookings', bookingId), {
            status: actualStatus,
          });
          bookingData.status = actualStatus;
        }

        setBooking({ id: bookingDoc.id, ...bookingData });
        console.log('✅ Booking loaded with status:', actualStatus);
      }
    } catch (error) {
      console.error('❌ Error loading booking:', error);
    } finally {
      setLoading(false);
    }
  };

  fetchBookingDetails();
}, [bookingId]);


  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming':
        return '#3B82F6';
      case 'ongoing':
        return '#10B981';
      case 'completed':
        return '#6B7280';
      default:
        return colors.textSecondary;
    }
  };

  const getStatusText = (status: string) => {
    if (!status) return 'Unknown';
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const handleContactCustomer = () => {
    if (booking?.customerPhone) {
      Alert.alert('Contact Customer', `Call ${booking.customerPhone}?`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Call', onPress: () => console.log('Call customer') },
      ]);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onNavigateBack} style={styles.backButton}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Booking Details</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  if (!booking) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onNavigateBack} style={styles.backButton}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Booking Details</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>Booking not found</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onNavigateBack} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Booking Details</Text>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(booking.status) },
          ]}
        >
          <Text style={styles.statusText}>{getStatusText(booking.status)}</Text>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Car Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🚗 Car Details</Text>
          <View style={styles.carCard}>
            {booking.car?.photos && booking.car.photos.length > 0 ? (
              <Image
                source={{ uri: booking.car.photos[0] }}
                style={styles.carImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.carImagePlaceholder}>
                <Text style={styles.placeholderText}>🚗</Text>
              </View>
            )}
            <View style={styles.carInfo}>
              <Text style={styles.carName}>
                {booking.car?.brand || booking.carBrand} {booking.car?.model || booking.carModel}
              </Text>
              <Text style={styles.carYear}>Year: {booking.car?.year || booking.carYear}</Text>
              <Text style={styles.carDetail}>
                {booking.rideMode === 'with-driver' ? '👨‍✈️ With Driver' : '🔑 Self Drive'}
              </Text>
            </View>
          </View>
        </View>

        {/* Customer Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>👤 Customer Information</Text>
          <View style={styles.customerCard}>
            <View style={styles.customerHeader}>
              <View style={styles.customerAvatar}>
                <Text style={styles.customerAvatarText}>
                  {booking.customerName ? booking.customerName.charAt(0).toUpperCase() : '?'}
                </Text>
              </View>
              <View style={styles.customerInfo}>
                <Text style={styles.customerName}>{booking.customerName || 'Unknown'}</Text>
                <Text style={styles.customerPhone}>📞 {booking.customerPhone || 'N/A'}</Text>
                {booking.customerEmail && (
                  <Text style={styles.customerEmail}>✉️ {booking.customerEmail}</Text>
                )}
              </View>
            </View>
            <TouchableOpacity style={styles.contactButton} onPress={handleContactCustomer}>
              <Text style={styles.contactButtonText}>📞 Contact Customer</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Booking Details Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📋 Booking Information</Text>
          <View style={styles.detailsCard}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Duration</Text>
              <Text style={styles.detailValue}>
                {booking.duration} {booking.durationType}{booking.duration > 1 ? 's' : ''}
              </Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Start Date & Time</Text>
              <Text style={styles.detailValue}>{booking.startDate}</Text>
              <Text style={styles.detailValueSmall}>{booking.startTime}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>End Date & Time</Text>
              <Text style={styles.detailValue}>{booking.endDate}</Text>
              <Text style={styles.detailValueSmall}>{booking.stopTime}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Pickup Method</Text>
              <Text style={styles.detailValue}>
                {booking.pickupMethod === 'vendor' ? '🏢 At Vendor Location' : '🚚 Delivery to Customer'}
              </Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Pickup Location</Text>
              <Text style={styles.detailValue}>{booking.pickupLocation}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Payment Method</Text>
              <Text style={styles.detailValue}>
                {booking.paymentMethod === 'card' ? '💳 Card' : 
                 booking.paymentMethod === 'bank' ? '🏦 Bank Transfer' : 
                 '👛 Wallet'}
              </Text>
            </View>

            {booking.escort && booking.escort.length > 0 && (
              <>
                <View style={styles.divider} />
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Escorts</Text>
                  <View>
                    {booking.escort.map((esc: any, index: number) => (
                      <Text key={index} style={styles.detailValue}>
                        {esc.count} {esc.type} escort{esc.count > 1 ? 's' : ''}
                      </Text>
                    ))}
                  </View>
                </View>
              </>
            )}
          </View>
        </View>

        {/* Pricing Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💰 Payment Details</Text>
          <View style={styles.pricingCard}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total Amount</Text>
              <Text style={styles.totalValue}>₦{booking.totalPrice?.toLocaleString() || '0'}</Text>
            </View>
          </View>
        </View>

        <View style={styles.bottomSpacing} />
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: 60,
    paddingBottom: spacing.md,
    backgroundColor: colors.background,
  },
  backButton: {
    padding: spacing.sm,
  },
  backIcon: {
    fontSize: 24,
    color: colors.text,
  },
  headerTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
  },
  headerSpacer: {
    width: 40,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  statusText: {
    fontSize: typography.fontSize.xs,
    color: colors.textWhite,
    fontWeight: typography.fontWeight.semiBold,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
  },
  errorText: {
    fontSize: typography.fontSize.base,
    color: '#EF4444',
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
  carCard: {
    backgroundColor: colors.backgroundGray,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  carImage: {
    width: '100%',
    height: 200,
  },
  carImagePlaceholder: {
    width: '100%',
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.inputBackground,
  },
  placeholderText: {
    fontSize: 80,
  },
  carInfo: {
    padding: spacing.md,
  },
  carName: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  carYear: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  carDetail: {
    fontSize: typography.fontSize.sm,
    color: colors.primary,
    fontWeight: typography.fontWeight.medium,
  },
  customerCard: {
    backgroundColor: colors.backgroundGray,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  customerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  customerAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  customerAvatarText: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.textWhite,
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  customerPhone: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  customerEmail: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  contactButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  contactButtonText: {
    color: colors.textWhite,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semiBold,
  },
  detailsCard: {
    backgroundColor: colors.backgroundGray,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  detailRow: {
    paddingVertical: spacing.sm,
  },
  detailLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: typography.fontSize.base,
    color: colors.text,
    fontWeight: typography.fontWeight.medium,
  },
  detailValueSmall: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.sm,
  },
  pricingCard: {
    backgroundColor: colors.primary + '15',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
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
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
  },
  bottomSpacing: {
    height: 40,
  },
});