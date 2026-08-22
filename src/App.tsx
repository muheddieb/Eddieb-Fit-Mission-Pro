import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { UserProfile, WorkoutSession, Exercise, BodyMeasurement, SyncStatus } from './types';
import { StorageService, defaultProfile } from './services/storage';
import { PPLEngine } from './services/pplEngine';
import { FirestoreSyncService } from './services/firestoreSyncService';
import { Navbar } from './components/layout/Navbar';
import { Sidebar, NavSection } from './components/layout/Sidebar';
import { MobileNav } from './components/layout/MobileNav';
import { DashboardView } from './components/dashboard/DashboardView';
import { AICoachView } from './components/aicoach/AICoachView';
import { ExerciseLibraryView } from './components/library/ExerciseLibraryView';
import { HomeWorkoutsView } from './components/home/HomeWorkoutsView';
import { NutritionView } from './components/nutrition/NutritionView';
import { CardioView } from './components/cardio/CardioView';
import { CoreAbsView } from './components/core/CoreAbsView';
import { RecoveryView } from './components/recovery/RecoveryView';
import { ProgressView } from './components/progress/ProgressView';
import { AchievementsView } from './components/achievements/AchievementsView';
import { ProfileView } from './components/profile/ProfileView';
import { SettingsView } from './components/settings/SettingsView';
import { ActiveWorkoutModal } from './components/workout/ActiveWorkoutModal';
import { ExerciseDetailsModal } from './components/exercise/ExerciseDetailsModal';
import { ImageGeneratorModal } from './components/generator/ImageGeneratorModal';
import { PWAInstallModal } from './components/pwa/PWAInstallModal';
import { PWAService } from './services/pwaService';

export default function App() {
  // Global State
  const [profile, setProfile] = useState<UserProfile>(defaultProfile);
  const [currentSection, setCurrentSection] = useState<NavSection>('dashboard');
  const [activeWorkout, setActiveWorkout] = useState<WorkoutSession | null>(null);
  const [workoutHistory, setWorkoutHistory] = useState<WorkoutSession[]>([]);
  const [measurements, setMeasurements] = useState<BodyMeasurement[]>([]);

  // Firebase Auth & Sync State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [lastSyncTimestamp, setLastSyncTimestamp] = useState<number | null>(null);

  // Modals & UI Controls
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState<boolean>(false);
  const [activeWorkoutOpen, setActiveWorkoutOpen] = useState<boolean>(false);
  const [selectedExerciseModal, setSelectedExerciseModal] = useState<Exercise | null>(null);
  const [visualizerModalOpen, setVisualizerModalOpen] = useState<boolean>(false);
  const [pwaInstallModalOpen, setPwaInstallModalOpen] = useState<boolean>(false);

  // Initialize data, PWA service worker and Firebase Auth listener on mount
  useEffect(() => {
    // Initialize PWA Service Worker & Install event listeners
    PWAService.init();

    const loadedProfile = StorageService.getProfile();
    setProfile(loadedProfile);

    const loadedActiveWorkout = StorageService.getActiveWorkout();
    if (loadedActiveWorkout) {
      setActiveWorkout(loadedActiveWorkout);
    }

    const loadedHistory = StorageService.getWorkoutHistory();
    setWorkoutHistory(loadedHistory);

    const loadedMeas = StorageService.getMeasurements();
    setMeasurements(loadedMeas);

    // Subscribe to sync manager status & connectivity changes
    const unsubSync = FirestoreSyncService.subscribe((status, online, lastSync) => {
      setSyncStatus(status);
      setIsOnline(online);
      setLastSyncTimestamp(lastSync);
      setIsSyncing(status === 'syncing');
    });

    // Listen to Firebase Auth state
    const unsubscribe = FirestoreSyncService.onAuthChange((user) => {
      setCurrentUser(user);
      if (user) {
        // Refresh state from storage after sync
        setProfile(StorageService.getProfile());
        setWorkoutHistory(StorageService.getWorkoutHistory());
        setMeasurements(StorageService.getMeasurements());
      }
    });

    return () => {
      unsubscribe();
      unsubSync();
    };
  }, []);

  // Update HTML data-theme and dir on document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', profile.theme);
    document.documentElement.setAttribute('dir', profile.language === 'ar' ? 'rtl' : 'ltr');
    document.documentElement.setAttribute('lang', profile.language);
  }, [profile.theme, profile.language]);

  // Handler: Update profile
  const handleUpdateProfile = (updated: UserProfile) => {
    setProfile(updated);
    StorageService.saveProfile(updated);
    if (currentUser) {
      FirestoreSyncService.saveProfile(updated, currentUser.uid);
    }
  };

  // Handler: Start or resume daily workout
  const handleStartWorkout = () => {
    if (activeWorkout) {
      setActiveWorkoutOpen(true);
      return;
    }

    const newSession = PPLEngine.buildDailyWorkout(profile, workoutHistory);
    setActiveWorkout(newSession);
    StorageService.saveActiveWorkout(newSession);
    setActiveWorkoutOpen(true);
  };

  // Handler: Start home workout routine
  const handleStartHomeWorkout = () => {
    const homeProfile = { ...profile, preferredLocation: 'home' as const };
    const newSession = PPLEngine.buildDailyWorkout(homeProfile, workoutHistory);
    setActiveWorkout(newSession);
    StorageService.saveActiveWorkout(newSession);
    setActiveWorkoutOpen(true);
  };

  // Handler: Save in-progress workout
  const handleSaveActiveWorkout = (w: WorkoutSession) => {
    setActiveWorkout(w);
    StorageService.saveActiveWorkout(w);
  };

  // Handler: Finish workout
  const handleFinishWorkout = (w: WorkoutSession) => {
    StorageService.completeWorkout(w);
    if (currentUser) {
      FirestoreSyncService.saveWorkout(w, currentUser.uid);
    }
    setActiveWorkout(null);
    setActiveWorkoutOpen(false);
    setWorkoutHistory(StorageService.getWorkoutHistory());
  };

  // Handler: Reset App
  const handleResetApp = () => {
    setProfile(defaultProfile);
    setActiveWorkout(null);
    setActiveWorkoutOpen(false);
    setWorkoutHistory([]);
    setMeasurements([]);
    setCurrentSection('dashboard');
  };

  // Firebase Auth Handlers
  const handleSignIn = async () => {
    try {
      setIsSyncing(true);
      const user = await FirestoreSyncService.signInWithGoogle();
      if (user) {
        setCurrentUser(user);
        setProfile(StorageService.getProfile());
        setWorkoutHistory(StorageService.getWorkoutHistory());
        setMeasurements(StorageService.getMeasurements());
      }
    } catch (e) {
      console.error('Sign in failed:', e);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSignOut = async () => {
    await FirestoreSyncService.signOut();
    setCurrentUser(null);
  };

  const handleRetrySync = async () => {
    if (currentUser) {
      await FirestoreSyncService.triggerManualSync(currentUser.uid);
    } else {
      await FirestoreSyncService.testConnectivity();
    }
  };

  // Render Current Section View
  const renderCurrentView = () => {
    switch (currentSection) {
      case 'dashboard':
        return (
          <DashboardView
            profile={profile}
            history={workoutHistory}
            activeWorkout={activeWorkout}
            onStartWorkout={handleStartWorkout}
            onNavigate={(sec) => setCurrentSection(sec)}
          />
        );
      case 'aiCoach':
        return (
          <AICoachView
            profile={profile}
            history={workoutHistory}
            measurements={measurements}
          />
        );
      case 'workout':
        return (
          <DashboardView
            profile={profile}
            history={workoutHistory}
            activeWorkout={activeWorkout}
            onStartWorkout={handleStartWorkout}
            onNavigate={(sec) => setCurrentSection(sec)}
            onUpdateProfile={handleUpdateProfile}
          />
        );
      case 'exerciseLibrary':
        return (
          <ExerciseLibraryView
            profile={profile}
            onSelectExercise={(ex) => setSelectedExerciseModal(ex)}
          />
        );
      case 'home':
        return (
          <HomeWorkoutsView
            profile={profile}
            onSelectExercise={(ex) => setSelectedExerciseModal(ex)}
            onStartHomeWorkout={handleStartHomeWorkout}
          />
        );
      case 'nutrition':
      case 'preWorkout':
        return <NutritionView profile={profile} onUpdateProfile={handleUpdateProfile} />;
      case 'cardio':
        return <CardioView profile={profile} />;
      case 'core':
        return (
          <CoreAbsView
            profile={profile}
            onSelectExercise={(ex) => setSelectedExerciseModal(ex)}
          />
        );
      case 'recovery':
        return <RecoveryView profile={profile} />;
      case 'progress':
      case 'motivation':
        return (
          <ProgressView
            profile={profile}
            history={workoutHistory}
          />
        );
      case 'achievements':
        return <AchievementsView profile={profile} />;
      case 'visualizer':
        return (
          <div className="space-y-4 animate-fade-slide-up transition-all duration-300 ease-out transform">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-black text-foreground">AI Physique Visualizer (1K-4K)</h1>
              <button
                id="btn-open-full-generator"
                onClick={() => setVisualizerModalOpen(true)}
                className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow hover:bg-primary/90 transition-colors"
              >
                Open Studio Generator
              </button>
            </div>
            <p className="text-sm text-muted-foreground">
              Powered by gemini-3-pro-image-preview with 1K, 2K, and 4K ultra-high resolution synthesis.
            </p>
            {/* Embedded direct open */}
            <div className="rounded-2xl border border-border bg-card p-8 text-center space-y-3 shadow-md hover:border-primary/40 transition-colors">
              <div className="text-base font-bold text-foreground">Launch Ultra-High Definition Synthesis</div>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                Generate photo-realistic athletic physiques, Egyptian high-protein fuel plates, and biomechanical exercise anatomy diagrams in 1K, 2K, or 4K.
              </p>
              <button
                onClick={() => setVisualizerModalOpen(true)}
                className="rounded-xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-lg hover:bg-primary/90 transition-all active:scale-95"
              >
                Generate 1K/2K/4K Athletic Visuals
              </button>
            </div>
          </div>
        );
      case 'profile':
        return (
          <ProfileView
            profile={profile}
            onUpdateProfile={handleUpdateProfile}
          />
        );
      case 'settings':
        return (
          <SettingsView
            profile={profile}
            onUpdateProfile={handleUpdateProfile}
            onResetApp={handleResetApp}
            onOpenPWAInstallModal={() => setPwaInstallModalOpen(true)}
          />
        );
      default:
        return (
          <DashboardView
            profile={profile}
            history={workoutHistory}
            activeWorkout={activeWorkout}
            onStartWorkout={handleStartWorkout}
            onNavigate={(sec) => setCurrentSection(sec)}
          />
        );
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground selection:bg-primary/30">
      {/* Sticky Top Navbar */}
      <Navbar
        profile={profile}
        activeWorkout={activeWorkout}
        currentUser={currentUser}
        isSyncing={isSyncing}
        syncStatus={syncStatus}
        isOnline={isOnline}
        lastSyncTimestamp={lastSyncTimestamp}
        onRetrySync={handleRetrySync}
        onUpdateProfile={handleUpdateProfile}
        onOpenActiveWorkout={() => setActiveWorkoutOpen(true)}
        onToggleMobileDrawer={() => setMobileDrawerOpen(true)}
        onOpenVisualizer={() => setVisualizerModalOpen(true)}
        onOpenPWAInstallModal={() => setPwaInstallModalOpen(true)}
        onSignInWithGoogle={handleSignIn}
        onSignOut={handleSignOut}
      />

      {/* Main Workspace Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Desktop Collapsible Sidebar */}
        <Sidebar
          currentSection={currentSection}
          onSelectSection={(sec) => {
            if (sec === 'visualizer') {
              setVisualizerModalOpen(true);
            }
            setCurrentSection(sec);
          }}
          profile={profile}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          onOpenPWAInstallModal={() => setPwaInstallModalOpen(true)}
        />

        {/* Scrollable Main Content View */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 custom-scrollbar mb-16 md:mb-0">
          <div className="mx-auto max-w-7xl">
            {renderCurrentView()}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation & Drawer */}
      <MobileNav
        currentSection={currentSection}
        onSelectSection={(sec) => {
          if (sec === 'visualizer') {
            setVisualizerModalOpen(true);
          }
          setCurrentSection(sec);
        }}
        profile={profile}
        drawerOpen={mobileDrawerOpen}
        onCloseDrawer={() => setMobileDrawerOpen(false)}
        onOpenDrawer={() => setMobileDrawerOpen(true)}
        onOpenPWAInstallModal={() => setPwaInstallModalOpen(true)}
      />

      {/* Active Workout Session Modal (if active) */}
      {activeWorkoutOpen && activeWorkout && (
        <ActiveWorkoutModal
          workout={activeWorkout}
          profile={profile}
          onSaveWorkout={handleSaveActiveWorkout}
          onFinishWorkout={handleFinishWorkout}
          onClose={() => setActiveWorkoutOpen(false)}
          onOpenExerciseDetails={(ex) => setSelectedExerciseModal(ex)}
        />
      )}

      {/* Exercise Details & Video Modal */}
      {selectedExerciseModal && (
        <ExerciseDetailsModal
          exercise={selectedExerciseModal}
          profile={profile}
          onClose={() => setSelectedExerciseModal(null)}
          onSelectAlternative={(altId) => {
            const alt = PPLEngine.getExerciseById(altId);
            if (alt) setSelectedExerciseModal(alt);
          }}
        />
      )}

      {/* AI Visualizer High-Res Image Generator Modal */}
      {visualizerModalOpen && (
        <ImageGeneratorModal
          profile={profile}
          onClose={() => setVisualizerModalOpen(false)}
        />
      )}

      {/* PWA Progressive Web App Install & Offline Guide Modal */}
      <PWAInstallModal
        isOpen={pwaInstallModalOpen}
        onClose={() => setPwaInstallModalOpen(false)}
        profile={profile}
      />
    </div>
  );
}
