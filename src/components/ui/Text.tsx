import React from 'react';
import { Text as RNText, TextProps as RNTextProps } from 'react-native';
import { TYPOGRAPHY } from '@/constants/theme';

export interface TextProps extends RNTextProps {
  variant?: keyof typeof TYPOGRAPHY;
  color?: string;
  align?: 'auto' | 'left' | 'right' | 'center' | 'justify';
}

export function Text({
  variant = 'body',
  color,
  align = 'left',
  style,
  children,
  ...rest
}: TextProps) {
  const baseStyle = TYPOGRAPHY[variant];

  return (
    <RNText
      style={[
        baseStyle,
        { textAlign: align },
        color ? { color } : null,
        style,
      ]}
      {...rest}
    >
      {children}
    </RNText>
  );
}
