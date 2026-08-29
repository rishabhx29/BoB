import React, { useState } from 'react';
import { TextInput, TextInputProps, StyleSheet, View, StyleProp, ViewStyle } from 'react-native';
import { COLORS, SIZES, TYPOGRAPHY } from '@/constants/theme';
import { Text } from './Text';

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
}

export function Input({ 
  label, 
  error, 
  leftIcon, 
  rightIcon, 
  containerStyle, 
  style, 
  onFocus, 
  onBlur, 
  ...rest 
}: InputProps) {
  const [isFocused, setIsFocused] = useState(false);

  const handleFocus = (e: any) => {
    setIsFocused(true);
    if (onFocus) onFocus(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    if (onBlur) onBlur(e);
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text variant="caption" style={styles.label}>
          {label}
        </Text>
      )}
      <View style={[
        styles.inputContainer, 
        isFocused && styles.inputFocused,
        error ? styles.inputError : null
      ]}>
        {leftIcon && <View style={styles.iconLeft}>{leftIcon}</View>}
        <TextInput
          style={[styles.input, leftIcon ? { paddingLeft: 8 } : null, rightIcon ? { paddingRight: 8 } : null, style]}
          placeholderTextColor={COLORS.textSecondary}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...rest}
        />
        {rightIcon && <View style={styles.iconRight}>{rightIcon}</View>}
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
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.05)',
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputFocused: {
    borderColor: COLORS.brandPrimary,
    backgroundColor: COLORS.surfaceBase,
  },
  inputError: {
    borderColor: COLORS.danger,
  },
  input: {
    ...TYPOGRAPHY.body,
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: COLORS.textPrimary,
  },
  iconLeft: {
    paddingLeft: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconRight: {
    paddingRight: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    marginTop: 4,
    marginLeft: 4,
  },
});
