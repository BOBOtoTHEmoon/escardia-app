// Loading placeholders that pulse softly while data loads.
// Every bone on screen shares one animation, so they all pulse together.
import React, { useEffect } from 'react';
import { Animated, Dimensions, Easing, StyleProp, View, ViewStyle } from 'react-native';
import { color, gutter, radius as r } from '../theme';

const pulse = new Animated.Value(0);
let users = 0;
let loop: Animated.CompositeAnimation | null = null;

const usePulse = () => {
  useEffect(() => {
    users += 1;
    if (!loop) {
      loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1, duration: 750, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 0, duration: 750, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ])
      );
      loop.start();
    }
    return () => {
      users -= 1;
      if (users === 0 && loop) {
        loop.stop();
        loop = null;
      }
    };
  }, []);
  return pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 0.45] });
};

/** One grey block. Width defaults to the full row. */
export const Bone = ({
  width = '100%',
  height = 14,
  radius = 8,
  style,
}: {
  width?: number | `${number}%`;
  height?: number;
  radius?: number;
  style?: StyleProp<ViewStyle>;
}) => {
  const opacity = usePulse();
  return <Animated.View style={[{ width, height, borderRadius: radius, backgroundColor: color.border, opacity }, style]} />;
};

/** A plain card-sized block. */
export const Skeleton = ({ height = 120, style }: { height?: number; style?: StyleProp<ViewStyle> }) => (
  <Bone height={height} radius={r.xl} style={[{ marginBottom: 12 }, style]} />
);

/** Car card: photo, name, details and price. */
export const CarCardSkeleton = ({
  width,
  imageHeight = 180,
  compact = false,
  style,
}: {
  width?: number;
  imageHeight?: number;
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
}) => (
  <View style={[{ width, borderRadius: compact ? r.lg : r.xl, borderWidth: 1, borderColor: color.border, backgroundColor: color.surface, overflow: 'hidden' }, style]}>
    <Bone height={imageHeight} radius={0} />
    <View style={{ padding: compact ? 10 : 14, gap: compact ? 8 : 10 }}>
      <Bone width="70%" height={compact ? 12 : 16} />
      <Bone width="45%" height={compact ? 10 : 12} />
      {!compact && (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
          <Bone width={110} height={18} />
          <Bone width={90} height={34} radius={17} />
        </View>
      )}
      {compact && <Bone width="55%" height={14} style={{ marginTop: 2 }} />}
    </View>
  </View>
);

/** Trip or booking card: thumbnail, title, dates and a status line. */
export const TripCardSkeleton = ({ style }: { style?: StyleProp<ViewStyle> }) => (
  <View style={[{ borderRadius: r.xl, borderWidth: 1, borderColor: color.border, backgroundColor: color.surface, padding: 14, marginBottom: 12 }, style]}>
    <View style={{ flexDirection: 'row', gap: 12 }}>
      <Bone width={84} height={64} radius={r.md} />
      <View style={{ flex: 1, gap: 9, paddingTop: 4 }}>
        <Bone width="65%" height={15} />
        <Bone width="45%" height={12} />
        <Bone width={70} height={20} radius={10} />
      </View>
    </View>
    <View style={{ height: 1, backgroundColor: color.border, marginVertical: 14 }} />
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      <Bone width="40%" height={12} />
      <Bone width="22%" height={12} />
    </View>
  </View>
);

/** List rows with an icon circle and two lines, for notifications and activity. */
export const ListSkeleton = ({ rows = 6, style }: { rows?: number; style?: StyleProp<ViewStyle> }) => (
  <View style={[{ paddingHorizontal: gutter, paddingTop: 8 }, style]}>
    <Bone width={90} height={12} style={{ marginBottom: 14 }} />
    {Array.from({ length: rows }).map((_, i) => (
      <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 }}>
        <Bone width={40} height={40} radius={20} />
        <View style={{ flex: 1, gap: 8 }}>
          <Bone width={i % 2 ? '60%' : '75%'} height={13} />
          <Bone width={i % 2 ? '40%' : '50%'} height={11} />
        </View>
        <Bone width={56} height={13} />
      </View>
    ))}
  </View>
);

/** A form or details page: a summary card then label and field pairs. */
export const FormSkeleton = ({ fields = 4, card = true, style }: { fields?: number; card?: boolean; style?: StyleProp<ViewStyle> }) => (
  <View style={[{ paddingHorizontal: gutter, paddingTop: 8 }, style]}>
    {card && <Skeleton height={130} style={{ marginBottom: 20 }} />}
    {Array.from({ length: fields }).map((_, i) => (
      <View key={i} style={{ marginBottom: 18 }}>
        <Bone width={i % 2 ? 110 : 140} height={12} style={{ marginBottom: 10 }} />
        <Bone height={52} radius={r.lg} />
      </View>
    ))}
  </View>
);

/** A stack of card blocks, for dashboards and summary pages. */
export const BlocksSkeleton = ({ heights = [120, 200, 160], style }: { heights?: number[]; style?: StyleProp<ViewStyle> }) => (
  <View style={[{ paddingHorizontal: gutter, paddingTop: 8 }, style]}>
    {heights.map((h, i) => (
      <Skeleton key={i} height={h} />
    ))}
  </View>
);

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/** Car details: full-width photo, title, spec tiles and text. */
export const CarDetailSkeleton = ({ photoHeight = Math.round(SCREEN_WIDTH * 0.85) }: { photoHeight?: number }) => {
  return (
    <View style={{ flex: 1, backgroundColor: color.bg }}>
      <Bone height={photoHeight} radius={0} />
      <View style={{ padding: gutter, gap: 12 }}>
        <Bone width="60%" height={24} />
        <Bone width="35%" height={14} />
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
          {[0, 1, 2, 3].map((i) => (
            <Bone key={i} height={72} radius={r.lg} style={{ flex: 1, width: undefined }} />
          ))}
        </View>
        <Bone width="40%" height={16} style={{ marginTop: 14 }} />
        <Bone height={12} />
        <Bone height={12} />
        <Bone width="75%" height={12} />
      </View>
    </View>
  );
};
