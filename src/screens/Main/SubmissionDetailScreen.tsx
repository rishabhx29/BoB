import React, { useCallback } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Icon, ScreenHeader, Text } from '@/components/ui';
import { FeedCard } from '@/components/ui/FeedCard';
import { COLORS, SPACE } from '@/constants/theme';
import { useSubmissionFeedItem } from '@/hooks/useFeed';

/**
 * Full-screen view of one proof, reached from a notification deep link
 * (`streakpact://submission/<id>`). Renders the same card as the feed so
 * reactions and comments behave identically.
 */
export default function SubmissionDetailScreen({ navigation, route }: any) {
  const submissionId: string = route?.params?.submissionId ?? '';
  const submission = useSubmissionFeedItem(submissionId);

  const goBack = useCallback(() => {
    if (navigation.canGoBack?.()) {
      navigation.goBack();
    } else {
      navigation.navigate('Main', { screen: 'Home' });
    }
  }, [navigation]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScreenHeader title="Proof" onBack={goBack} />

      {submission.isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={COLORS.accentBlue} />
          <Text variant="bodySm" color={COLORS.textSecondary} style={styles.centerText}>
            Loading proof…
          </Text>
        </View>
      ) : submission.isError ? (
        <View style={styles.center}>
          <View style={styles.centerIcon}>
            <Icon name="warning-circle" size={24} color={COLORS.warning} />
          </View>
          <Text variant="headingSm" color={COLORS.textPrimary}>
            Couldn't load this proof
          </Text>
          <Text variant="bodySm" color={COLORS.textSecondary} style={styles.centerText}>
            It may have been deleted, or you may no longer share a pact with its author.
          </Text>
          <View style={{ height: SPACE.lg }} />
          <Button
            label="Retry"
            variant="pill"
            leadingIcon="arrows-clockwise"
            onPress={() => void submission.refetch()}
          />
        </View>
      ) : !submission.data ? (
        <View style={styles.center}>
          <View style={styles.centerIcon}>
            <Icon name="fire" size={24} color={COLORS.accentRed} />
          </View>
          <Text variant="headingSm" color={COLORS.textPrimary}>
            Proof not found
          </Text>
          <Text variant="bodySm" color={COLORS.textSecondary} style={styles.centerText}>
            This proof is no longer available. It may have been deleted.
          </Text>
          <View style={{ height: SPACE.lg }} />
          <Button label="Back to feed" variant="pill" onPress={goBack} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <FeedCard item={submission.data} onDeleted={goBack} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.bgBase },
  content: { paddingHorizontal: SPACE.lg, paddingTop: SPACE.sm, paddingBottom: 80 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACE.xxl,
  },
  centerText: { textAlign: 'center', marginTop: 6, maxWidth: 300 },
  centerIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.bgPanel,
    borderWidth: 1,
    borderColor: COLORS.hairline,
    marginBottom: SPACE.md,
  },
});
