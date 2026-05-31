import React, { useEffect, useRef } from 'react';
import { Animated, Easing, ViewStyle } from 'react-native';

interface Props {
  children: React.ReactNode;
  /** Stagger delay in ms. */
  delay?: number;
  /** Slide-up distance in px. */
  offset?: number;
  duration?: number;
  style?: ViewStyle | ViewStyle[];
}

/** Fades + slides its children in on mount. Used for System "boot-up" entrances. */
export default function FadeInView({
  children,
  delay = 0,
  offset = 14,
  duration = 420,
  style,
}: Props) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [anim, delay, duration]);

  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [offset, 0],
  });

  return (
    <Animated.View style={[style, { opacity: anim, transform: [{ translateY }] }]}>
      {children}
    </Animated.View>
  );
}
