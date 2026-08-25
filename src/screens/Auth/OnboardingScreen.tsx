import React, { useRef, useState } from 'react';
import { View, StyleSheet, FlatList, Dimensions, Animated, Pressable } from 'react-native';
import { Text, Button } from '@/components/ui';
import { COLORS, SIZES } from '@/constants/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

const ONBOARDING_DATA = [
  {
    id: '1',
    title: 'Track Together',
    description: 'Join your friends and keep each other accountable every single day.',
    icon: '🤝',
  },
  {
    id: '2',
    title: 'Stay Accountable',
    description: 'See the green dots fill up your calendar. Miss a day, break the streak.',
    icon: '🔥',
  },
  {
    id: '3',
    title: 'Level Up',
    description: 'Earn XP, unlock badges, and become a legend in your group.',
    icon: '⭐',
  },
];

export default function OnboardingScreen({ navigation }: any) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef<FlatList>(null);

  const viewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems[0]) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const handleComplete = async () => {
    await AsyncStorage.setItem('onboarding_completed', 'true');
    navigation.replace('Login');
  };

  const handleNext = () => {
    if (currentIndex < ONBOARDING_DATA.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
    } else {
      handleComplete();
    }
  };

  const renderItem = ({ item, index }: any) => {
    // Parallax effect
    const translateX = scrollX.interpolate({
      inputRange: [(index - 1) * width, index * width, (index + 1) * width],
      outputRange: [width * 0.5, 0, -width * 0.5],
    });

    return (
      <View style={styles.slide}>
        <Animated.View style={[styles.imageContainer, { transform: [{ translateX }] }]}>
          <Text style={styles.emoji}>{item.icon}</Text>
        </Animated.View>
        <View style={styles.textContainer}>
          <Text variant="headingLg" style={styles.title}>{item.title}</Text>
          <Text variant="body" color={COLORS.textSecondary} style={styles.description}>
            {item.description}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        {currentIndex < ONBOARDING_DATA.length - 1 && (
          <Pressable onPress={handleComplete} style={styles.skipBtn}>
            <Text variant="body" color={COLORS.textSecondary}>Skip</Text>
          </Pressable>
        )}
      </View>

      <FlatList
        ref={flatListRef}
        data={ONBOARDING_DATA}
        renderItem={renderItem}
        horizontal
        showsHorizontalScrollIndicator={false}
        pagingEnabled
        bounces={false}
        keyExtractor={(item) => item.id}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
          useNativeDriver: false,
        })}
        onViewableItemsChanged={viewableItemsChanged}
        viewabilityConfig={viewConfig}
        scrollEventThrottle={32}
      />

      <View style={styles.footer}>
        <View style={styles.dotContainer}>
          {ONBOARDING_DATA.map((_, i) => {
            const dotWidth = scrollX.interpolate({
              inputRange: [(i - 1) * width, i * width, (i + 1) * width],
              outputRange: [10, 24, 10],
              extrapolate: 'clamp',
            });
            const backgroundColor = scrollX.interpolate({
              inputRange: [(i - 1) * width, i * width, (i + 1) * width],
              outputRange: [COLORS.surfaceDark, COLORS.brandPrimary, COLORS.surfaceDark],
              extrapolate: 'clamp',
            });
            return (
              <Animated.View key={i.toString()} style={[styles.dot, { width: dotWidth, backgroundColor }]} />
            );
          })}
        </View>

        <Button
          label={currentIndex === ONBOARDING_DATA.length - 1 ? "Get Started" : "Next"}
          onPress={handleNext}
          style={styles.button}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surfaceBase,
  },
  header: {
    height: 60,
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingHorizontal: 24,
  },
  skipBtn: {
    padding: 8,
  },
  slide: {
    width,
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  imageContainer: {
    width: width - 80,
    height: width - 80,
    backgroundColor: COLORS.surfaceDark,
    borderRadius: SIZES.radiusScreen,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    marginVertical: SIZES.padding * 2,
  },
  emoji: {
    fontSize: 120,
  },
  textContainer: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    textAlign: 'center',
    lineHeight: 24,
  },
  footer: {
    height: 120,
    paddingHorizontal: 32,
    justifyContent: 'space-between',
    paddingBottom: 32,
  },
  dotContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 24,
  },
  dot: {
    height: 10,
    borderRadius: 5,
    marginHorizontal: 6,
  },
  button: {
    width: '100%',
  },
});
