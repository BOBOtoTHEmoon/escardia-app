import React, { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText, Button, IconButton } from '../ui';
import { color, font, gutter, radius, themed, isDark } from '../theme';

interface RatingModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (rating: RatingData) => void;
  tripData: {
    carName: string;
    hadDriver: boolean;
  };
}

interface RatingData {
  carCondition: number;
  driverRating: number | null;
  overallExperience: number;
  review: string;
}

const WORDS = ['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent'];

const Stars = ({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) => (
  <View style={styles.block}>
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
      <AppText variant="bodyMedium">{label}</AppText>
      <AppText variant="smallMedium" color={value ? color.warning : color.subtle}>
        {WORDS[value] || 'Tap to rate'}
      </AppText>
    </View>
    <View style={styles.stars}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Pressable key={n} onPress={() => onChange(n)} hitSlop={6} accessibilityLabel={`${n} star${n > 1 ? 's' : ''}`}>
          <Ionicons name={n <= value ? 'star' : 'star-outline'} size={34} color={n <= value ? '#F59E0B' : color.borderStrong} />
        </Pressable>
      ))}
    </View>
  </View>
);

const RatingModal: React.FC<RatingModalProps> = ({ visible, onClose, onSubmit, tripData }) => {
  const insets = useSafeAreaInsets();
  const [carCondition, setCarCondition] = useState(0);
  const [driverRating, setDriverRating] = useState(0);
  const [overall, setOverall] = useState(0);
  const [review, setReview] = useState('');

  useEffect(() => {
    if (visible) {
      setCarCondition(0);
      setDriverRating(0);
      setOverall(0);
      setReview('');
    }
  }, [visible]);

  const submit = () => {
    if (!carCondition || !overall || (tripData.hadDriver && !driverRating)) {
      Alert.alert('Almost there', 'Please give a star rating for each question.');
      return;
    }
    onSubmit({
      carCondition,
      driverRating: tripData.hadDriver ? driverRating : null,
      overallExperience: overall,
      review: review.trim(),
    });
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <AppText variant="heading">Rate your trip</AppText>
              <AppText variant="small" color={color.muted}>
                {tripData.carName}
              </AppText>
            </View>
            <IconButton icon="x" size={36} onPress={onClose} accessibilityLabel="Close" />
          </View>
          <ScrollView contentContainerStyle={{ paddingHorizontal: gutter }} keyboardShouldPersistTaps="handled">
            <Stars label="Car condition" value={carCondition} onChange={setCarCondition} />
            {tripData.hadDriver && <Stars label="Your driver" value={driverRating} onChange={setDriverRating} />}
            <Stars label="Overall experience" value={overall} onChange={setOverall} />
            <AppText variant="bodyMedium" style={{ marginTop: 18, marginBottom: 8 }}>
              Anything to add? <AppText variant="small" color={color.muted}>(optional)</AppText>
            </AppText>
            <TextInput
              keyboardAppearance={isDark() ? 'dark' : 'light'}
              value={review}
              onChangeText={setReview}
              placeholder="Tell other riders what it was like"
              placeholderTextColor={color.subtle}
              multiline
              maxLength={500}
              style={styles.input}
            />
            <Button title="Submit rating" onPress={submit} style={{ marginTop: 18 }} />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = themed(() => StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: color.overlay },
  sheet: { backgroundColor: color.surface, borderTopLeftRadius: radius.xxl, borderTopRightRadius: radius.xxl, maxHeight: '90%' },
  handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: color.border, marginTop: 10 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: gutter, paddingTop: 12, paddingBottom: 4 },
  block: { marginTop: 18 },
  stars: { flexDirection: 'row', gap: 10, marginTop: 10 },
  input: {
    minHeight: 90,
    padding: 12,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: color.border,
    fontFamily: font.regular,
    fontSize: 15,
    color: color.ink,
    textAlignVertical: 'top',
  },
}));

export default RatingModal;
