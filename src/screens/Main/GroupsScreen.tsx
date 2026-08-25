import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, Alert, Animated, Pressable } from 'react-native';
import { Text } from '@/components/ui/Text';
import { GroupCard } from '@/components/groups/GroupCard';
import { COLORS, SIZES, SHADOWS } from '@/constants/theme';
import { useNavigation } from '@react-navigation/native';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';

export default function GroupsScreen() {
  const navigation = useNavigation<any>();
  const [refreshing, setRefreshing] = useState(false);
  const [actionSheetVisible, setActionSheetVisible] = useState(false);

  // Mock data for Phase 3
  const [groups, setGroups] = useState([
    {
      id: '1',
      name: 'Morning Warriors',
      emoji: '🌅',
      avatars: [null, null, null, null, null],
      activitiesCount: 3,
      allSubmitted: false,
    },
    {
      id: '2',
      name: 'Book Worms',
      emoji: '📚',
      avatars: [null, null],
      activitiesCount: 1,
      allSubmitted: true,
    }
  ]);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  const handleGroupPress = (groupId: string) => {
    navigation.navigate('GroupHome', { groupId });
  };

  const handleGroupLongPress = (groupId: string, groupName: string) => {
    Alert.alert(
      'Leave Group?',
      `Are you sure you want to leave ${groupName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Leave', 
          style: 'destructive',
          onPress: () => setGroups(prev => prev.filter(g => g.id !== groupId))
        }
      ]
    );
  };

  // Volt pulse animation
  const voltScale = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (groups.length === 0) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(voltScale, { toValue: 1.1, duration: 1000, useNativeDriver: true }),
          Animated.timing(voltScale, { toValue: 1, duration: 1000, useNativeDriver: true }),
        ])
      ).start();
    }
  }, [groups.length]);

  const renderEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Animated.View style={[styles.voltPlaceholder, { transform: [{ scale: voltScale }] }]}>
        <Text style={{ fontSize: 40 }}>⚡</Text>
      </Animated.View>
      <Text variant="headingMd" style={styles.emptyTitle}>No pacts yet</Text>
      <Text variant="body" style={styles.emptySub}>
        Create a new group or join an existing one to start building habits with friends.
      </Text>
    </View>
  );

  // Tactile FAB
  const fabTranslateY = useRef(new Animated.Value(0)).current;
  const handleFabPressIn = () => {
    Animated.spring(fabTranslateY, { toValue: 4, useNativeDriver: true, speed: 50 }).start();
  };
  const handleFabPressOut = () => {
    Animated.spring(fabTranslateY, { toValue: 0, useNativeDriver: true, speed: 50 }).start();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text variant="headingLg">Your Pacts</Text>
      </View>

      <FlatList
        data={groups}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.brandPrimary} />
        }
        ListEmptyComponent={renderEmptyComponent}
        renderItem={({ item }) => (
          <GroupCard
            name={item.name}
            emoji={item.emoji}
            avatars={item.avatars}
            activitiesCount={item.activitiesCount}
            allSubmitted={item.allSubmitted}
            onPress={() => handleGroupPress(item.id)}
            onLongPress={() => handleGroupLongPress(item.id, item.name)}
          />
        )}
      />

      <Animated.View style={[styles.fabContainer, { transform: [{ translateY: fabTranslateY }] }]}>
        <Pressable 
          style={({ pressed }) => [styles.fab, pressed ? SHADOWS.fabPressed : SHADOWS.fabDefault]}
          onPressIn={handleFabPressIn}
          onPressOut={handleFabPressOut}
          onPress={() => setActionSheetVisible(true)}
        >
          <Text style={styles.fabIcon}>+</Text>
        </Pressable>
      </Animated.View>

      <BottomSheet 
        isVisible={actionSheetVisible}
        onClose={() => setActionSheetVisible(false)}
      >
        <Text variant="headingMd" style={styles.sheetTitle}>Add Group</Text>
        <View style={styles.sheetActions}>
          <Button 
            label="✨ Create a new Pact" 
            variant="primary" 
            isPill
            onPress={() => {
              setActionSheetVisible(false);
              navigation.navigate('CreateGroup');
            }}
          />
          <View style={{ height: 16 }} />
          <Button 
            label="🤝 Join with invite code" 
            variant="secondary" 
            isPill
            onPress={() => {
              setActionSheetVisible(false);
              navigation.navigate('JoinGroup');
            }}
          />
        </View>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: COLORS.surfaceBase,
  },
  header: {
    paddingHorizontal: SIZES.padding,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: COLORS.surfaceBase,
  },
  listContent: {
    padding: SIZES.padding,
    paddingBottom: 120, // Space for FAB
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  voltPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.surfaceDark,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    ...SHADOWS.mediumElevation,
  },
  emptyTitle: {
    marginBottom: 8,
  },
  emptySub: {
    textAlign: 'center',
    maxWidth: '80%',
    color: COLORS.textSecondary,
    lineHeight: 24,
  },
  fabContainer: {
    position: 'absolute',
    bottom: 32,
    right: 24,
  },
  fab: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.brandPrimary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fabIcon: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
    marginTop: -2,
  },
  sheetTitle: {
    marginBottom: 24,
    textAlign: 'center',
  },
  sheetActions: {
    paddingBottom: 16,
  }
});
