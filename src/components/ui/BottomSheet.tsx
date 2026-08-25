import React from 'react';
import { View, StyleSheet, Modal, Pressable, Animated } from 'react-native';
import { COLORS, SHADOWS, SIZES } from '@/constants/theme';

export interface BottomSheetProps {
  isVisible: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export function BottomSheet({ isVisible, onClose, children }: BottomSheetProps) {
  // Simple implementation. In a real app, use @gorhom/bottom-sheet or similar for gesture handling
  
  if (!isVisible) return null;

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={[styles.sheet, SHADOWS.highElevation]}>
          <View style={styles.handle} />
          {children}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  sheet: {
    backgroundColor: COLORS.surfaceBase,
    borderTopLeftRadius: SIZES.radiusCard,
    borderTopRightRadius: SIZES.radiusCard,
    padding: SIZES.padding,
    paddingBottom: SIZES.padding * 2, // Account for safe area
    minHeight: 300,
  },
  handle: {
    width: 40,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.surfaceDark,
    alignSelf: 'center',
    marginBottom: SIZES.padding,
  }
});
