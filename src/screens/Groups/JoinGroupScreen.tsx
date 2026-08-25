import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, TextInput, Keyboard, Animated } from 'react-native';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { COLORS, SIZES, SHADOWS } from '@/constants/theme';
import { useNavigation, useRoute } from '@react-navigation/native';
import { CameraView, Camera } from 'expo-camera';
import { z } from 'zod';

const CODE_LENGTH = 6;
const joinSchema = z.string().length(CODE_LENGTH).regex(/^[A-HJ-NP-Z2-9]+$/, "Invalid characters. Use A-Z, 2-9 (no 0, 1, I, O)");

export default function JoinGroupScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const [code, setCode] = useState(route.params?.code || '');
  const [error, setError] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const inputRef = useRef<TextInput>(null);
  
  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  useEffect(() => {
    if (code.length === CODE_LENGTH) {
      try {
        joinSchema.parse(code);
        // Add a slight delay for better UX
        setTimeout(() => {
          navigation.replace('GroupHome', { groupId: code });
        }, 300);
      } catch (e) {
        // Just let them fix it if invalid
      }
    }
  }, [code, navigation]);

  const handleCodeChange = (text: string) => {
    const upperText = text.toUpperCase().replace(/[^A-HJ-NP-Z2-9]/g, '');
    setCode(upperText);
    setError('');
    
    if (upperText.length === CODE_LENGTH) {
      Keyboard.dismiss();
    }
  };

  const handleJoin = () => {
    const result = joinSchema.safeParse(code);
    if (result.success) {
      // Valid code, proceed to join
      navigation.replace('GroupHome', { groupId: code });
    } else {
      setError(result.error.issues[0].message);
    }
  };

  const handleBarcodeScanned = ({ data }: any) => {
    setIsScanning(false);
    // Assuming QR code contains deep link: streakpact://invite/CODE
    const match = data.match(/invite\/([A-Z2-9]{6})/i);
    if (match) {
      setCode(match[1].toUpperCase());
      setTimeout(handleJoin, 500);
    } else {
      setError("Invalid QR Code format.");
    }
  };

  const renderSegmentedInput = () => {
    return (
      <View style={styles.segmentedContainer}>
        {[...Array(CODE_LENGTH)].map((_, i) => {
          const char = code[i] || '';
          const isActive = i === code.length;
          return (
            <View 
              key={i} 
              style={[
                styles.segmentSlot, 
                isActive && styles.segmentSlotActive,
                char ? styles.segmentSlotFilled : null
              ]}
            >
              <Text style={styles.segmentText}>{char}</Text>
            </View>
          );
        })}
      </View>
    );
  };

  if (isScanning) {
    return (
      <View style={styles.container}>
        {hasPermission === false ? (
          <View style={styles.content}>
            <Text>No access to camera</Text>
            <Button label="Back" onPress={() => setIsScanning(false)} style={{ marginTop: 20 }} />
          </View>
        ) : (
          <CameraView 
            style={StyleSheet.absoluteFill} 
            onBarcodeScanned={handleBarcodeScanned}
            barcodeScannerSettings={{
              barcodeTypes: ["qr"],
            }}
          >
            <View style={styles.scannerOverlay}>
              <View style={styles.scannerHeader}>
                <TouchableOpacity onPress={() => setIsScanning(false)}>
                  <Text style={styles.closeScannerText}>Cancel</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.scannerTarget}>
                <View style={[styles.corner, styles.topLeft]} />
                <View style={[styles.corner, styles.topRight]} />
                <View style={[styles.corner, styles.bottomLeft]} />
                <View style={[styles.corner, styles.bottomRight]} />
              </View>
              <Text style={styles.scannerHint}>Align QR code within the frame</Text>
            </View>
          </CameraView>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text variant="headingMd">← Back</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Text variant="headingLg" style={styles.title}>Join a Pact</Text>
        <Text style={styles.subtitle}>Enter the 6-character invite code below.</Text>
        
        <TouchableOpacity 
          activeOpacity={1} 
          onPress={() => inputRef.current?.focus()}
          style={styles.inputWrapper}
        >
          {renderSegmentedInput()}
          <TextInput
            ref={inputRef}
            style={styles.hiddenInput}
            value={code}
            onChangeText={handleCodeChange}
            maxLength={CODE_LENGTH}
            autoCapitalize="characters"
            keyboardType="default"
            autoCorrect={false}
            autoComplete="off"
            autoFocus
          />
        </TouchableOpacity>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <View style={styles.dividerContainer}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>OR</Text>
          <View style={styles.dividerLine} />
        </View>

        <TouchableOpacity 
          style={styles.qrButton} 
          onPress={() => setIsScanning(true)}
        >
          <View style={styles.qrButtonInner}>
            <Text style={styles.qrEmoji}>📷</Text>
            <Text style={styles.qrText}>Scan QR Code</Text>
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Button 
          label="Join Pact" 
          onPress={handleJoin} 
          disabled={code.length < CODE_LENGTH}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surfaceBase,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: SIZES.padding,
    paddingBottom: 20,
  },
  content: {
    flex: 1,
    padding: SIZES.padding,
  },
  title: {
    marginBottom: 8,
  },
  subtitle: {
    color: COLORS.textSecondary,
    marginBottom: 32,
  },
  inputWrapper: {
    marginBottom: 16,
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    width: '100%',
    height: '100%',
  },
  segmentedContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  segmentSlot: {
    width: 48,
    height: 56,
    backgroundColor: COLORS.surfaceDark,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.05)', // Inset look
  },
  segmentSlotActive: {
    borderColor: COLORS.brandPrimary,
  },
  segmentSlotFilled: {
    backgroundColor: COLORS.surfaceBase,
    borderColor: 'transparent',
    ...SHADOWS.softElevation,
  },
  segmentText: {
    fontSize: 24,
    fontFamily: 'RobotoMono-Bold',
    color: COLORS.textDisplay,
  },
  errorText: {
    color: COLORS.danger,
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 32,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.surfaceDark,
  },
  dividerText: {
    marginHorizontal: 16,
    color: COLORS.textSecondary,
    fontWeight: 'bold',
  },
  qrButton: {
    alignSelf: 'center',
    width: '100%',
  },
  qrButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surfaceBase,
    paddingVertical: 16,
    borderRadius: SIZES.radiusButton,
    ...SHADOWS.softElevation,
  },
  qrEmoji: {
    fontSize: 20,
    marginRight: 12,
  },
  qrText: {
    fontSize: 16,
    color: COLORS.textPrimary,
    fontWeight: 'bold',
  },
  footer: {
    padding: SIZES.padding,
    paddingBottom: 40,
  },
  scannerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scannerHeader: {
    position: 'absolute',
    top: 60,
    left: 24,
  },
  closeScannerText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  scannerTarget: {
    width: 250,
    height: 250,
    backgroundColor: 'transparent',
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: COLORS.brandPrimary,
  },
  topLeft: { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4 },
  topRight: { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4 },
  bottomLeft: { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4 },
  bottomRight: { bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4 },
  scannerHint: {
    color: 'white',
    marginTop: 40,
    fontSize: 16,
  }
});
