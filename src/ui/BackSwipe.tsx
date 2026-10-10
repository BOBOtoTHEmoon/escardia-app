// Swipe in from the left edge to go back.
// The app does not use a navigation library, so this listens for a horizontal drag that
// starts at the very edge of the screen (start = current position minus distance moved) (taps and normal scrolling are left alone) and
// shows a small back arrow that fills in once the drag is far enough to count.
import React, { ReactNode, useRef } from 'react';
import { Animated, Dimensions, PanResponder, StyleSheet, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { color, shadow, themed } from '../theme';

const EDGE = 28; // how close to the left edge the drag must start
const TRIGGER = 70; // how far to drag before letting go counts as "back"
const SIZE = 44;

export const BackSwipe = ({ enabled, onBack, children }: { enabled: boolean; onBack: () => void; children: ReactNode }) => {
  const dx = useRef(new Animated.Value(0)).current;
  const y = useRef(new Animated.Value(Dimensions.get('window').height / 2)).current;
  const live = useRef({ enabled, onBack });
  live.current = { enabled, onBack };

  const reset = () => Animated.spring(dx, { toValue: 0, useNativeDriver: false, friction: 8 }).start();

  const pan = useRef(
    PanResponder.create({
      // Capture only edge drags that are clearly sideways, so buttons and scroll views keep working.
      onMoveShouldSetPanResponderCapture: (_, g) =>
        live.current.enabled && g.moveX - g.dx <= EDGE && g.dx > 10 && Math.abs(g.dx) > Math.abs(g.dy) * 1.5,
      onPanResponderGrant: (_, g) => y.setValue(g.moveY - SIZE / 2),
      onPanResponderMove: (_, g) => dx.setValue(Math.max(0, g.dx)),
      onPanResponderRelease: (_, g) => {
        if (g.dx > TRIGGER || (g.dx > 30 && g.vx > 0.6)) {
          dx.setValue(0);
          live.current.onBack();
        } else reset();
      },
      onPanResponderTerminate: reset,
      onPanResponderTerminationRequest: () => false,
    })
  ).current;

  const left = dx.interpolate({ inputRange: [0, TRIGGER + 40], outputRange: [-SIZE, 18], extrapolate: 'clamp' });
  const bg = dx.interpolate({ inputRange: [TRIGGER - 10, TRIGGER], outputRange: [color.surface, color.primary], extrapolate: 'clamp' });
  const fg = dx.interpolate({ inputRange: [TRIGGER - 10, TRIGGER], outputRange: [0, 1], extrapolate: 'clamp' });
  const scale = dx.interpolate({ inputRange: [0, TRIGGER], outputRange: [0.6, 1], extrapolate: 'clamp' });

  return (
    <View style={{ flex: 1 }} {...pan.panHandlers}>
      {children}
      <Animated.View pointerEvents="none" style={[styles.bubble, shadow.md, { top: y, transform: [{ translateX: left }, { scale }], backgroundColor: bg }]}>
        <View style={[StyleSheet.absoluteFill, styles.center]}>
          <Feather name="chevron-left" size={22} color={color.primary} />
        </View>
        <Animated.View style={[StyleSheet.absoluteFill, styles.center, { opacity: fg }]}>
          <Feather name="chevron-left" size={22} color="#FFFFFF" />
        </Animated.View>
      </Animated.View>
    </View>
  );
};

const styles = themed(() => StyleSheet.create({
  bubble: {
    position: 'absolute',
    left: 0,
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    borderWidth: 1,
    borderColor: color.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: { alignItems: 'center', justifyContent: 'center' },
}));
