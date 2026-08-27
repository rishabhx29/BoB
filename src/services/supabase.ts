import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ENV from './env';

/**
 * Supabase client — Primary database & storage.
 * 
 * - Handles relational data: users, groups, activities, submissions, streaks, badges
 * - Handles file storage: submission photos (bucket: 'submission-photos')
 * - Row-Level Security (RLS) policies enforce data access rules server-side
 */
const supabaseUrl = ENV.SUPABASE_URL || '';
const supabaseAnonKey = ENV.SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // Mobile app — no URL-based OAuth
  },
  db: {
    schema: 'public',
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// ─── Storage Helpers ──────────────────────────────────────────────────────────

export const SUBMISSION_PHOTOS_BUCKET = 'submission-photos';

/**
 * Upload a submission photo and return its public URL.
 */
export async function uploadSubmissionPhoto(
  userId: string,
  activityId: string,
  uri: string,
  mimeType: string = 'image/jpeg'
): Promise<string | null> {
  const ext = mimeType === 'image/png' ? 'png' : 'jpg';
  const path = `${userId}/${activityId}/${Date.now()}.${ext}`;

  const { data, error } = await supabase.storage
    .from(SUBMISSION_PHOTOS_BUCKET)
    .upload(path, {
      uri,
      type: mimeType,
      name: `submission.${ext}`,
    } as any, {
      contentType: mimeType,
      upsert: false,
    });

  if (error) {
    console.error('[Supabase Storage] Upload failed:', error);
    return null;
  }

  const { data: urlData } = supabase.storage
    .from(SUBMISSION_PHOTOS_BUCKET)
    .getPublicUrl(data.path);

  return urlData.publicUrl;
}

export default supabase;
