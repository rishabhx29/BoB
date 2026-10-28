import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * A safe wrapper around storage that uses SecureStore on native platforms
 * and AsyncStorage on the web, since SecureStore is not supported on web.
 *
 * SecureStore enforces a per-value size limit (2 KB on Android). Supabase
 * auth sessions routinely exceed it, so native values are split into
 * fixed-size chunks:
 *
 *   <key>.chunks   → number of chunks (decimal string)
 *   <key>.chunk.N  → chunk N
 *   <key>          → legacy, unchunked value (read for backwards compat)
 *
 * Small values still use one chunk, keeping the read/write path uniform.
 */

const CHUNK_SIZE = 1800;
const COUNT_SUFFIX = '.chunks';
const CHUNK_PREFIX = '.chunk.';

function chunkKey(key: string, index: number): string {
  return `${key}${CHUNK_PREFIX}${index}`;
}

async function secureGetItem(key: string): Promise<string | null> {
  const countRaw = await SecureStore.getItemAsync(`${key}${COUNT_SUFFIX}`);
  const count = countRaw ? Number.parseInt(countRaw, 10) : 0;

  if (Number.isFinite(count) && count > 0) {
    const parts: string[] = [];
    for (let i = 0; i < count; i += 1) {
      const part = await SecureStore.getItemAsync(chunkKey(key, i));
      if (part == null) {
        // A manifest without its chunks is corrupt; treat it as missing so
        // Supabase clears the session and asks the user to sign in again.
        return null;
      }
      parts.push(part);
    }
    return parts.join('');
  }

  // Value written by an older build (before chunking).
  return SecureStore.getItemAsync(key);
}

async function secureSetItem(key: string, value: string): Promise<void> {
  const previousRaw = await SecureStore.getItemAsync(`${key}${COUNT_SUFFIX}`);
  const previousCount = previousRaw ? Number.parseInt(previousRaw, 10) : 0;
  const chunkCount = Math.max(1, Math.ceil(value.length / CHUNK_SIZE));

  for (let i = 0; i < chunkCount; i += 1) {
    await SecureStore.setItemAsync(
      chunkKey(key, i),
      value.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE)
    );
  }

  // The manifest is written last so a partially written value is never read.
  await SecureStore.setItemAsync(`${key}${COUNT_SUFFIX}`, String(chunkCount));

  // Drop chunks left over from a previous, larger value.
  for (let i = chunkCount; i < previousCount; i += 1) {
    await SecureStore.deleteItemAsync(chunkKey(key, i)).catch(() => undefined);
  }

  // Remove the legacy unchunked value so reads cannot fall back to stale data.
  await SecureStore.deleteItemAsync(key).catch(() => undefined);
}

async function secureRemoveItem(key: string): Promise<void> {
  const countRaw = await SecureStore.getItemAsync(`${key}${COUNT_SUFFIX}`).catch(
    () => null
  );
  const count = countRaw ? Number.parseInt(countRaw, 10) : 0;

  if (Number.isFinite(count) && count > 0) {
    for (let i = 0; i < count; i += 1) {
      await SecureStore.deleteItemAsync(chunkKey(key, i)).catch(() => undefined);
    }
  }

  await SecureStore.deleteItemAsync(`${key}${COUNT_SUFFIX}`).catch(() => undefined);
  await SecureStore.deleteItemAsync(key).catch(() => undefined);
}

export const storage = {
  async setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      await AsyncStorage.setItem(key, value);
    } else {
      await secureSetItem(key, value);
    }
  },

  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      return AsyncStorage.getItem(key);
    }
    return secureGetItem(key);
  },

  async removeItem(key: string): Promise<void> {
    if (Platform.OS === 'web') {
      await AsyncStorage.removeItem(key);
    } else {
      await secureRemoveItem(key);
    }
  },
};
