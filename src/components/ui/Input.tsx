import React from 'react';
import { TextInput, TextInputProps, StyleSheet, View } from 'react-native';
import { COLORS, SIZES, TYPOGRAPHY } from '@/constants/theme';
import { Text } from './Text';

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
}

export function Input({ label, error, style, ...rest }: InputProps) {
  return (
    <View style={styles.container}>
      {label && (
        <Text variant="caption" style={styles.label}>
          {label}
        </Text>
      )}
      <View style={[styles.inputContainer, error ? styles.inputError : null]}>
        <TextInput
          style={[styles.input, style]}
          placeholderTextColor={COLORS.textSecondary}
          {...rest}
        />
      </View>
      {error && (
        <Text variant="caption" color={COLORS.danger} style={styles.errorText}>
          {error}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: SIZES.padding / 2,
  },
  label: {
    marginBottom: 8,
    marginLeft: 4,
  },
  inputContainer: {
    backgroundColor: COLORS.surfaceDark,
    borderRadius: SIZES.radiusScreen,
    // Deep Recess inset shadow simulation
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  inputError: {
    borderColor: COLORS.danger,
    borderWidth: 1,
  },
  input: {
    ...TYPOGRAPHY.body,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: COLORS.textPrimary,
  },
  errorText: {
    marginTop: 4,
    marginLeft: 4,
  },
});
