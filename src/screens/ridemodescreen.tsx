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
  legion: number;
  private: number;
}

export const RideModeScreen: React.FC<RideModeScreenProps> = ({
  onNavigateBack,
  onContinue,
  tripData,
}) => {
  const [escortCounts, setEscortCounts] = useState<EscortCount>({
    legion: 0,
    private: 0,
  });

  const HILUX_PRICE_PER_DAY = 80000;

  const escortOptions = [
    { id: 'legion', name: 'LEGION Security', pricePerPerson: 25000 },
    { id: 'private', name: 'PRIVATE Security', pricePerPerson: 30000 },
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
    return escortCounts.legion + escortCounts.private;
  };

  const getHiluxCount = () => {
    const total = getTotalEscorts();
    if (total === 0) return 0;
    if (total <= 2) return 0; // 1-2 escorts: no hilux needed
    if (total <= 7) return 1; // 3-7 escorts: 1 hilux
    return Math.ceil(total / 4); // 8+: 2 hiluxes (8-15), 3 hiluxes (16-23), etc.
  };

  const getHiluxCost = () => {
    return getHiluxCount() * HILUX_PRICE_PER_DAY;
  };

  const getTotalSecurityCost = () => {
    const legionCost = escortCounts.legion * 25000;
    const privateCost = escortCounts.private * 30000;
    const hiluxCost = getHiluxCost();
    return legionCost + privateCost + hiluxCost;
  };

  const handleContinue = () => {
    const escorts = [];
    
    if (escortCounts.legion > 0) {
      escorts.push({ 
        type: 'legion', 
        count: escortCounts.legion, 
        pricePerPerson: 25000 
      });
    }
    if (escortCounts.private > 0) {
      escorts.push({ 
        type: 'private', 
        count: escortCounts.private, 
        pricePerPerson: 30000 
      });
    }

    const rideModeData = {
      rideMode: tripData?.rideMode || 'self-drive',
      escorts: escorts.length > 0 ? escorts : null,
      hiluxCount: getHiluxCount(),
      hiluxCost: getHiluxCost(),
      totalSecurityCost: getTotalSecurityCost(),
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
        <Text style={styles.headerTitle}>Security Details</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Security Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Security Details</Text>
          <Text style={styles.sectionSubtitle}>
            Select the type and number of security personnel you need. Transport (Hilux) will be added automatically based on team size.
          </Text>

          {/* No Security Option */}
          <TouchableOpacity
            style={[
              styles.noEscortOption,
              getTotalEscorts() === 0 && styles.noEscortOptionActive,
            ]}
            onPress={() => setEscortCounts({ legion: 0, private: 0 })}
          >
            <Text
              style={[
                styles.noEscortText,
                getTotalEscorts() === 0 && styles.noEscortTextActive,
              ]}
            >
              No Security Needed
            </Text>
          </TouchableOpacity>

          {/* Security Type Selection */}
          <View style={styles.escortTypeSection}>
            {escortOptions.map((option) => (
              <View key={option.id} style={styles.escortCard}>
                <View style={styles.escortCardHeader}>
                  <View>
                    <Text style={styles.escortName}>{option.name}</Text>
                    <Text style={styles.escortPrice}>
                      ₦{option.pricePerPerson.toLocaleString()}/person/day
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

          {/* Hilux Information */}
          {getTotalEscorts() >= 3 && (
            <View style={styles.hiluxInfoCard}>
              <Text style={styles.hiluxInfoTitle}>🚙 Transport Vehicle Required</Text>
              <Text style={styles.hiluxInfoText}>
                {getHiluxCount()} Hilux vehicle{getHiluxCount() > 1 ? 's' : ''} needed for {getTotalEscorts()} personnel
              </Text>
              <Text style={styles.hiluxInfoSubtext}>
                ₦{HILUX_PRICE_PER_DAY.toLocaleString()}/day per Hilux
              </Text>
            </View>
          )}

          {/* Summary */}
          {getTotalEscorts() > 0 && (
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Security Summary</Text>
              
              {/* Personnel Costs */}
              {escortCounts.legion > 0 && (
                <Text style={styles.summaryText}>
                  LEGION: {escortCounts.legion} × ₦25,000 = ₦{(escortCounts.legion * 25000).toLocaleString()}
                </Text>
              )}
              {escortCounts.private > 0 && (
                <Text style={styles.summaryText}>
                  PRIVATE: {escortCounts.private} × ₦30,000 = ₦{(escortCounts.private * 30000).toLocaleString()}
                </Text>
              )}
              
              {/* Hilux Cost */}
              {getHiluxCount() > 0 && (
                <Text style={styles.summaryText}>
                  Transport: {getHiluxCount()} Hilux × ₦{HILUX_PRICE_PER_DAY.toLocaleString()} = ₦{getHiluxCost().toLocaleString()}
                </Text>
              )}
              
              <View style={styles.summaryDivider} />
              
              {/* Total */}
              <View style={styles.summaryRow}>
                <Text style={styles.summaryTotal}>Total Personnel:</Text>
                <Text style={styles.summaryTotal}>{getTotalEscorts()}</Text>
              </View>
              
              <View style={styles.summaryRow}>
                <Text style={styles.summaryTotalPrice}>Total Security Cost:</Text>
                <Text style={styles.summaryTotalPrice}>
                  ₦{getTotalSecurityCost().toLocaleString()}
                </Text>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Continue Button */}
      <View style={styles.footer}>
        <Button
          title={getTotalEscorts() > 0 ? `Continue (₦${getTotalSecurityCost().toLocaleString()})` : 'Continue'}
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
    lineHeight: 22,
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
  hiluxInfoCard: {
    backgroundColor: '#FEF3C7',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  hiluxInfoTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semiBold,
    color: '#92400E',
    marginBottom: spacing.xs,
  },
  hiluxInfoText: {
    fontSize: typography.fontSize.sm,
    color: '#92400E',
    marginBottom: 4,
  },
  hiluxInfoSubtext: {
    fontSize: typography.fontSize.xs,
    color: '#92400E',
    fontWeight: typography.fontWeight.medium,
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
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  summaryTotal: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text,
  },
  summaryTotalPrice: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
  },
  footer: {
    padding: spacing.lg,
    backgroundColor: colors.background,
  },
  continueButton: {
    width: '100%',
  },
});