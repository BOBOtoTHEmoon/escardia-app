// ============================================
// CARD PAYMENT SCREEN (Updated)
// ============================================
// File: src/screens/CardPaymentScreen.tsx

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { colors, typography, spacing, borderRadius } from '../constants';
import { Button } from '../components';

const CARD_TYPES = ['Visa', 'Mastercard', 'Verve'];

interface CardPaymentScreenProps {
  onNavigateBack: () => void;
  onPaymentComplete: () => void;
  totalAmount: number;
}

export const CardPaymentScreen: React.FC<CardPaymentScreenProps> = ({
  onNavigateBack,
  onPaymentComplete,
  totalAmount,
}) => {
  const [name, setName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cvv, setCvv] = useState('');
  const [expiry, setExpiry] = useState('');
  const [selectedCard, setSelectedCard] = useState('Visa');

  const handlePayment = () => {
    // Validate inputs
    if (!name || !cardNumber || !cvv || !expiry) {
      alert('Please fill in all card details');
      return;
    }

    if (cardNumber.replace(/\s/g, '').length !== 16) {
      alert('Card number must be 16 digits');
      return;
    }

    if (cvv.length !== 3) {
      alert('CVV must be 3 digits');
      return;
    }

    // Simulate payment processing
    alert('Processing payment...');
    setTimeout(() => {
      onPaymentComplete();
    }, 1500);
  };

  const formatCardNumber = (text: string) => {
    // Remove all non-digits
    const cleaned = text.replace(/\D/g, '');
    // Add space every 4 digits
    const formatted = cleaned.match(/.{1,4}/g)?.join(' ') || cleaned;
    setCardNumber(formatted);
  };

  const formatExpiry = (text: string) => {
    // Remove all non-digits
    const cleaned = text.replace(/\D/g, '');
    // Add slash after 2 digits
    if (cleaned.length >= 2) {
      setExpiry(cleaned.slice(0, 2) + '/' + cleaned.slice(2, 4));
    } else {
      setExpiry(cleaned);
    }
  };

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
        {/* Card Type Selector */}
        <Text style={styles.label}>Select Card Type</Text>
        <View style={styles.cardTypeRow}>
          {CARD_TYPES.map((type) => {
            const isActive = selectedCard === type;
            return (
              <TouchableOpacity
                key={type}
                style={[
                  styles.cardTypeButton,
                  isActive && styles.cardTypeButtonActive,
                ]}
                onPress={() => setSelectedCard(type)}>
                <Text
                  style={[
                    styles.cardTypeText,
                    isActive && styles.cardTypeTextActive,
                  ]}>
                  {type}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Input Fields */}
        <Text style={styles.label}>Cardholder Name</Text>
        <TextInput
          placeholder="John Doe"
          placeholderTextColor={colors.textSecondary}
          style={styles.input}
          value={name}
          onChangeText={setName}
        />

        <Text style={styles.label}>Card Number</Text>
        <TextInput
          placeholder="0000 0000 0000 0000"
          placeholderTextColor={colors.textSecondary}
          style={styles.input}
          keyboardType="number-pad"
          value={cardNumber}
          onChangeText={formatCardNumber}
          maxLength={19} // 16 digits + 3 spaces
        />

        <View style={styles.row}>
          <View style={{ flex: 1, marginRight: spacing.sm }}>
            <Text style={styles.label}>CVV</Text>
            <TextInput
              placeholder="123"
              placeholderTextColor={colors.textSecondary}
              style={styles.input}
              keyboardType="number-pad"
              value={cvv}
              onChangeText={setCvv}
              maxLength={3}
              secureTextEntry
            />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Expiry Date</Text>
            <TextInput
              placeholder="MM/YY"
              placeholderTextColor={colors.textSecondary}
              style={styles.input}
              keyboardType="number-pad"
              value={expiry}
              onChangeText={formatExpiry}
              maxLength={5}
            />
          </View>
        </View>

        {/* Amount Display */}
        <View style={styles.amountCard}>
          <Text style={styles.amountLabel}>Amount to be paid</Text>
          <Text style={styles.amountText}>₦{totalAmount.toLocaleString()}</Text>
        </View>

        <Button
          title={`Pay ₦${totalAmount.toLocaleString()} with ${selectedCard}`}
          onPress={handlePayment}
          style={styles.paymentButton}
        />

        {/* Security Note */}
        <View style={styles.securityNote}>
          <Text style={styles.securityText}>
            🔒 Your payment is secured with 256-bit SSL encryption
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: colors.background 
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
    color: colors.text 
  },
  headerTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
  },
  headerSpacer: { 
    width: 40 
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xl * 2,
  },
  label: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.text,
    marginBottom: spacing.xs,
    marginTop: spacing.sm,
  },
  input: {
    backgroundColor: colors.inputBackground,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    color: colors.text,
    fontSize: typography.fontSize.base,
  },
  row: { 
    flexDirection: 'row', 
    justifyContent: 'space-between' 
  },
  cardTypeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  cardTypeButton: {
    flex: 1,
    backgroundColor: colors.inputBackground,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  cardTypeButtonActive: {
    backgroundColor: colors.primary,
  },
  cardTypeText: {
    color: colors.text,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
  },
  cardTypeTextActive: {
    color: colors.textWhite,
    fontWeight: typography.fontWeight.bold,
  },
  amountCard: {
    backgroundColor: colors.primary + '15',
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
    alignItems: 'center',
  },
  amountLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  amountText: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
  },
  paymentButton: {
    marginTop: spacing.md,
  },
  securityNote: {
    marginTop: spacing.lg,
    padding: spacing.md,
    backgroundColor: colors.success + '15',
    borderRadius: borderRadius.sm,
  },
  securityText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});

export default CardPaymentScreen;