import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function LeaderboardScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Leaderboard</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#E5E7EB' },
  text: { fontSize: 24, fontWeight: 'bold' },
});
