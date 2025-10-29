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

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Vendor onboarding slide data
const vendorOnboardingData = [
  {
    id: '1',
    title: 'Manage Your Fleet Effortlessly',
    description: 'Track performance, bookings, and earnings all in one dashboard.',
    image: require('../../assets/images/vendoronboarding1.png'),
  },
  {
    id: '2',
    title: 'Add Cars in Minutes',
    description: 'Update availability, track maintenance, and maximize your fleet\'s uptime.',
    image: require('../../assets/images/vendoronboarding2.png'),
  },
  {
    id: '3',
    title: 'Earn Securely',
    description: 'Withdraw earnings instantly with full transaction transparency.',
    image: require('../../assets/images/vendoronboarding3.png'),
  },
  {
    id: '4',
    title: 'Never Miss a Booking',
    description: 'Get real-time ride requests and manage trips seamlessly.',
    image: require('../../assets/images/vendoronboarding4.png'),
  },
];

interface VendorOnboardingScreenProps {
  onComplete: () => void;
  onNavigateToVendorSignIn: () => void;
   onNavigateBack: () => void;
}

export const VendorOnboardingScreen: React.FC<VendorOnboardingScreenProps> = ({ 
  onComplete,
  onNavigateToVendorSignIn, 
  onNavigateBack,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const handleNext = () => {
    if (currentIndex < vendorOnboardingData.length - 1) {
      const nextIndex = currentIndex + 1;
      flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
      setCurrentIndex(nextIndex);
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  const handleGetStarted = () => {
    onComplete();
  };

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index || 0);
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  const renderItem = ({ item }: { item: typeof vendorOnboardingData[0] }) => (
    <View style={styles.slide}>
      <View style={styles.illustrationContainer}>
        <Image
          source={item.image}
          style={styles.illustration}
          resizeMode="contain"
        />
      </View>

      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.description}>{item.description}</Text>
    </View>
  );

  const renderPagination = () => (
    <View style={styles.paginationContainer}>
      {vendorOnboardingData.map((_, index) => (
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
      {/* Header with Logo */}
     {/* Header with Logo */}
<View style={styles.header}>
  <TouchableOpacity 
    style={styles.backButton} 
    onPress={onNavigateBack}
  >
    <Text style={styles.backIcon}>←</Text>
  </TouchableOpacity>
  
  <View style={styles.headerCenter}>
    <Image
      source={require('../../assets/images/logo.png')}
      style={styles.logo}
      resizeMode="contain"
    />
    <Text style={styles.headerTitle}>Vendor Onboarding</Text>
  </View>
  
  <View style={styles.headerSpacer} />
</View>

      {/* Skip Button */}
      {currentIndex < vendorOnboardingData.length - 1 && (
        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      )}

      {/* Onboarding Slides */}
      <FlatList
        ref={flatListRef}
        data={vendorOnboardingData}
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
        {currentIndex === vendorOnboardingData.length - 1 ? (
          <>
            <Button
              title="Create a new account"
              onPress={handleGetStarted}
              style={styles.button}
            />
            <Button
              title="Login"
              onPress={onNavigateToVendorSignIn}
              variant="outline"
              style={styles.button}
            />
          </>
        ) : (
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
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: spacing.md,
  },
  
  logo: {
    width: 50,
    height: 50,
    marginBottom: spacing.xs,
  },
  
  headerTitle: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.medium,
  },
  
  skipButton: {
    position: 'absolute',
    top: 60,
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
  backButton: {
  position: 'absolute',
  left: spacing.lg,
  top: 60,
  zIndex: 10,
  padding: spacing.sm,
},

backIcon: {
  fontSize: 24,
  color: colors.text,
},

headerCenter: {
  alignItems: 'center',
},

headerSpacer: {
  width: 40,
},
});