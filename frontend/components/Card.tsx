import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors, shadows } from '../constants/theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'sm';
}

export default function Card({ children, style, variant = 'default' }: CardProps) {
  return (
    <View style={[styles.base, variant === 'sm' ? styles.sm : styles.default, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: 'rgba(11,77,59,0.06)',
    ...shadows.sm,
  },
  default: {
    borderRadius: 24,
    padding: 20,
  },
  sm: {
    borderRadius: 16,
    padding: 16,
  },
});
