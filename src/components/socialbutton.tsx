import React from 'react';
import {
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  Image,
} from 'react-native';
import { spacing, borderRadius } from '../constants';

interface SocialButtonProps {
  provider: 'apple' | 'google' | 'facebook';
  onPress: () => void;
  style?: ViewStyle;
}

export const SocialButton: React.FC<SocialButtonProps> = ({
  provider,
  onPress,
  style,
}) => {
  // Get icon source based on provider
  const getIconSource = () => {
    switch (provider) {
      case 'apple':
        return require('../../assets/images/applelogo.png');
      case 'google':
        return require('../../assets/images/googlelogo.png');
      case 'facebook':
        return require('../../assets/images/facebooklogo.png');
    }
  };

  return (
    <TouchableOpacity
      style={[styles.button, style]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Image 
        source={getIconSource()} 
        style={styles.icon}
        resizeMode="contain"
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    //backgroundColor: '#F5F5F5',
    marginHorizontal: spacing.sm,
  },
  
  icon: {
    width: 28,
    height: 28,
  },
});