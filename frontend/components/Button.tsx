import { TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, borderRadius, shadows } from '../constants/theme';
import Spinner from './Spinner';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'gold' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
}

export default function Button({ title, onPress, variant = 'primary', size = 'md', disabled, loading, style }: ButtonProps) {
  const isDisabled = disabled || loading;
  return (
    <TouchableOpacity
      style={[styles.base, styles[variant], styles[`size_${size}`], isDisabled && styles.disabled, variant !== 'outline' && variant !== 'ghost' && styles[`shadow_${variant}`], style]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
    >
      {loading ? (
        <Spinner color={variant === 'gold' || variant === 'outline' || variant === 'ghost' ? colors.green : colors.white} />
      ) : (
        <Text style={[styles.text, styles[`text_${variant}`], styles[`textSize_${size}`]]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9999,
    width: '100%',
  },
  primary: {
    backgroundColor: colors.green,
  },
  gold: {
    backgroundColor: colors.gold,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: colors.green,
  },
  ghost: {
    backgroundColor: colors.greenLight,
  },
  shadow_primary: {
    ...shadows.green,
  },
  shadow_gold: {
    ...shadows.gold,
  },
  size_sm: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  size_md: {
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  size_lg: {
    paddingVertical: 18,
    paddingHorizontal: 24,
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontWeight: '700',
  },
  text_primary: {
    color: colors.white,
  },
  text_gold: {
    color: colors.t1,
  },
  text_outline: {
    color: colors.green,
  },
  text_ghost: {
    color: colors.green,
  },
  textSize_sm: {
    fontSize: 13,
  },
  textSize_md: {
    fontSize: 15,
  },
  textSize_lg: {
    fontSize: 17,
  },
});
