import { 
  signInWithPopup, 
  signOut as fbSignOut, 
  onAuthStateChanged, 
  User 
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  getDocs,
  getDocFromServer,
} from 'firebase/firestore';
import { auth, googleProvider, db } from './firebase';
import { StorageService } from './storage';
import { UserProfile, WorkoutSession, NutritionEntry, BodyMeasurement, SyncStatus } from '../types';

type SyncSubscriber = (status: SyncStatus, isOnline: boolean, lastSync: number | null) => void;

class FirestoreSyncManager {
  private status: SyncStatus = 'idle';
  private isOnline: boolean = typeof navigator !== 'undefined' ? navigator.onLine : true;
  private lastSyncTimestamp: number | null = null;
  private subscribers: Set<SyncSubscriber> = new Set();
  private isInitialized = false;

  constructor() {
    this.initNetworkListeners();
  }

  private initNetworkListeners() {
    if (typeof window === 'undefined' || this.isInitialized) return;
    this.isInitialized = true;

    window.addEventListener('online', () => {
      this.isOnline = true;
      this.updateStatus(auth.currentUser ? 'syncing' : 'idle');
      this.testAndSync();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.updateStatus('offline');
    });
  }

  public subscribe(callback: SyncSubscriber): () => void {
    this.subscribers.add(callback);
    callback(this.status, this.isOnline, this.lastSyncTimestamp);
    return () => {
      this.subscribers.delete(callback);
    };
  }

  public getStatus(): SyncStatus {
    return this.status;
  }

  public getIsOnline(): boolean {
    return this.isOnline;
  }

  public getLastSync(): number | null {
    return this.lastSyncTimestamp;
  }

  private updateStatus(newStatus: SyncStatus) {
    this.status = newStatus;
    this.subscribers.forEach(cb => {
      try {
        cb(this.status, this.isOnline, this.lastSyncTimestamp);
      } catch (e) {
        console.error('Error in sync subscriber:', e);
      }
    });
  }

  // Test Firestore connectivity directly
  async testConnectivity(): Promise<boolean> {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      this.isOnline = false;
      this.updateStatus('offline');
      return false;
    }

    try {
      // Test server connectivity with timeout
      const testDocRef = doc(db, 'system', 'ping');
      await Promise.race([
        getDocFromServer(testDocRef).catch(() => null),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 4000))
      ]);
      this.isOnline = true;
      return true;
    } catch (e) {
      console.warn('Firestore server ping failed/offline:', e);
      this.isOnline = false;
      this.updateStatus('offline');
      return false;
    }
  }

  private async testAndSync() {
    if (auth.currentUser) {
      await this.triggerManualSync(auth.currentUser.uid);
    }
  }

  // Sign In with Google popup
  async signInWithGoogle(): Promise<User | null> {
    try {
      this.updateStatus('syncing');
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user) {
        await this.syncDownUserData(result.user.uid);
        this.lastSyncTimestamp = Date.now();
        this.updateStatus('synced');
        return result.user;
      }
      this.updateStatus('idle');
      return null;
    } catch (error: any) {
      console.error('Firebase Google Sign-In Error:', error);
      if (
        !navigator.onLine || 
        error?.code === 'auth/network-request-failed' ||
        error?.message?.includes('offline') ||
        error?.message?.includes('network')
      ) {
        this.isOnline = false;
        this.updateStatus('offline');
      } else {
        this.updateStatus('error');
      }
      throw error;
    }
  }

  // Sign out
  async signOut(): Promise<void> {
    try {
      await fbSignOut(auth);
      this.updateStatus('idle');
    } catch (error) {
      console.error('Firebase Sign-Out Error:', error);
    }
  }

  // Listen to auth state changes
  onAuthChange(callback: (user: User | null) => void) {
    return onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          this.updateStatus('syncing');
          await this.syncDownUserData(user.uid);
          this.lastSyncTimestamp = Date.now();
          this.updateStatus('synced');
        } catch (e) {
          console.warn('Initial sync down error:', e);
          this.updateStatus(navigator.onLine ? 'error' : 'offline');
        }
      } else {
        this.updateStatus('idle');
      }
      callback(user);
    });
  }

  // Manual Trigger to re-sync
  async triggerManualSync(userId?: string): Promise<boolean> {
    const uid = userId || auth.currentUser?.uid;
    if (!uid) {
      // Offline check without logged in user
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        this.isOnline = false;
        this.updateStatus('offline');
        return false;
      }
      this.isOnline = true;
      this.updateStatus('idle');
      return true;
    }

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      this.isOnline = false;
      this.updateStatus('offline');
      return false;
    }

    try {
      this.updateStatus('syncing');
      await this.syncUpAllLocalData(uid);
      await this.syncDownUserData(uid);
      this.isOnline = true;
      this.lastSyncTimestamp = Date.now();
      this.updateStatus('synced');
      return true;
    } catch (error) {
      console.error('Manual sync failed:', error);
      this.isOnline = false;
      this.updateStatus('offline');
      return false;
    }
  }

  // Sync profile to Firestore
  async saveProfile(profile: UserProfile, userId?: string): Promise<void> {
    const uid = userId || auth.currentUser?.uid;
    if (!uid) return;

    if (!navigator.onLine) {
      this.isOnline = false;
      this.updateStatus('offline');
      return;
    }

    try {
      const userRef = doc(db, 'users', uid);
      await setDoc(userRef, { profile, updatedAt: Date.now() }, { merge: true });
      this.lastSyncTimestamp = Date.now();
      this.updateStatus('synced');
    } catch (error: any) {
      console.error('Error saving profile to Firestore:', error);
      if (error?.message?.includes('offline') || !navigator.onLine) {
        this.isOnline = false;
        this.updateStatus('offline');
      }
    }
  }

  // Sync completed workout session
  async saveWorkout(workout: WorkoutSession, userId?: string): Promise<void> {
    const uid = userId || auth.currentUser?.uid;
    if (!uid) return;

    if (!navigator.onLine) {
      this.isOnline = false;
      this.updateStatus('offline');
      return;
    }

    try {
      const workoutRef = doc(db, 'users', uid, 'workouts', workout.id);
      await setDoc(workoutRef, { ...workout, updatedAt: Date.now() }, { merge: true });
      this.lastSyncTimestamp = Date.now();
      this.updateStatus('synced');
    } catch (error: any) {
      console.error('Error saving workout to Firestore:', error);
      if (error?.message?.includes('offline') || !navigator.onLine) {
        this.isOnline = false;
        this.updateStatus('offline');
      }
    }
  }

  // Sync nutrition log
  async saveNutritionEntry(entry: NutritionEntry, userId?: string): Promise<void> {
    const uid = userId || auth.currentUser?.uid;
    if (!uid) return;

    if (!navigator.onLine) {
      this.isOnline = false;
      this.updateStatus('offline');
      return;
    }

    try {
      const entryRef = doc(db, 'users', uid, 'nutrition', entry.id);
      await setDoc(entryRef, { ...entry, updatedAt: Date.now() }, { merge: true });
      this.lastSyncTimestamp = Date.now();
      this.updateStatus('synced');
    } catch (error: any) {
      console.error('Error saving nutrition to Firestore:', error);
      if (error?.message?.includes('offline') || !navigator.onLine) {
        this.isOnline = false;
        this.updateStatus('offline');
      }
    }
  }

  // Sync body measurement
  async saveMeasurement(measurement: BodyMeasurement, userId?: string): Promise<void> {
    const uid = userId || auth.currentUser?.uid;
    if (!uid) return;

    if (!navigator.onLine) {
      this.isOnline = false;
      this.updateStatus('offline');
      return;
    }

    try {
      const mRef = doc(db, 'users', uid, 'measurements', measurement.id);
      await setDoc(mRef, { ...measurement, updatedAt: Date.now() }, { merge: true });
      this.lastSyncTimestamp = Date.now();
      this.updateStatus('synced');
    } catch (error: any) {
      console.error('Error saving measurement to Firestore:', error);
      if (error?.message?.includes('offline') || !navigator.onLine) {
        this.isOnline = false;
        this.updateStatus('offline');
      }
    }
  }

  // Sync entire local data up to cloud
  async syncUpAllLocalData(userId: string): Promise<void> {
    try {
      const profile = StorageService.getProfile();
      await this.saveProfile(profile, userId);

      const workouts = StorageService.getWorkoutHistory();
      for (const w of workouts) {
        await this.saveWorkout(w, userId);
      }

      const nutrition = StorageService.getNutritionHistory();
      for (const n of nutrition) {
        await this.saveNutritionEntry(n, userId);
      }

      const measurements = StorageService.getMeasurements();
      for (const m of measurements) {
        await this.saveMeasurement(m, userId);
      }
    } catch (e) {
      console.error('Error syncing up local data:', e);
      throw e;
    }
  }

  // Sync cloud data down to local storage
  async syncDownUserData(userId: string): Promise<void> {
    try {
      // 1. Fetch Profile
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const cloudData = userSnap.data();
        if (cloudData.profile) {
          StorageService.saveProfile(cloudData.profile);
        }
      } else {
        // First time cloud user - push current profile up
        await this.syncUpAllLocalData(userId);
        return;
      }

      // 2. Fetch Workouts
      const workoutsRef = collection(db, 'users', userId, 'workouts');
      const workoutSnaps = await getDocs(workoutsRef);
      if (!workoutSnaps.empty) {
        const cloudWorkouts: WorkoutSession[] = [];
        workoutSnaps.forEach(snap => {
          cloudWorkouts.push(snap.data() as WorkoutSession);
        });
        if (cloudWorkouts.length > 0) {
          // Merge with local avoiding duplicates
          const localWorkouts = StorageService.getWorkoutHistory();
          const merged = [...localWorkouts];
          cloudWorkouts.forEach(cw => {
            if (!merged.some(lw => lw.id === cw.id)) {
              merged.push(cw);
            }
          });
          StorageService.saveWorkoutHistory(merged);
        }
      }

      // 3. Fetch Nutrition
      const nutritionRef = collection(db, 'users', userId, 'nutrition');
      const nutSnaps = await getDocs(nutritionRef);
      if (!nutSnaps.empty) {
        const cloudNut: NutritionEntry[] = [];
        nutSnaps.forEach(snap => {
          cloudNut.push(snap.data() as NutritionEntry);
        });
        if (cloudNut.length > 0) {
          const localNut = StorageService.getNutritionHistory();
          const merged = [...localNut];
          cloudNut.forEach(cn => {
            if (!merged.some(ln => ln.id === cn.id)) {
              merged.push(cn);
            }
          });
          StorageService.saveNutritionHistory(merged);
        }
      }

      // 4. Fetch Measurements
      const measRef = collection(db, 'users', userId, 'measurements');
      const measSnaps = await getDocs(measRef);
      if (!measSnaps.empty) {
        const cloudMeas: BodyMeasurement[] = [];
        measSnaps.forEach(snap => {
          cloudMeas.push(snap.data() as BodyMeasurement);
        });
        if (cloudMeas.length > 0) {
          const localMeas = StorageService.getMeasurements();
          const merged = [...localMeas];
          cloudMeas.forEach(cm => {
            if (!merged.some(lm => lm.id === cm.id)) {
              merged.push(cm);
            }
          });
          StorageService.saveMeasurements(merged);
        }
      }
    } catch (e) {
      console.error('Error syncing down user data:', e);
      throw e;
    }
  }
}

export const FirestoreSyncService = new FirestoreSyncManager();
