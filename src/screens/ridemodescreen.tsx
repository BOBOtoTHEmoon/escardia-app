import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Button } from '../components';
import { colors, typography, spacing, borderRadius } from '../constants';

interface RideModeScreenProps {
  onNavigateBack: () => void;
  onContinue: (rideModeData: any) => void;
  tripData?: any;
}

interface EscortCount {
  basic: number;
  premium: number;
  vip: number;
}

export const RideModeScreen: React.FC<RideModeScreenProps> = ({
  onNavigateBack,
  onContinue,
  tripData,
}) => {
  const [escortCounts, setEscortCounts] = useState<EscortCount>({
    basic: 0,
    premium: 0,
    vip: 0,
  });

  const escortOptions = [
    { id: 'basic', name: 'Basic Security', price: 5000 },
    { id: 'premium', name: 'Premium Security', price: 10000 },
    { id: 'vip', name: 'VIP Security', price: 20000 },
  ];

  const updateEscortCount = (type: keyof EscortCount, increment: boolean) => {
    setEscortCounts(prev => ({
      ...prev,
      [type]: increment 
        ? prev[type] + 1 
        : Math.max(0, prev[type] - 1)
    }));
  };

  const getTotalEscorts = () => {
    return escortCounts.basic + escortCounts.premium + escortCounts.vip;
  };

  const handleContinue = () => {
    const escorts = [];
    
    if (escortCounts.basic > 0) {
      escorts.push({ type: 'basic', count: escortCounts.basic, price: 5000 });
    }
    if (escortCounts.premium > 0) {
      escorts.push({ type: 'premium', count: escortCounts.premium, price: 10000 });
    }
    if (escortCounts.vip > 0) {
      escorts.push({ type: 'vip', count: escortCounts.vip, price: 20000 });
    }

    const rideModeData = {
      rideMode: tripData?.rideMode || 'self-drive',
      escorts: escorts.length > 0 ? escorts : null,
    };
    onContinue(rideModeData);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onNavigateBack}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Escort Details</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Escort Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Escort Details</Text>
          <Text style={styles.sectionSubtitle}>
            Select the type and number of escorts you need. You can choose multiple types or skip to proceed without escorts.
          </Text>

          {/* No Escort Option */}
          <TouchableOpacity
            style={[
              styles.noEscortOption,
              getTotalEscorts() === 0 && styles.noEscortOptionActive,
            ]}
            onPress={() => setEscortCounts({ basic: 0, premium: 0, vip: 0 })}
          >
            <Text
              style={[
                styles.noEscortText,
                getTotalEscorts() === 0 && styles.noEscortTextActive,
              ]}
            >
              No Escort Needed
            </Text>
          </TouchableOpacity>

          {/* Escort Type Selection */}
          <View style={styles.escortTypeSection}>
            {escortOptions.map((option) => (
              <View key={option.id} style={styles.escortCard}>
                <View style={styles.escortCardHeader}>
                  <View>
                    <Text style={styles.escortName}>{option.name}</Text>
                    <Text style={styles.escortPrice}>
                      ₦{option.price.toLocaleString()}/day
                    </Text>
                  </View>
                </View>

                {/* Counter */}
                <View style={styles.counterContainer}>
                  <TouchableOpacity
                    style={[
                      styles.counterButton,
                      escortCounts[option.id as keyof EscortCount] === 0 && styles.counterButtonDisabled
                    ]}
                    onPress={() => updateEscortCount(option.id as keyof EscortCount, false)}
                  >
                    <Text style={styles.counterButtonText}>−</Text>
                  </TouchableOpacity>
                  <Text style={styles.counterValue}>
                    {escortCounts[option.id as keyof EscortCount]}
                  </Text>
                  <TouchableOpacity
                    style={styles.counterButton}
                    onPress={() => updateEscortCount(option.id as keyof EscortCount, true)}
                  >
                    <Text style={styles.counterButtonText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>

          {/* Summary */}
          {getTotalEscorts() > 0 && (
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Escort Summary</Text>
              {escortCounts.basic > 0 && (
                <Text style={styles.summaryText}>
                  Basic Security: {escortCounts.basic} × ₦5,000 = ₦{(escortCounts.basic * 5000).toLocaleString()}
                </Text>
              )}
              {escortCounts.premium > 0 && (
                <Text style={styles.summaryText}>
                  Premium Security: {escortCounts.premium} × ₦10,000 = ₦{(escortCounts.premium * 10000).toLocaleString()}
                </Text>
              )}
              {escortCounts.vip > 0 && (
                <Text style={styles.summaryText}>
                  VIP Security: {escortCounts.vip} × ₦20,000 = ₦{(escortCounts.vip * 20000).toLocaleString()}
                </Text>
              )}
              <View style={styles.summaryDivider} />
              <Text style={styles.summaryTotal}>
                Total Escorts: {getTotalEscorts()}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Continue Button */}
      <View style={styles.footer}>
        <Button
          title="Continue"
          onPress={handleContinue}
          style={styles.continueButton}
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
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  sectionSubtitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.regular,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  noEscortOption: {
    backgroundColor: colors.inputBackground,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  noEscortOptionActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight + '20',
  },
  noEscortText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  noEscortTextActive: {
    color: colors.primary,
  },
  escortTypeSection: {
    gap: spacing.md,
  },
  escortCard: {
    backgroundColor: colors.inputBackground,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  escortCardHeader: {
    flex: 1,
  },
  escortName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  escortPrice: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.primary,
  },
  counterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  counterButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  counterButtonDisabled: {
    backgroundColor: colors.textLight,
  },
  counterButtonText: {
    color: colors.textWhite,
    fontSize: 20,
    fontWeight: typography.fontWeight.semiBold,
  },
  counterValue: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text,
    minWidth: 30,
    textAlign: 'center',
  },
  summaryCard: {
    backgroundColor: colors.success + '15',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.lg,
  },
  summaryTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  summaryText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.regular,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.sm,
  },
  summaryTotal: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text,
  },
  footer: {
    padding: spacing.lg,
    backgroundColor: colors.background,
  },
  continueButton: {
    width: '100%',
  },
});