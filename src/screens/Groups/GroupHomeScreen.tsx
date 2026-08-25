import React, { useState, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, Animated, Pressable } from 'react-native';
import { Text } from '@/components/ui/Text';
import { COLORS, SIZES, SHADOWS } from '@/constants/theme';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Avatar } from '@/components/ui/Avatar';
import { Card } from '@/components/ui/Card';

const TactileIconButton = ({ icon, onPress }: { icon: string, onPress: () => void }) => {
  const [isPressed, setIsPressed] = useState(false);
  const translateY = useRef(new Animated.Value(0)).current;

  const handlePressIn = () => {
    setIsPressed(true);
    Animated.spring(translateY, { toValue: 2, useNativeDriver: true, speed: 50 }).start();
  };

  const handlePressOut = () => {
    setIsPressed(false);
    Animated.spring(translateY, { toValue: 0, useNativeDriver: true, speed: 50 }).start();
  };

  return (
    <Animated.View style={{ transform: [{ translateY }] }}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[
          styles.iconButton,
          isPressed ? styles.iconButtonPressed : SHADOWS.softElevation
        ]}
      >
        <Text variant="headingMd">{icon}</Text>
      </Pressable>
    </Animated.View>
  );
};

const AvatarStack = () => {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      {[1, 2, 3].map((_, i) => (
        <View key={i} style={{ marginLeft: i === 0 ? 0 : -12 }}>
          <Avatar size={32} />
        </View>
      ))}
      <View style={[styles.avatarMore, SHADOWS.softElevation]}>
        <Text variant="caption" style={{ color: COLORS.textPrimary }}>+3</Text>
      </View>
    </View>
  );
};

export default function GroupHomeScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { groupId } = route.params || {};

  const [activeTab, setActiveTab] = useState('Feed');
  const tabs = ['Feed', 'Activities', 'Members', 'Leaderboard'];

  return (
    <View style={styles.container}>
      <View style={[styles.headerPanel, SHADOWS.highElevation]}>
        <View style={styles.headerTopRow}>
          <TactileIconButton icon="←" onPress={() => navigation.goBack()} />
          <View style={styles.headerCenter}>
            <Text style={styles.headerEmoji}>🌅</Text>
            <Text variant="headingMd" style={{ marginTop: 4 }}>Morning Warriors</Text>
          </View>
          <TactileIconButton icon="⚙️" onPress={() => navigation.navigate('GroupSettings', { groupId })} />
        </View>

        <View style={styles.headerBottomRow}>
          <TouchableOpacity style={styles.memberRow}>
            <AvatarStack />
          </TouchableOpacity>

          <View style={styles.streakDisplay}>
            <Text variant="digitalDisplay" style={{ fontSize: 14 }}>🔥 12 DAY STREAK</Text>
          </View>
        </View>
      </View>

      <View style={styles.tabContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: SIZES.padding }}>
          {tabs.map(tab => (
            <TouchableOpacity 
              key={tab} 
              style={[styles.tab, activeTab === tab && styles.activeTab]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={{ 
                color: activeTab === tab ? COLORS.brandPrimary : COLORS.textSecondary, 
                fontWeight: activeTab === tab ? 'bold' : 'normal' 
              }}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {activeTab === 'Feed' && (
          <Card style={styles.calendarPlaceholder}>
            <Text variant="headingMd" style={{ marginBottom: 16 }}>Weekly Progress</Text>
            <View style={styles.calendarGrid}>
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
                <View key={i} style={styles.dayCol}>
                  <Text variant="caption">{day}</Text>
                  <View style={styles.dotStack}>
                    <View style={[styles.dot, { backgroundColor: COLORS.success }]} />
                    <View style={[styles.dot, { backgroundColor: COLORS.success }]} />
                    <View style={[styles.dot, { backgroundColor: COLORS.surfaceDark }]} />
                  </View>
                </View>
              ))}
            </View>
          </Card>
        )}
        
        <Text variant="headingMd" style={{ marginTop: 24 }}>{activeTab} Content</Text>
        <Text style={styles.subtitle}>Implementation coming soon</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surfaceBase,
  },
  headerPanel: {
    backgroundColor: COLORS.surfaceBase,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: SIZES.padding,
    zIndex: 10, // Ensure shadow drops onto content
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerCenter: {
    alignItems: 'center',
    flex: 1,
  },
  headerEmoji: {
    fontSize: 48,
  },
  headerBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
  },
  memberRow: {
    padding: 4,
  },
  streakDisplay: {
    backgroundColor: COLORS.surfaceScreen,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#000',
    shadowColor: '#fff',
    shadowOffset: { width: -1, height: -1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 0,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceBase,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButtonPressed: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 1,
  },
  avatarMore: {
    marginLeft: -12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.surfaceBase,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabContainer: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceDark,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    marginRight: 8,
  },
  activeTab: {
    borderBottomColor: COLORS.brandPrimary,
  },
  content: {
    padding: SIZES.padding,
    alignItems: 'center',
  },
  subtitle: {
    color: COLORS.textSecondary,
    marginTop: 8,
  },
  calendarPlaceholder: {
    width: '100%',
    padding: 20,
    marginTop: 8,
  },
  calendarGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  dayCol: {
    alignItems: 'center',
  },
  dotStack: {
    marginTop: 8,
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: 4,
  },
});
