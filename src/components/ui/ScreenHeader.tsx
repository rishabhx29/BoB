import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from './Text';
import { Icon } from './Icon';
import { COLORS, SPACE } from '@/constants/theme';

interface ScreenHeaderProps {
  title: string;
  onBack?: () => void;
  right?: React.ReactNode;
  /** Optional eyebrow above the title, e.g. "Pact settings". */
  eyebrow?: string;
}

/** Compact header used by stacked screens (settings, notifications, detail). */
export function ScreenHeader({ title, onBack, right, eyebrow }: ScreenHeaderProps) {
  return (
    <View style={styles.header}>
      {onBack ? (
        <Pressable
          onPress={onBack}
          hitSlop={8}
          style={styles.backBtn}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Icon name="arrow-left" size={20} color={COLORS.textPrimary} />
        </Pressable>
      ) : (
        <View style={styles.backBtn} />
      )}

      <View style={styles.titleWrap}>
        {eyebrow ? (
          <Text variant="caption" color={COLORS.textTertiary}>
            {eyebrow}
          </Text>
        ) : null}
        <Text variant="headingSm" color={COLORS.textPrimary} numberOfLines={1}>
          {title}
        </Text>
      </View>

      <View style={styles.right}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACE.md,
    paddingVertical: 10,
    minHeight: 56,
    gap: SPACE.sm,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleWrap: {
    flex: 1,
    justifyContent: 'center',
  },
  right: {
    minWidth: 40,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
});
