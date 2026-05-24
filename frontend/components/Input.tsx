import { View, TextInput, Text, StyleSheet, TextInputProps } from 'react-native';
import { useState } from 'react';
import { colors, spacing, borderRadius, typography } from '../constants/theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
}

export default function Input({ label, error, style, onFocus, onBlur, ...props }: InputProps) {
  const [focused, setFocused] = useState(false);

  const handleFocus = (e: any) => {
    setFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e: any) => {
    setFocused(false);
    onBlur?.(e);
  };

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        style={[
          styles.input,
          focused && styles.inputFocused,
          error && styles.inputError,
          style,
        ]}
        placeholderTextColor={colors.t4}
        onFocus={handleFocus}
        onBlur={handleBlur}
        {...props}
      />
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.r16,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: colors.t3,
    marginBottom: 6,
  },
  input: {
    width: '100%',
    paddingVertical: 14,
    paddingHorizontal: spacing.r16,
    borderRadius: borderRadius.r16,
    borderWidth: 1.5,
    borderColor: colors.bg2,
    backgroundColor: colors.surface,
    fontSize: 15,
    color: colors.t1,
  },
  inputFocused: {
    borderColor: colors.green,
    shadowColor: colors.green,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  inputError: {
    borderColor: colors.red,
  },
  error: {
    fontSize: 12,
    color: colors.red,
    marginTop: spacing.xs,
  },
});
