import React, { useEffect } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Feather } from '@expo/vector-icons';
import { useAppSettings } from '../hooks/useAppSettings';
import { AppText, Button, Screen, ScreenHeader } from '../ui';
import { BookingSteps, BottomBar, InfoRow, OptionCard, Panel, SectionTitle, Stepper } from '../ui/Booking';
import { naira } from '../ui/CarCard';
import { brand, color, gutter, radius, themed, statusBarStyle } from '../theme';

interface RideModeScreenProps {
  onNavigateBack: () => void;
  onContinue: (rideModeData: any) => void;
  tripData?: any;
  savedFormData?: any;
  onFormDataChange?: (data: any) => void;
}

interface EscortCount {
  legion: number;
  private: number;
}

/** Same rule the server uses: 3 to 7 people need 1 Hilux, 8 or more need 1 per 4 people. */
const requiredHilux = (persons: number) => (persons <= 2 ? 0 : persons <= 7 ? 1 : Math.ceil(persons / 4));

export const RideModeScreen: React.FC<RideModeScreenProps> = ({ onNavigateBack, onContinue, tripData, savedFormData, onFormDataChange }) => {
  const { settings } = useAppSettings();
  const [counts, setCounts] = React.useState<EscortCount>(savedFormData?.escortCounts || { legion: 0, private: 0 });
  const [extraHilux, setExtraHilux] = React.useState<number>(savedFormData?.manualHiluxCount || 0);

  useEffect(() => {
    onFormDataChange?.({ escortCounts: counts, manualHiluxCount: extraHilux });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [counts, extraHilux]);

  const trip = tripData?.tripData;
  // Escorts are charged per day; hourly trips round up to whole days.
  const days = trip ? (trip.durationType === 'hour' ? Math.max(1, Math.ceil(trip.duration / 24)) : trip.duration) : 1;

  const persons = counts.legion + counts.private;
  const required = requiredHilux(persons);
  const hilux = persons === 0 ? 0 : Math.max(required, extraHilux);

  const perDay = counts.legion * settings.legionPerDay + counts.private * settings.privatePerDay + hilux * settings.hiluxPerDay;
  const total = perDay * days;

  const setCount = (type: keyof EscortCount, v: number) => {
    const next = { ...counts, [type]: v };
    setCounts(next);
    if (next.legion + next.private === 0) setExtraHilux(0);
  };

  const handleContinue = () => {
    const escorts = [
      counts.legion > 0 ? { type: 'legion', count: counts.legion, pricePerPerson: settings.legionPerDay } : null,
      counts.private > 0 ? { type: 'private', count: counts.private, pricePerPerson: settings.privatePerDay } : null,
    ].filter(Boolean);
    onContinue({
      rideMode: trip?.rideMode || 'with-driver',
      escorts: escorts.length ? escorts : null,
      hiluxCount: hilux,
      hiluxCost: hilux * settings.hiluxPerDay,
      totalSecurityCost: perDay,
    });
  };

  return (
    <Screen>
      <StatusBar style={statusBarStyle()} />
      <ScreenHeader title="Add security" onBack={onNavigateBack} />
      <BookingSteps current={2} />

      <ScrollView contentContainerStyle={{ paddingHorizontal: gutter, paddingBottom: 140 }} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <Feather name="shield" size={20} color="#FFFFFF" />
          </View>
          <View style={{ flex: 1 }}>
            <AppText variant="subheading" color="#FFFFFF">
              Travel with protection
            </AppText>
            <AppText variant="small" color={color.onDarkMuted} style={{ marginTop: 2 }}>
              Optional. Trained personnel ride with you for the whole trip.
            </AppText>
          </View>
        </View>

        <OptionCard
          icon="x-circle"
          title="No security"
          subtitle="Just the car and driver"
          selected={persons === 0}
          onPress={() => {
            setCounts({ legion: 0, private: 0 });
            setExtraHilux(0);
          }}
        />

        <SectionTitle title="Security personnel" hint={`Priced per person, per day${days > 1 ? ` · ${days} days on this trip` : ''}`} />
        {(
          [
            { key: 'legion', name: 'LEGION', price: settings.legionPerDay },
            { key: 'private', name: 'PRIVATE', price: settings.privatePerDay },
          ] as const
        ).map((o) => (
          <Panel key={o.key} style={[styles.row, counts[o.key] > 0 && styles.rowOn]}>
            <View style={styles.badge}>
              <Feather name="user" size={16} color={color.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <AppText variant="subheading">{o.name} security</AppText>
              <AppText variant="small" color={color.muted}>
                {naira(o.price)} / person / day
              </AppText>
            </View>
            <Stepper value={counts[o.key]} onChange={(v) => setCount(o.key, v)} />
          </Panel>
        ))}

        {persons > 0 && (
          <>
            <SectionTitle
              title="Hilux backup vehicle"
              hint={required > 0 ? `${required} Hilux needed for ${persons} personnel. You can add more.` : 'Optional for 1 or 2 personnel.'}
            />
            <Panel style={[styles.row, hilux > 0 && styles.rowOn]}>
              <View style={styles.badge}>
                <Feather name="truck" size={16} color={color.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <AppText variant="subheading">Toyota Hilux</AppText>
                <AppText variant="small" color={color.muted}>
                  {naira(settings.hiluxPerDay)} / vehicle / day
                </AppText>
              </View>
              <Stepper value={hilux} min={required} onChange={setExtraHilux} />
            </Panel>
          </>
        )}

        {persons > 0 && (
          <>
            <SectionTitle title="Security total" />
            <Panel>
              {counts.legion > 0 && <InfoRow label={`LEGION × ${counts.legion}`} value={naira(counts.legion * settings.legionPerDay * days)} />}
              {counts.private > 0 && <InfoRow label={`PRIVATE × ${counts.private}`} value={naira(counts.private * settings.privatePerDay * days)} />}
              {hilux > 0 && <InfoRow label={`Hilux × ${hilux}`} value={naira(hilux * settings.hiluxPerDay * days)} />}
              <View style={styles.divider} />
              <InfoRow label={`Total for ${days} day${days > 1 ? 's' : ''}`} value={naira(total)} strong />
            </Panel>
          </>
        )}
      </ScrollView>

      <BottomBar
        label={persons > 0 ? 'Security' : undefined}
        amount={persons > 0 ? naira(total) : undefined}
        note={persons > 0 ? `${persons} personnel${hilux ? ` · ${hilux} Hilux` : ''}` : undefined}
        button={<Button title={persons > 0 ? 'Continue' : 'Continue without security'} iconRight="arrow-right" onPress={handleContinue} />}
      />
    </Screen>
  );
};

const styles = themed(() => StyleSheet.create({
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: radius.xl,
    backgroundColor: color.navy,
    marginBottom: 14,
  },
  heroIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: brand[600], alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, marginBottom: 10 },
  rowOn: { borderColor: color.primary },
  badge: { width: 40, height: 40, borderRadius: 12, backgroundColor: color.primarySoft, alignItems: 'center', justifyContent: 'center' },
  divider: { height: 1, backgroundColor: color.border, marginVertical: 4 },
}));
