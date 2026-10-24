import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, auth, User } from './firebase';
import { GoalNote, UserSettings } from '../types';
import { sanitizeGoal, sanitizeGoals } from './storage';

export type CloudSyncStatus = 'offline' | 'unauthenticated' | 'syncing' | 'synced' | 'error';

// Recursively strip any undefined values so Firestore setDoc never throws unsupported field value
export function cleanPayloadForFirestore<T>(data: T): T {
  if (data === null || data === undefined) {
    return null as unknown as T;
  }
  if (Array.isArray(data)) {
    return data
      .filter((item) => item !== undefined)
      .map((item) => cleanPayloadForFirestore(item)) as unknown as T;
  }
  if (typeof data === 'object' && data !== null) {
    const cleaned: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(data as Record<string, unknown>)) {
      if (val !== undefined) {
        cleaned[key] = cleanPayloadForFirestore(val);
      }
    }
    return cleaned as unknown as T;
  }
  return data;
}

// Save single goal to user's Firestore cloud subcollection
export async function saveGoalToCloud(user: User, goal: GoalNote): Promise<void> {
  const clean = sanitizeGoal(goal);
  if (!clean) return;

  const path = `users/${user.uid}/goals/${clean.id}`;
  try {
    const docRef = doc(db, 'users', user.uid, 'goals', clean.id);
    const rawPayload = {
      ...clean,
      userId: user.uid,
      updatedAt: new Date().toISOString(),
    };
    const payload = cleanPayloadForFirestore(rawPayload);
    await setDoc(docRef, payload, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

// Delete single goal from user's Firestore cloud subcollection
export async function deleteGoalFromCloud(user: User, goalId: string): Promise<void> {
  const path = `users/${user.uid}/goals/${goalId}`;
  try {
    const docRef = doc(db, 'users', user.uid, 'goals', goalId);
    await deleteDoc(docRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

// Bulk upload local goals to cloud (useful on first login or restore)
export async function syncLocalGoalsToCloud(user: User, localGoals: GoalNote[]): Promise<void> {
  const cleanList = sanitizeGoals(localGoals);
  for (const goal of cleanList) {
    await saveGoalToCloud(user, goal);
  }
}

// Save user settings to Firestore
export async function saveSettingsToCloud(user: User, settings: UserSettings): Promise<void> {
  const path = `users/${user.uid}/settings/user_settings`;
  try {
    const docRef = doc(db, 'users', user.uid, 'settings', 'user_settings');
    const rawPayload = {
      userId: user.uid,
      theme: settings.theme || 'dark_charcoal',
      fontFamily: settings.fontFamily || 'sans',
      fontSize: typeof settings.fontSize === 'number' ? settings.fontSize : 16,
      consistencyDailyTarget:
        typeof settings.consistencyDailyTarget === 'number' ? settings.consistencyDailyTarget : 2,
      autoSave: settings.autoSave ?? true,
      updatedAt: new Date().toISOString(),
    };
    const payload = cleanPayloadForFirestore(rawPayload);
    await setDoc(docRef, payload, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

// Subscribe to real-time cloud updates for the current user's goals
export function subscribeToCloudGoals(
  user: User,
  onUpdate: (cloudGoals: GoalNote[]) => void,
  onError?: (err: unknown) => void
): Unsubscribe {
  const path = `users/${user.uid}/goals`;
  const goalsCol = collection(db, 'users', user.uid, 'goals');

  return onSnapshot(
    goalsCol,
    (snapshot) => {
      const rawList: unknown[] = [];
      snapshot.forEach((docSnap) => {
        rawList.push(docSnap.data());
      });
      const cleaned = sanitizeGoals(rawList);
      onUpdate(cleaned);
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

// Subscribe to real-time cloud settings
export function subscribeToCloudSettings(
  user: User,
  onUpdate: (cloudSettings: UserSettings) => void,
  onError?: (err: unknown) => void
): Unsubscribe {
  const path = `users/${user.uid}/settings/user_settings`;
  const settingsDoc = doc(db, 'users', user.uid, 'settings', 'user_settings');

  return onSnapshot(
    settingsDoc,
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        onUpdate({
          theme: data.theme || 'dark_charcoal',
          fontFamily: data.fontFamily || 'sans',
          fontSize: typeof data.fontSize === 'number' ? data.fontSize : 16,
          consistencyDailyTarget:
            typeof data.consistencyDailyTarget === 'number' ? data.consistencyDailyTarget : 2,
          autoSave: data.autoSave ?? true,
        });
      }
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}
