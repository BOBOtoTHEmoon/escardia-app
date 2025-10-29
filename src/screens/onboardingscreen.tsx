import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Dimensions,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Button } from '../components';
import { colors, typography, spacing, borderRadius } from '../constants';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Onboarding slide data
const onboardingData = [
  {
    id: '1',
    title: 'Ride in Style, Anytime',
    description: 'From luxury sedans to exotic supercars, customize your dream ride in just a tap away.',
    image: require('../../assets/images/onboarding1.png'),
  },
  {
    id: '2',
    title: 'One Tap, Multiple Rides',
    description: 'Need more than one car? No problem. Book a fleet in one go.',
    image: require('../../assets/images/onboarding2.png'),
  },
  {
    id: '3',
    title: 'Need a Ride? We Got You',
    description: 'Browse our fleet of luxury and exotic cars and book in seconds.',
    image: require('../../assets/images/onboarding3.png'),
  },
  {
    id: '4',
    title: 'Ride Safe, Ride Secure',
    description: 'Choose from our fleet of optional professional security escorts.',
    image: require('../../assets/images/onboarding4.png'),
  },
];

interface OnboardingScreenProps {
  onComplete: () => void;
  onNavigateToSignIn: () => void;
  onNavigateToVendorOnboarding: () => void;
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ 
  onComplete, 
  onNavigateToSignIn,
  onNavigateToVendorOnboarding 
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  // Handle next button press
  const handleNext = () => {
    if (currentIndex < onboardingData.length - 1) {
      const nextIndex = currentIndex + 1;
      flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
      setCurrentIndex(nextIndex);
    }
  };

  // Handle skip button
  const handleSkip = () => {
    onComplete();
  };

  // Handle get started (on last slide)
  const handleGetStarted = () => {
    onComplete();
  };

  // Update current index on scroll
  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index || 0);
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  // Render each onboarding slide
  const renderItem = ({ item }: { item: typeof onboardingData[0] }) => (
    <View style={styles.slide}>
      {/* Illustration Image */}
      <View style={styles.illustrationContainer}>
        <Image
          source={item.image}
          style={styles.illustration}
          resizeMode="contain"
        />
      </View>

      {/* Title */}
      <Text style={styles.title}>{item.title}</Text>

      {/* Description */}
      <Text style={styles.description}>{item.description}</Text>
    </View>
  );

  // Render pagination dots
  const renderPagination = () => (
    <View style={styles.paginationContainer}>
      {onboardingData.map((_, index) => (
        <View
          key={index}
          style={[
            styles.paginationDot,
            index === currentIndex && styles.paginationDotActive,
          ]}
        />
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Logo and Become a Vendor Button */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Image
            source={require('../../assets/images/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
        
        <TouchableOpacity 
          style={styles.becomeVendorButton} 
          onPress={onNavigateToVendorOnboarding}
        >
          <Text style={styles.becomeVendorText}>Become a Vendor</Text>
        </TouchableOpacity>
      </View>

      {/* Skip Button */}
      {currentIndex < onboardingData.length - 1 && (
        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      )}

      {/* Onboarding Slides */}
      <FlatList
        ref={flatListRef}
        data={onboardingData}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        scrollEnabled={true}
        onMomentumScrollEnd={(event) => {
          const index = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
          setCurrentIndex(index);
        }}
      />

      {/* Pagination Dots */}
      {renderPagination()}

      {/* Bottom Buttons */}
      <View style={styles.buttonContainer}>
        {currentIndex === onboardingData.length - 1 ? (
          // Last slide: Show "Create Account" and "Login"
          <>
            <Button
              title="Create a new account"
              onPress={handleGetStarted}
              style={styles.button}
            />
            <Button
              title="Login"
              onPress={onNavigateToSignIn}
              variant="outline"
              style={styles.button}
            />
          </>
        ) : (
          // Other slides: Show "Next"
          <Button
            title="Next"
            onPress={handleNext}
            style={styles.button}
          />
        )}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  
  logoContainer: {
    alignItems: 'flex-start',
  },
  
  logo: {
    width: 50,
    height: 80,
    right: -139,
  },
  
  becomeVendorButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
  },
  
  becomeVendorText: {
    color: colors.textWhite,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semiBold,
  },
  
  skipButton: {
    position: 'absolute',
    top: 150,
    right: spacing.lg,
    zIndex: 10,
    padding: spacing.sm,
  },
  
  skipText: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.medium,
  },
  
  slide: {
    width: SCREEN_WIDTH,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  
  illustrationContainer: {
    width: 250,
    height: 250,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  
  illustration: {
    width: '100%',
    height: '100%',
  },
  
  title: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  
  description: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: typography.lineHeight.relaxed * typography.fontSize.base,
  },
  
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
    marginHorizontal: spacing.xs,
  },
  
  paginationDotActive: {
    backgroundColor: colors.primary,
    width: 24,
  },
  
  buttonContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  
  button: {
    marginBottom: spacing.md,
  },
});