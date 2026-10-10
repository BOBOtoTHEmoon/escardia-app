// Profile photo if there is one, otherwise the person's initials.
import React from 'react';
import { Image, StyleProp, View, ViewStyle } from 'react-native';
import { AppText } from './index';
import { brand } from '../theme';

export const initialsOf = (name?: string | null) =>
  (name || 'E')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('') || 'E';

export const Avatar = ({
  uri,
  name,
  size = 42,
  ring = 'rgba(255,255,255,0.25)',
  background = brand[600],
  style,
}: {
  uri?: string | null;
  name?: string | null;
  size?: number;
  ring?: string;
  background?: string;
  style?: StyleProp<ViewStyle>;
}) => {
  const base: ViewStyle = { width: size, height: size, borderRadius: size / 2, borderWidth: size > 50 ? 2 : 1.5, borderColor: ring, overflow: 'hidden' };
  if (uri) {
    return (
      <View style={[base, style]}>
        <Image source={{ uri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
      </View>
    );
  }
  return (
    <View style={[base, { backgroundColor: background, alignItems: 'center', justifyContent: 'center' }, style]}>
      <AppText variant={size > 56 ? 'title' : 'subheading'} color="#FFFFFF" style={size <= 36 ? { fontSize: 13 } : undefined}>
        {initialsOf(name)}
      </AppText>
    </View>
  );
};
