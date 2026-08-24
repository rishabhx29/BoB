import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  onSnapshot,
  query,
  orderBy,
  limit,
  QueryConstraint,
} from 'firebase/firestore';
import ENV from './env';

/**
 * Firebase client — Real-time feed, push notifications & auth.
 * 
 * - Auth: Google OAuth + Email/Password via Firebase Auth
 * - Firestore: Real-time feed, reactions, comments, nudges, notifications
 * - FCM: Push notifications (via Expo Notifications + FCM)
 */

const firebaseConfig = {
  apiKey: ENV.FIREBASE_API_KEY,
  authDomain: ENV.FIREBASE_AUTH_DOMAIN,
  projectId: ENV.FIREBASE_PROJECT_ID,
  storageBucket: ENV.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: ENV.FIREBASE_MESSAGING_SENDER_ID,
  appId: ENV.FIREBASE_APP_ID,
  measurementId: ENV.FIREBASE_MEASUREMENT_ID,
};

// Prevent duplicate app initialization (important for hot reload)
const firebaseApp = getApps().length === 0
  ? initializeApp(firebaseConfig)
  : getApp();

export const firebaseAuth = getAuth(firebaseApp);
export const firestore = getFirestore(firebaseApp);

// ─── Firestore Collection Paths ────────────────────────────────────────────────

/**
 * Firestore collection structure:
 * 
 * /feed/{groupId}/submissions/{submissionId}  — Real-time group feed
 * /reactions/{submissionId}/users/{userId}    — Per-submission reactions
 * /comments/{submissionId}/list/{commentId}   — Per-submission comments
 * /nudges/{recipientId}/queue/{nudgeId}       — Nudge queue per user
 * /notifications/{userId}/list/{notifId}      — In-app notifications per user
 */

export const COLLECTIONS = {
  feed: (groupId: string) => `feed/${groupId}/submissions`,
  reactions: (submissionId: string) => `reactions/${submissionId}/users`,
  comments: (submissionId: string) => `comments/${submissionId}/list`,
  nudges: (recipientId: string) => `nudges/${recipientId}/queue`,
  notifications: (userId: string) => `notifications/${userId}/list`,
} as const;

// ─── Firestore Listener Helpers ──────────────────────────────────────────────

/**
 * Subscribe to real-time feed updates for a group.
 * Returns an unsubscribe function.
 */
export function subscribeToGroupFeed(
  groupId: string,
  pageSize: number = 20,
  callback: (docs: any[]) => void
) {
  const ref = collection(firestore, COLLECTIONS.feed(groupId));
  const q = query(ref, orderBy('createdAt', 'desc'), limit(pageSize));
  return onSnapshot(q, (snapshot) => {
    const docs = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    callback(docs);
  });
}

/**
 * Subscribe to reactions on a specific submission.
 * Returns an unsubscribe function.
 */
export function subscribeToReactions(
  submissionId: string,
  callback: (reactions: any[]) => void
) {
  const ref = collection(firestore, COLLECTIONS.reactions(submissionId));
  return onSnapshot(ref, (snapshot) => {
    const docs = snapshot.docs.map((d) => ({ userId: d.id, ...d.data() }));
    callback(docs);
  });
}

/**
 * Subscribe to comments on a specific submission.
 * Returns an unsubscribe function.
 */
export function subscribeToComments(
  submissionId: string,
  callback: (comments: any[]) => void
) {
  const ref = collection(firestore, COLLECTIONS.comments(submissionId));
  const q = query(ref, orderBy('createdAt', 'asc'));
  return onSnapshot(q, (snapshot) => {
    const docs = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    callback(docs);
  });
}

/**
 * Subscribe to in-app notifications for a user.
 * Returns an unsubscribe function.
 */
export function subscribeToNotifications(
  userId: string,
  callback: (notifications: any[]) => void
) {
  const ref = collection(firestore, COLLECTIONS.notifications(userId));
  const q = query(ref, orderBy('createdAt', 'desc'), limit(50));
  return onSnapshot(q, (snapshot) => {
    const docs = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    callback(docs);
  });
}

export default firebaseApp;
