import { useEffect, useRef } from 'react';
import { Animated } from 'react-native';
import { colors } from '../constants/theme';

export default function Spinner({ color, size = 28 }: { color?: string; size?: number }) {
  const c = color || colors.green;
  const spinValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 900,
        useNativeDriver: true,
      })
    );
    animation.start();
    return () => animation.stop();
  }, []);

  const rotate = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: Math.max(2, Math.round(size / 9)),
        borderColor: 'rgba(11,77,59,0.25)',
        borderTopColor: c,
        transform: [{ rotate }],
      }}
    />
  );
}
