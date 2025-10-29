import React, { useEffect, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import LottieView from 'lottie-react-native';

interface SplashScreenProps {
  onFinish: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const lottieRef = useRef<LottieView>(null);

  useEffect(() => {
    console.log('SplashScreen mounted');
  }, []);

  const handleAnimationFinish = () => {
    console.log('Animation finished, transitioning...');
    // Immediately go to welcome screen without fade
    onFinish();
  };

  return (
    <View style={styles.container}>
      <LottieView
        ref={lottieRef}
source={require('../../assets/openingsplash.json')}
        autoPlay
        loop={false}
        style={styles.lottie}
        onAnimationFinish={handleAnimationFinish}
        resizeMode="cover"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  lottie: {
    width: '100%',
    height: '100%',
  },
});