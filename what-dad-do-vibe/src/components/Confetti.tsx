import React, { useEffect, useRef } from 'react';
import { View, Animated, useWindowDimensions, StyleSheet } from 'react-native';

const COLORS = ['#AE5D4C','#C2A96B','#8FA375','#647B85','#B39B78','#C9A6A0','#9FAEC2'];
const N = 50;

interface Particle {
  x: number;
  translateY: Animated.Value;
  rotate: Animated.Value;
  color: string;
  size: number;
  duration: number;
  delay: number;
}

export function Confetti() {
  // 用 useWindowDimensions 而不是模块级 Dimensions.get，窗口尺寸变化后仍然正确
  const { width: W, height: H } = useWindowDimensions();
  const pRef = useRef<Particle[] | null>(null);
  if (!pRef.current) {
    pRef.current = Array.from({ length: N }, (_, i) => ({
      x: Math.random() * W,
      translateY: new Animated.Value(-H), // 从屏幕上方外开始
      rotate: new Animated.Value(0),
      color: COLORS[i % COLORS.length],
      size: 6 + Math.random() * 10,
      duration: 3000 + Math.random() * 3000,
      delay: Math.random() * 2000,
    }));
  }
  const particles = pRef.current;

  useEffect(() => {
    const anims = particles.map(p =>
      Animated.parallel([
        Animated.timing(p.translateY, { toValue: H, duration: p.duration, delay: p.delay, useNativeDriver: true }),
        Animated.timing(p.rotate, { toValue: 1, duration: p.duration, delay: p.delay, useNativeDriver: true }),
      ])
    );
    const composite = Animated.stagger(80, anims);
    composite.start();
    return () => composite.stop();
  }, []);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {particles.map((p, i) => (
        <Animated.View
          key={i}
          style={[styles.p, {
            left: p.x,
            top: -30,
            width: p.size, height: p.size * 0.6,
            backgroundColor: p.color, borderRadius: 2,
            transform: [
              { translateY: p.translateY },
              { rotate: p.rotate.interpolate({
                inputRange: [0, 1], outputRange: ['0deg', '720deg'],
              })},
            ],
          }]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  p: { position: 'absolute', opacity: 0.85 },
});
