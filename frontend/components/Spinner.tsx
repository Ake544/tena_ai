import { useEffect, useRef } from 'react';
import { Animated } from 'react-native';
import { colors } from '../constants/theme';

export default function Spinner({ color }: { color?: string }) {
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
        width: 28,
        height: 28,
        borderRadius: 14,
        borderWidth: 3,
        borderColor: 'rgba(11,77,59,0.25)',
        borderTopColor: c,
        transform: [{ rotate }],
      }}
    />
  );
}
