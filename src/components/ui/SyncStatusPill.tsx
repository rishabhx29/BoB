import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from './Text';
import { Icon } from './Icon';
import { COLORS, RADIUS, SPACE } from '@/constants/theme';
import { useOfflineSync } from '@/hooks/useOfflineSync';

const SUCCESS_VISIBLE_MS = 4_000;

function proofLabel(count: number): string {
  return count === 1 ? 'proof' : 'proofs';
}

/**
 * Floating queue status pill.
 *
 * Appears only when there is something to report:
 *   syncing · waiting for connection · failed · recently synced.
 * Mounted once at the app root so every screen shows the same truth.
 */
export function SyncStatusPill() {
  const insets = useSafeAreaInsets();
  const {
    pendingCount,
    failedCount,
    blockedCount,
    isSyncing,
    lastResult,
    lastSyncedAt,
    syncNow,
  } = useOfflineSync();

  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (!lastSyncedAt) return;
    setShowSuccess(true);
    const timer = setTimeout(() => setShowSuccess(false), SUCCESS_VISIBLE_MS);
    return () => clearTimeout(timer);
  }, [lastSyncedAt]);

  const retryable = failedCount + blockedCount;
  const syncedCount = lastResult
    ? lastResult.successCount + lastResult.discardedCount
    : 0;

  if (isSyncing) {
    return (
      <Shell bottom={insets.bottom}>
        <ActivityIndicator size="small" color={COLORS.accentBlue} />
        <Text variant="bodySm" color={COLORS.textPrimary} style={styles.label}>
          {pendingCount > 0
            ? `Syncing ${pendingCount} ${proofLabel(pendingCount)}…`
            : 'Syncing proofs…'}
        </Text>
      </Shell>
    );
  }

  if (retryable > 0) {
    return (
      <Shell bottom={insets.bottom} accessibilityRole="alert">
        <View style={[styles.iconCircle, { backgroundColor: `${COLORS.warning}20` }]}>
          <Icon name="warning-circle" size={16} color={COLORS.warning} />
        </View>
        <Text variant="bodySm" color={COLORS.textPrimary} style={styles.label}>
          {retryable === 1
            ? "1 proof couldn't sync"
            : `${retryable} proofs couldn't sync`}
        </Text>
        <Pressable
          onPress={() => void syncNow()}
          hitSlop={8}
          style={styles.action}
          accessibilityRole="button"
          accessibilityLabel="Retry syncing proofs"
        >
          <Text variant="bodySm" color={COLORS.accentBlue} style={styles.actionText}>
            Retry
          </Text>
        </Pressable>
      </Shell>
    );
  }

  if (pendingCount > 0) {
    return (
      <Shell bottom={insets.bottom} accessibilityRole="alert">
        <View style={[styles.iconCircle, { backgroundColor: `${COLORS.accentBlue}20` }]}>
          <Icon name="hourglass" size={16} color={COLORS.accentBlue} />
        </View>
        <Text variant="bodySm" color={COLORS.textPrimary} style={styles.label}>
          {pendingCount === 1
            ? '1 proof waiting to sync'
            : `${pendingCount} proofs waiting to sync`}
        </Text>
        <Pressable
          onPress={() => void syncNow()}
          hitSlop={8}
          style={styles.action}
          accessibilityRole="button"
          accessibilityLabel="Try syncing now"
        >
          <Text variant="bodySm" color={COLORS.accentBlue} style={styles.actionText}>
            Try now
          </Text>
        </Pressable>
      </Shell>
    );
  }

  if (showSuccess && syncedCount > 0) {
    return (
      <Shell bottom={insets.bottom} accessibilityRole="alert">
        <View style={[styles.iconCircle, { backgroundColor: `${COLORS.success}20` }]}>
          <Icon name="check-circle" size={16} color={COLORS.success} />
        </View>
        <Text variant="bodySm" color={COLORS.textPrimary} style={styles.label}>
          {syncedCount === 1
            ? '1 proof synced'
            : `${syncedCount} proofs synced`}
        </Text>
      </Shell>
    );
  }

  return null;
}

function Shell({
  children,
  bottom,
  accessibilityRole,
}: {
  children: React.ReactNode;
  bottom: number;
  accessibilityRole?: 'alert';
}) {
  return (
    <View pointerEvents="box-none" style={[styles.overlay, { bottom: bottom + 84 }]}>
      <View
        style={styles.pill}
        accessibilityRole={accessibilityRole}
        accessibilityLiveRegion="polite"
      >
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    left: SPACE.lg,
    right: SPACE.lg,
    alignItems: 'center',
    zIndex: 100,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.sm,
    maxWidth: 420,
    backgroundColor: COLORS.bgPanel,
    borderWidth: 1,
    borderColor: COLORS.hairline,
    borderRadius: RADIUS.pill,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  iconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    flexShrink: 1,
  },
  action: {
    paddingHorizontal: 4,
  },
  actionText: {
    fontWeight: '700',
  },
});
