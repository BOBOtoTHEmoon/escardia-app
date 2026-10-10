import React, { useRef, useState } from 'react';
import { Animated, Dimensions, FlatList, Image, Pressable, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText, Button } from '../ui';
import { brand, color, gutter, themed, statusBarStyle } from '../theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const SLIDES = [
  {
    id: '1',
    title: 'Ride in style, anytime',
    description: 'From executive sedans to exotic SUVs, find the right car for the moment in a few taps.',
    image: require('../../assets/images/onboarding1.png'),
  },
  {
    id: '2',
    title: 'One booking, many cars',
    description: 'Moving with a team or an entourage? Book a whole fleet in one go.',
    image: require('../../assets/images/onboarding2.png'),
  },
  {
    id: '3',
    title: 'Drivers you can trust',
    description: 'Every vendor and car is checked by Escardia before it goes live.',
    image: require('../../assets/images/onboarding3.png'),
  },
  {
    id: '4',
    title: 'Ride safe, ride secure',
    description: 'Add professional security escorts and a Hilux backup to any trip.',
    image: require('../../assets/images/onboarding4.png'),
  },
];

interface OnboardingScreenProps {
  onComplete: () => void;
  onNavigateToSignIn: () => void;
  onNavigateToVendorOnboarding: () => void;
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onComplete, onNavigateToSignIn, onNavigateToVendorOnboarding }) => {
  const insets = useSafeAreaInsets();
  const [index, setIndex] = useState(0);
  const listRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const last = index === SLIDES.length - 1;

  const goTo = (i: number) => {
    listRef.current?.scrollToIndex({ index: i, animated: true });
    setIndex(i);
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar style={statusBarStyle()} />

      <View style={styles.header}>
        <View style={styles.brand}>
          <Image source={require('../../assets/images/logo.png')} style={styles.logo} resizeMode="contain" />
          <AppText variant="subheading">Escardia</AppText>
        </View>
        <Pressable onPress={onNavigateToVendorOnboarding} style={({ pressed }) => [styles.vendorChip, pressed && { backgroundColor: color.primaryBorder }]}>
          <Feather name="briefcase" size={13} color={color.primary} />
          <AppText variant="smallMedium" color={color.primary}>
            Become a vendor
          </AppText>
        </Pressable>
      </View>

      <Animated.FlatList
        ref={listRef as never}
        data={SLIDES}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        bounces={false}
        showsHorizontalScrollIndicator={false}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], { useNativeDriver: false })}
        scrollEventThrottle={16}
        onMomentumScrollEnd={(e) => setIndex(Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH))}
        renderItem={({ item, index: i }) => (
          <View style={styles.slide}>
            <View style={styles.stage}>
              <View style={styles.stageInner}>
                <Image source={item.image} style={styles.illustration} resizeMode="contain" />
              </View>
            </View>
            <AppText variant="caption" color={color.primary} style={{ marginBottom: 10 }}>
              {String(i + 1).padStart(2, '0')} / {String(SLIDES.length).padStart(2, '0')}
            </AppText>
            <AppText variant="title" center>
              {item.title}
            </AppText>
            <AppText variant="body" color={color.muted} center style={{ marginTop: 10, maxWidth: 320 }}>
              {item.description}
            </AppText>
          </View>
        )}
      />

      <View style={styles.dots}>
        {SLIDES.map((_, i) => {
          const range = [(i - 1) * SCREEN_WIDTH, i * SCREEN_WIDTH, (i + 1) * SCREEN_WIDTH];
          return (
            <Animated.View
              key={i}
              style={[
                styles.dot,
                {
                  width: scrollX.interpolate({ inputRange: range, outputRange: [8, 24, 8], extrapolate: 'clamp' }),
                  backgroundColor: scrollX.interpolate({
                    inputRange: range,
                    outputRange: [color.borderStrong, color.primary, color.borderStrong],
                    extrapolate: 'clamp',
                  }),
                },
              ]}
            />
          );
        })}
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        {last ? (
          <>
            <Button title="Create an account" iconRight="arrow-right" onPress={onComplete} />
            <Button title="I already have an account" variant="secondary" onPress={onNavigateToSignIn} style={{ marginTop: 12 }} />
          </>
        ) : (
          <View style={styles.row}>
            <Pressable onPress={onComplete} hitSlop={12} style={styles.skip}>
              <AppText variant="bodyMedium" color={color.muted}>
                Skip
              </AppText>
            </Pressable>
            <Button title="Next" iconRight="arrow-right" onPress={() => goTo(index + 1)} style={{ flex: 1 }} />
          </View>
        )}
      </View>
    </View>
  );
};

const STAGE = Math.min(SCREEN_WIDTH - 72, 300);

const styles = themed(() => StyleSheet.create({
  root: { flex: 1, backgroundColor: color.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: gutter,
    paddingVertical: 12,
  },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logo: { width: 28, height: 28 },
  vendorChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: color.primarySoft,
    borderWidth: 1,
    borderColor: color.primaryBorder,
  },
  slide: { width: SCREEN_WIDTH, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28 },
  stage: {
    width: STAGE,
    height: STAGE,
    borderRadius: STAGE / 2,
    backgroundColor: color.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 36,
  },
  stageInner: {
    width: STAGE - 36,
    height: STAGE - 36,
    borderRadius: (STAGE - 36) / 2,
    backgroundColor: '#FFFFFF', // the illustrations are drawn for a white background
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  illustration: { width: '86%', height: '86%' },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, paddingVertical: 20 },
  dot: { height: 8, borderRadius: 4 },
  footer: { paddingHorizontal: gutter },
  row: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  skip: { paddingHorizontal: 12, height: 56, justifyContent: 'center' },
}));

