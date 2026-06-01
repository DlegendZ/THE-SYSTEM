import React, { useEffect, useRef } from 'react';
import { Animated, TouchableOpacity, StyleSheet } from 'react-native';
import Svg, { Circle, Rect, Text as SvgText } from 'react-native-svg';
import { FONTS } from '../../theme/typography';

interface Props {
  weekNumber: number;
  status: 'locked' | 'completed' | 'current' | 'future';
  completionPct?: number;
  onPress?: () => void;
}

const NODE_SIZE = 48;

export default function WorldMapNode({ weekNumber, status, completionPct = 0, onPress }: Props): React.JSX.Element {
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (status === 'current') {
      const anim = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 0, duration: 1000, useNativeDriver: true }),
        ])
      );
      anim.start();
      return () => anim.stop();
    }
    return undefined;
  }, [status]);

  const pulseOpacity = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.8] });
  const pulseScale = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [1.0, 1.3] });

  const colors = {
    locked:    { bg: '#2a2a2a', border: '#444444', text: '#555555' },
    completed: { bg: '#1a1a00', border: '#ffd700', text: '#ffd700' },
    current:   { bg: '#0a0a00', border: '#ffd700', text: '#ffd700' },
    future:    { bg: '#1a1a1a', border: '#333333', text: '#444444' },
  };
  const c = colors[status];

  return (
    <TouchableOpacity onPress={onPress} disabled={status === 'locked' || status === 'future'}>
      <Animated.View style={styles.container}>
        {status === 'current' && (
          <Animated.View
            style={[styles.pulseRing, { opacity: pulseOpacity, transform: [{ scale: pulseScale }] }]}
          />
        )}
        <Svg width={NODE_SIZE} height={NODE_SIZE}>
          <Circle cx={NODE_SIZE / 2} cy={NODE_SIZE / 2} r={NODE_SIZE / 2 - 2} fill={c.bg} />
          <Circle cx={NODE_SIZE / 2} cy={NODE_SIZE / 2} r={NODE_SIZE / 2 - 2} fill="none" stroke={c.border} strokeWidth={3} />
          <SvgText
            x={NODE_SIZE / 2} y={NODE_SIZE / 2 + 5}
            fontSize={14}
            fontFamily={FONTS.display}
            fill={c.text} textAnchor="middle"
          >
            {weekNumber}
          </SvgText>
          {status === 'completed' && (
            <SvgText
              x={NODE_SIZE / 2} y={NODE_SIZE / 2 + 16}
              fontSize={8} fontFamily={FONTS.display} fill="#ffd700" textAnchor="middle"
            >
              {completionPct}%
            </SvgText>
          )}
          {status === 'locked' && (
            <>
              <Rect x={18} y={22} width={12} height={10} fill="#444444" rx={1} />
              <Rect x={20} y={18} width={8} height={6} fill="none" stroke="#444444" strokeWidth={2} rx={4} />
            </>
          )}
        </Svg>
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', width: NODE_SIZE, height: NODE_SIZE },
  pulseRing: {
    position: 'absolute',
    width: NODE_SIZE + 12,
    height: NODE_SIZE + 12,
    borderRadius: (NODE_SIZE + 12) / 2,
    borderWidth: 2,
    borderColor: '#ffd700',
  },
});
