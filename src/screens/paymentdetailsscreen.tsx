import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Button } from '../components';
import { colors, typography, spacing, borderRadius } from '../constants';
import { calculateTripPrice, formatCurrency } from '../services/pricingservice';

interface PaymentDetailsScreenProps {
  onNavigateBack: () => void;
  onNavigateToCardPayment: (totalAmount: number) => void;
  onNavigateToBankTransfer: (totalAmount: number) => void;
  onNavigateToWalletPayment: (totalAmount: number) => void;
  bookingData: {
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
        type: 'legion' | 'private'; // ✅ UPDATED
        count: number;
        pricePerPerson: number; // ✅ UPDATED
      }> | null;
      hiluxCount?: number; // ✅ NEW
      hiluxCost?: number; // ✅ NEW
      totalSecurityCost?: number; // ✅ NEW
    };
  };
}

const PaymentDetailsScreen: React.FC<PaymentDetailsScreenProps> = ({
  onNavigateBack,
  onNavigateToCardPayment,
  onNavigateToBankTransfer,
  onNavigateToWalletPayment,
  bookingData,
}) => {
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('');
  const [pricing, setPricing] = useState<any>(null);

  useEffect(() => {
    // Check if bookingData exists
    if (!bookingData || !bookingData.tripData || !bookingData.tripData.car) {
      console.error('Missing booking data');
      return;
    }

    console.log('📊 Booking Data:', bookingData); // ✅ Debug log

    // Calculate pricing when component mounts
    const calculatedPricing = calculateTripPrice({
      car: {
        pricePerDay: bookingData.tripData.car.pricePerDay,
        pricePerHour: bookingData.tripData.car.pricePerHour,
      },
      tripDetails: {
        durationType: bookingData.tripData.durationType,
        duration: bookingData.tripData.duration,
        pickupMethod: bookingData.tripData.pickupMethod,
        rideMode: bookingData.tripData.rideMode,
      },
      escorts: bookingData.escortData?.escorts || null, // ✅ NEW format
      hiluxCount: bookingData.escortData?.hiluxCount || 0, // ✅ NEW
      hiluxCost: bookingData.escortData?.hiluxCost || 0, // ✅ NEW
    });
    
    console.log('💰 Calculated Pricing:', calculatedPricing); // ✅ Debug log
    setPricing(calculatedPricing);
  }, [bookingData]);

  const paymentMethods = [
    { id: 'card', name: 'Credit/Debit Card', icon: require('../../assets/images/wallet.png') },
    { id: 'bank', name: 'Bank Transfer', icon: require('../../assets/images/wallet.png') },
    { id: 'wallet', name: 'Wallet', icon: require('../../assets/images/wallet.png') },
  ];

  const handlePayment = () => {
    if (!selectedPaymentMethod) {
      alert('Please select a payment method');
      return;
    }

    // Navigate to appropriate payment screen based on selection, passing total amount
    if (selectedPaymentMethod === 'card') {
      onNavigateToCardPayment(pricing.total);
    } else if (selectedPaymentMethod === 'bank') {
      onNavigateToBankTransfer(pricing.total);
    } else if (selectedPaymentMethod === 'wallet') {
      onNavigateToWalletPayment(pricing.total);
    }
  };

  if (!pricing || !bookingData?.tripData) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={onNavigateBack}>
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Payment Details</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading pricing...</Text>
        </View>
      </View>
    );
  }

  const { tripData } = bookingData;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onNavigateBack}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment Details</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Trip Summary Card */}
        <View style={styles.tripSummaryCard}>
          <Text style={styles.sectionTitle}>Trip Summary</Text>
          
          <View style={styles.tripInfoRow}>
            <Text style={styles.tripInfoLabel}>Car:</Text>
            <Text style={styles.tripInfoValue}>
              {tripData.car.brand} {tripData.car.model} {tripData.car.year}
            </Text>
          </View>
          
          <View style={styles.tripInfoRow}>
            <Text style={styles.tripInfoLabel}>Duration:</Text>
            <Text style={styles.tripInfoValue}>
              {tripData.duration} {tripData.durationType}{tripData.duration > 1 ? 's' : ''}
            </Text>
          </View>
          
          <View style={styles.tripInfoRow}>
            <Text style={styles.tripInfoLabel}>Pickup:</Text>
            <Text style={styles.tripInfoValue}>
              {tripData.pickupMethod === 'vendor' ? 'At Vendor' : 'Delivery'}
            </Text>
          </View>
          
          <View style={styles.tripInfoRow}>
            <Text style={styles.tripInfoLabel}>Mode:</Text>
            <Text style={styles.tripInfoValue}>
              {tripData.rideMode === 'self-drive' ? 'Self-Drive' : 'With Driver'}
            </Text>
          </View>
          
          <View style={styles.tripInfoRow}>
            <Text style={styles.tripInfoLabel}>Dates:</Text>
            <Text style={styles.tripInfoValue}>
              {tripData.startDate} - {tripData.endDate}
            </Text>
          </View>

          {/* ✅ Show Security Info if exists */}
          {bookingData.escortData && bookingData.escortData.escorts && bookingData.escortData.escorts.length > 0 && (
            <>
              <View style={styles.divider} />
              <Text style={[styles.sectionTitle, { fontSize: typography.fontSize.base, marginTop: spacing.sm }]}>
                🛡️ Security Details
              </Text>
              {bookingData.escortData.escorts.map((escort, index) => (
                <View key={index} style={styles.tripInfoRow}>
                  <Text style={styles.tripInfoLabel}>
                    {escort.type === 'legion' ? 'LEGION' : 'PRIVATE'}:
                  </Text>
                  <Text style={styles.tripInfoValue}>{escort.count} personnel</Text>
                </View>
              ))}
              {bookingData.escortData.hiluxCount && bookingData.escortData.hiluxCount > 0 && (
                <View style={styles.tripInfoRow}>
                  <Text style={styles.tripInfoLabel}>Transport:</Text>
                  <Text style={styles.tripInfoValue}>
                    {bookingData.escortData.hiluxCount} Hilux
                  </Text>
                </View>
              )}
            </>
          )}
        </View>

        {/* Pricing Breakdown */}
        <View style={styles.pricingCard}>
          <Text style={styles.sectionTitle}>Price Breakdown</Text>
          
          {pricing.breakdown.map((item: any, index: number) => (
            <View key={index} style={styles.priceRow}>
              <Text style={styles.priceLabel}>{item.label}</Text>
              <Text style={styles.priceValue}>{formatCurrency(item.amount)}</Text>
            </View>
          ))}
          
          <View style={styles.divider} />
          
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalValue}>{formatCurrency(pricing.total)}</Text>
          </View>
        </View>

        {/* Payment Method Selection */}
        <View style={styles.paymentMethodSection}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          
          {paymentMethods.map((method) => (
            <TouchableOpacity
              key={method.id}
              style={[
                styles.paymentMethodCard,
                selectedPaymentMethod === method.id && styles.paymentMethodCardActive,
              ]}
              onPress={() => setSelectedPaymentMethod(method.id)}
            >
              <View style={styles.paymentMethodContent}>
                <Image source={method.icon} style={styles.paymentIcon} resizeMode="contain" />
                <Text
                  style={[
                    styles.paymentMethodText,
                    selectedPaymentMethod === method.id && styles.paymentMethodTextActive,
                  ]}
                >
                  {method.name}
                </Text>
              </View>
              <View
                style={[
                  styles.radioButton,
                  selectedPaymentMethod === method.id && styles.radioButtonActive,
                ]}
              >
                {selectedPaymentMethod === method.id && <View style={styles.radioButtonInner} />}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Important Note */}
        <View style={styles.noteCard}>
          <Text style={styles.noteTitle}>📌 Important</Text>
          <Text style={styles.noteText}>
            • Payment is required to confirm your booking{'\n'}
            • Cancellation policy applies as per terms{'\n'}
            • You'll receive a booking confirmation after payment
          </Text>
        </View>
      </ScrollView>

      {/* Footer with Total and Pay Button */}
      <View style={styles.footer}>
        <View style={styles.footerPriceSection}>
          <Text style={styles.footerPriceLabel}>Total to Pay</Text>
          <Text style={styles.footerPriceValue}>{formatCurrency(pricing.total)}</Text>
        </View>
        <Button
          title="Proceed to Payment"
          onPress={handlePayment}
          style={styles.payButton}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl * 2,
    paddingBottom: spacing.lg,
    backgroundColor: colors.background,
  },
  backButton: {
    padding: spacing.sm,
  },
  backArrow: {
    fontSize: 24,
    color: colors.text,
  },
  headerTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text,
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  tripSummaryCard: {
    backgroundColor: colors.inputBackground,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  tripInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  tripInfoLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.regular,
    color: colors.textSecondary,
  },
  tripInfoValue: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text,
    textAlign: 'right',
    flex: 1,
    marginLeft: spacing.sm,
  },
  pricingCard: {
    backgroundColor: colors.inputBackground,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  priceLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.regular,
    color: colors.textSecondary,
    flex: 1,
  },
  priceValue: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.text,
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
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text,
  },
  totalValue: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
  },
  paymentMethodSection: {
    marginBottom: spacing.md,
  },
  paymentMethodCard: {
    backgroundColor: colors.inputBackground,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  paymentMethodCardActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight + '20',
  },
  paymentMethodContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paymentIcon: {
    width: 32,
    height: 32,
    marginRight: spacing.sm,
  },
  paymentMethodText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.textSecondary,
  },
  paymentMethodTextActive: {
    color: colors.primary,
    fontWeight: typography.fontWeight.semiBold,
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonActive: {
    borderColor: colors.primary,
  },
  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
  },
  noteCard: {
    backgroundColor: colors.warning + '20',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.xl,
  },
  noteTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  noteText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.regular,
    color: colors.textSecondary,
    lineHeight: typography.fontSize.sm * 1.5,
  },
  footer: {
    padding: spacing.lg,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  footerPriceSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  footerPriceLabel: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.textSecondary,
  },
  footerPriceValue: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
  },
  payButton: {
    width: '100%',
  },
});

export default PaymentDetailsScreen;