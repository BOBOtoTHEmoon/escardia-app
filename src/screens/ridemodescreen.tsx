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
  const [manualHiluxCount, setManualHiluxCount] = useState(0); // ✅ Manual override

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

  // ✅ NEW - Calculate REQUIRED hilux based on personnel
  const getRequiredHiluxCount = () => {
    const total = getTotalEscorts();
    if (total === 0) return 0;
    if (total <= 2) return 0; // Optional for 1-2
    if (total <= 7) return 1; // Required: 1 hilux for 3-7
    return Math.ceil(total / 4); // Required: 2+ hiluxes for 8+
  };

  // ✅ NEW - Get ACTUAL hilux count (required + manual)
  const getActualHiluxCount = () => {
    const required = getRequiredHiluxCount();
    if (required > 0) {
      // If hilux is required, use max of required or manual
      return Math.max(required, manualHiluxCount);
    }
    // If hilux is optional (0-2 personnel), use manual count
    return manualHiluxCount;
  };

  // ✅ NEW - Check if hilux is required or optional
  const isHiluxRequired = () => {
    return getTotalEscorts() >= 3;
  };

  // ✅ NEW - Check if user can remove hilux
  const canRemoveHilux = () => {
    const required = getRequiredHiluxCount();
    return manualHiluxCount > required;
  };

  const getHiluxCost = () => {
    return getActualHiluxCount() * HILUX_PRICE_PER_DAY;
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
      hiluxCount: getActualHiluxCount(),
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
          <Text style={styles.sectionTitle}>Security Personnel</Text>
          <Text style={styles.sectionSubtitle}>
            Select the type and number of security personnel you need.
          </Text>

          {/* No Security Option */}
          <TouchableOpacity
            style={[
              styles.noEscortOption,
              getTotalEscorts() === 0 && styles.noEscortOptionActive,
            ]}
            onPress={() => {
              setEscortCounts({ legion: 0, private: 0 });
              setManualHiluxCount(0); // Reset hilux too
            }}
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

          {/* ✅ HILUX SECTION - Always show if personnel > 0 */}
          {getTotalEscorts() > 0 && (
            <>
              <View style={styles.divider} />
              <Text style={styles.sectionTitle}>Transport Vehicle (Hilux)</Text>
              <Text style={styles.sectionSubtitle}>
                {isHiluxRequired() 
                  ? `${getRequiredHiluxCount()} Hilux required for ${getTotalEscorts()} personnel`
                  : 'Optional transport for your security team'}
              </Text>

              {/* Hilux Card */}
              <View style={styles.hiluxCard}>
                <View style={styles.hiluxCardHeader}>
                  <View>
                    <Text style={styles.hiluxName}>🚙 Hilux Vehicle</Text>
                    <Text style={styles.hiluxPrice}>
                      ₦{HILUX_PRICE_PER_DAY.toLocaleString()}/day per vehicle
                    </Text>
                    {isHiluxRequired() && (
                      <Text style={styles.hiluxRequired}>
                        ⚠️ Required for {getTotalEscorts()} personnel
                      </Text>
                    )}
                  </View>
                </View>

                {/* Counter */}
                <View style={styles.counterContainer}>
                  <TouchableOpacity
                    style={[
                      styles.counterButton,
                      (!canRemoveHilux() && manualHiluxCount <= getRequiredHiluxCount()) && styles.counterButtonDisabled
                    ]}
                    onPress={() => {
                      const required = getRequiredHiluxCount();
                      if (manualHiluxCount > required) {
                        setManualHiluxCount(Math.max(required, manualHiluxCount - 1));
                      }
                    }}
                    disabled={!canRemoveHilux() && manualHiluxCount <= getRequiredHiluxCount()}
                  >
                    <Text style={styles.counterButtonText}>−</Text>
                  </TouchableOpacity>
                  <Text style={styles.counterValue}>
                    {getActualHiluxCount()}
                  </Text>
                  <TouchableOpacity
                    style={styles.counterButton}
                    onPress={() => setManualHiluxCount(getActualHiluxCount() + 1)}
                  >
                    <Text style={styles.counterButtonText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Info Card */}
              {isHiluxRequired() && (
                <View style={styles.infoCard}>
                  <Text style={styles.infoText}>
                    ℹ️ Hilux transport is required for teams of 3 or more personnel. You can add extra vehicles if needed.
                  </Text>
                </View>
              )}
            </>
          )}

          {/* Summary */}
          {(getTotalEscorts() > 0 || getActualHiluxCount() > 0) && (
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
              {getActualHiluxCount() > 0 && (
                <Text style={styles.summaryText}>
                  Transport: {getActualHiluxCount()} Hilux × ₦{HILUX_PRICE_PER_DAY.toLocaleString()} = ₦{getHiluxCost().toLocaleString()}
                </Text>
              )}
              
              <View style={styles.summaryDivider} />
              
              {/* Total */}
              <View style={styles.summaryRow}>
                <Text style={styles.summaryTotal}>Total Personnel:</Text>
                <Text style={styles.summaryTotal}>{getTotalEscorts()}</Text>
              </View>
              
              {getActualHiluxCount() > 0 && (
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryTotal}>Total Vehicles:</Text>
                  <Text style={styles.summaryTotal}>{getActualHiluxCount()}</Text>
                </View>
              )}
              
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
          title={getTotalSecurityCost() > 0 ? `Continue (₦${getTotalSecurityCost().toLocaleString()})` : 'Continue'}
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
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.lg,
  },
  hiluxCard: {
    backgroundColor: '#FEF3C7',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  hiluxCardHeader: {
    flex: 1,
  },
  hiluxName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semiBold,
    color: '#92400E',
    marginBottom: spacing.xs,
  },
  hiluxPrice: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semiBold,
    color: '#92400E',
  },
  hiluxRequired: {
    fontSize: typography.fontSize.xs,
    color: '#F59E0B',
    marginTop: 4,
    fontWeight: typography.fontWeight.medium,
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
    opacity: 0.5,
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
  infoCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  infoText: {
    fontSize: typography.fontSize.sm,
    color: '#1E40AF',
    lineHeight: 20,
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