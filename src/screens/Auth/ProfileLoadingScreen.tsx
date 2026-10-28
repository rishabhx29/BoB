import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '@/components/ui';
import { COLORS, SPACE } from '@/constants/theme';

/**
 * Shown for the brief window between "a session exists" and "we know whether
 * that session has a profile row". It never appears for more than one profile
 * request; both resolved states (missing / ready) replace it immediately.
 */
export default function ProfileLoadingScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <ActivityIndicator color={COLORS.accentBlue} />
        <Text variant="bodySm" color={COLORS.textSecondary} style={styles.label}>
          Loading your profile…
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgBase },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: SPACE.sm },
  label: { marginTop: SPACE.sm },
});
