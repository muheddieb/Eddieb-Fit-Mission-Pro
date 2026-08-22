import { 
  AppState, 
  UserProfile, 
  WorkoutSession, 
  CardioSession, 
  CoreSession, 
  RecoverySession, 
  NutritionEntry, 
  HydrationEntry, 
  BodyMeasurement, 
  Achievement, 
  AIChatMessage, 
  GeneratedImageRecord 
} from '../types';
import { exerciseSeedData } from '../data/exerciseSeed';

const STORAGE_KEYS = {
  PROFILE: 'eddieb_athlete_profile_v1',
  ACTIVE_WORKOUT: 'eddieb_active_workout_v1',
  WORKOUT_HISTORY: 'eddieb_workout_history_v1',
  CARDIO_HISTORY: 'eddieb_cardio_history_v1',
  CORE_HISTORY: 'eddieb_core_history_v1',
  RECOVERY_HISTORY: 'eddieb_recovery_history_v1',
  NUTRITION_HISTORY: 'eddieb_nutrition_history_v1',
  HYDRATION_HISTORY: 'eddieb_hydration_history_v1',
  MEASUREMENTS: 'eddieb_measurements_v1',
  ACHIEVEMENTS: 'eddieb_achievements_v1',
  CHAT_HISTORY: 'eddieb_ai_chat_v1',
  SAVED_IMAGES: 'eddieb_saved_images_v1',
};

export const defaultProfile: UserProfile = {
  name: 'Eddie B Athlete',
  age: 28,
  heightCm: 178,
  currentWeightKg: 82.5,
  goalWeightKg: 78.0,
  trainingDaysPerWeek: 4,
  level: 'intermediate',
  preferredLocation: 'gym',
  availableEquipment: ['Barbell', 'Dumbbells', 'Cables', 'Machines', 'Bodyweight'],
  mode: 'muscle_recomp',
  activityLevel: 'moderate',
  currentWaistCm: 88,
  startDate: new Date(Date.now() - 14 * 86400000).toISOString().split('T')[0], // 2 weeks ago
  dailyCalorieTarget: 2250,
  dailyProteinTargetGrams: 165,
  dailyWaterTargetMl: 3500,
  notes: 'Focus on chest thickness, progressive overload on bench and squat, maintaining strict waist trend.',
  theme: 'elegant_dark',
  language: 'en',
  unitSystem: 'kg',
  screenWakeDuration: 'never',
  cardioMotivationFrequency: '1m',
  autoGpsTracking: true,
  units: 'km',
};

export const initialAchievements: Achievement[] = [
  {
    id: 'first_workout',
    title: 'First Iron Step',
    titleAr: 'الخطوة الأولى في الحديد',
    description: 'Log and complete your first training mission.',
    descriptionAr: 'تسجيل وإكمال أول تمرينة في البرنامج.',
    icon: 'Flame',
    unlocked: false,
    progress: 0,
    maxProgress: 1,
    category: 'workouts',
  },
  {
    id: 'streak_7',
    title: '7-Day Unbroken Discipline',
    titleAr: '7 أيام من الانضباط المتواصل',
    description: 'Maintain an active 7-day consistency streak.',
    descriptionAr: 'الحفاظ على 7 أيام متتالية من الالتزام الرياضي.',
    icon: 'Zap',
    unlocked: false,
    progress: 0,
    maxProgress: 7,
    category: 'streak',
  },
  {
    id: 'workouts_10',
    title: 'Warrior Decade',
    titleAr: 'عشرية المحارب',
    description: 'Complete 10 full workout sessions.',
    descriptionAr: 'إكمال 10 تمارين كاملة.',
    icon: 'ShieldCheck',
    unlocked: false,
    progress: 0,
    maxProgress: 10,
    category: 'workouts',
  },
  {
    id: 'workouts_25',
    title: 'Quarter-Century Veteran',
    titleAr: 'المحارب الفضي (25 تمرينة)',
    description: 'Log 25 completed workout sessions.',
    descriptionAr: 'إكمال 25 تمرينة في سجلك.',
    icon: 'Trophy',
    unlocked: false,
    progress: 0,
    maxProgress: 25,
    category: 'workouts',
  },
  {
    id: 'rpe_master',
    title: 'RPE Precision Master',
    titleAr: 'سيد دقة قياس الجهد RPE',
    description: 'Log RPE values on 20 distinct sets without skipping.',
    descriptionAr: 'تسجيل مقياس الجهد RPE لـ 20 مجموعة بدقة.',
    icon: 'Target',
    unlocked: false,
    progress: 0,
    maxProgress: 20,
    category: 'strength',
  },
  {
    id: 'core_titan',
    title: 'Iron Core Fortress',
    titleAr: 'قلعة الكور الحديدية',
    description: 'Complete 5 dedicated core and abs sessions.',
    descriptionAr: 'إكمال 5 جلسات مخصصة لعضلات البطن والكور.',
    icon: 'Layers',
    unlocked: false,
    progress: 0,
    maxProgress: 5,
    category: 'core',
  },
  {
    id: 'cardio_consistency',
    title: 'Cardio Engine Ignition',
    titleAr: 'محرك الكارديو وحرق الدهون',
    description: 'Accumulate 100 minutes of steady-state cardio.',
    descriptionAr: 'تسجيل 100 دقيقة من الكارديو منخفض الشدة.',
    icon: 'HeartPulse',
    unlocked: false,
    progress: 0,
    maxProgress: 100,
    category: 'cardio',
  },
  {
    id: 'hydration_hero',
    title: 'Hydration Excellence',
    titleAr: 'بطل الترطيب اليومي',
    description: 'Hit your daily water target 5 times.',
    descriptionAr: 'تحقيق هدف شرب المياه اليومي 5 مرات.',
    icon: 'Droplets',
    unlocked: false,
    progress: 0,
    maxProgress: 5,
    category: 'hydration',
  },
];

// Seed initial history if first run so dashboard & charts have realistic context
function getInitialMeasurements(startDate: string, currentWeight: number, currentWaist: number): BodyMeasurement[] {
  const dates = [
    new Date(Date.now() - 14 * 86400000).toISOString().split('T')[0],
    new Date(Date.now() - 10 * 86400000).toISOString().split('T')[0],
    new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0],
    new Date(Date.now() - 3 * 86400000).toISOString().split('T')[0],
    new Date().toISOString().split('T')[0],
  ];

  return [
    { id: 'm1', date: dates[0], weight: currentWeight + 1.2, waistCm: currentWaist + 1.5, notes: 'Baseline start' },
    { id: 'm2', date: dates[1], weight: currentWeight + 0.8, waistCm: currentWaist + 1.0 },
    { id: 'm3', date: dates[2], weight: currentWeight + 0.5, waistCm: currentWaist + 0.7, notes: 'End of week 1' },
    { id: 'm4', date: dates[3], weight: currentWeight + 0.1, waistCm: currentWaist + 0.3 },
    { id: 'm5', date: dates[4], weight: currentWeight, waistCm: currentWaist, notes: 'Latest check-in' },
  ];
}

export const StorageService = {
  getProfile(): UserProfile {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.PROFILE);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error('Error loading profile:', e);
    }
    this.saveProfile(defaultProfile);
    return defaultProfile;
  },

  saveProfile(profile: UserProfile): void {
    try {
      localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
    } catch (e) {
      console.error('Error saving profile:', e);
    }
  },

  getActiveWorkout(): WorkoutSession | null {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.ACTIVE_WORKOUT);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error('Error reading active workout:', e);
    }
    return null;
  },

  saveActiveWorkout(workout: WorkoutSession | null): void {
    try {
      if (workout === null) {
        localStorage.removeItem(STORAGE_KEYS.ACTIVE_WORKOUT);
      } else {
        localStorage.setItem(STORAGE_KEYS.ACTIVE_WORKOUT, JSON.stringify(workout));
      }
    } catch (e) {
      console.error('Error saving active workout:', e);
    }
  },

  getWorkoutHistory(): WorkoutSession[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.WORKOUT_HISTORY);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error('Error loading workout history:', e);
    }
    return [];
  },

  saveWorkoutHistory(history: WorkoutSession[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.WORKOUT_HISTORY, JSON.stringify(history));
    } catch (e) {
      console.error('Error saving workout history:', e);
    }
  },

  completeWorkout(workout: WorkoutSession): void {
    const history = this.getWorkoutHistory();
    workout.completed = true;
    workout.completedAt = Date.now();
    history.unshift(workout);
    this.saveWorkoutHistory(history);
    this.saveActiveWorkout(null);
    this.checkAndUpdateAchievements();
  },

  getCardioHistory(): CardioSession[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.CARDIO_HISTORY);
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return [];
  },

  addCardioSession(session: CardioSession): void {
    const list = this.getCardioHistory();
    list.unshift(session);
    localStorage.setItem(STORAGE_KEYS.CARDIO_HISTORY, JSON.stringify(list));
    this.checkAndUpdateAchievements();
  },

  getCoreHistory(): CoreSession[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.CORE_HISTORY);
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return [];
  },

  addCoreSession(session: CoreSession): void {
    const list = this.getCoreHistory();
    list.unshift(session);
    localStorage.setItem(STORAGE_KEYS.CORE_HISTORY, JSON.stringify(list));
    this.checkAndUpdateAchievements();
  },

  getRecoveryHistory(): RecoverySession[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.RECOVERY_HISTORY);
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return [];
  },

  addRecoverySession(session: RecoverySession): void {
    const list = this.getRecoveryHistory();
    list.unshift(session);
    localStorage.setItem(STORAGE_KEYS.RECOVERY_HISTORY, JSON.stringify(list));
  },

  getNutritionHistory(): NutritionEntry[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.NUTRITION_HISTORY);
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return [];
  },

  addNutritionEntry(entry: NutritionEntry): void {
    const list = this.getNutritionHistory();
    list.unshift(entry);
    localStorage.setItem(STORAGE_KEYS.NUTRITION_HISTORY, JSON.stringify(list));
  },

  deleteNutritionEntry(id: string): void {
    const list = this.getNutritionHistory().filter(e => e.id !== id);
    localStorage.setItem(STORAGE_KEYS.NUTRITION_HISTORY, JSON.stringify(list));
  },

  getHydrationHistory(): HydrationEntry[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.HYDRATION_HISTORY);
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return [];
  },

  addHydration(amountMl: number): void {
    const today = new Date().toISOString().split('T')[0];
    const list = this.getHydrationHistory();
    list.unshift({
      id: 'h_' + Date.now(),
      date: today,
      amountMl,
      timestamp: Date.now(),
    });
    localStorage.setItem(STORAGE_KEYS.HYDRATION_HISTORY, JSON.stringify(list));
    this.checkAndUpdateAchievements();
  },

  getTodayHydrationTotal(): number {
    const today = new Date().toISOString().split('T')[0];
    return this.getHydrationHistory()
      .filter(h => h.date === today)
      .reduce((sum, item) => sum + item.amountMl, 0);
  },

  getMeasurements(): BodyMeasurement[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.MEASUREMENTS);
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    const profile = this.getProfile();
    const seeds = getInitialMeasurements(profile.startDate, profile.currentWeightKg, profile.currentWaistCm);
    this.saveMeasurements(seeds);
    return seeds;
  },

  saveMeasurements(list: BodyMeasurement[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.MEASUREMENTS, JSON.stringify(list));
    } catch (e) {}
  },

  addMeasurement(measurement: BodyMeasurement): void {
    const list = this.getMeasurements();
    list.unshift(measurement);
    this.saveMeasurements(list);

    // Update current profile stats
    const profile = this.getProfile();
    profile.currentWeightKg = measurement.weight;
    if (measurement.waistCm) profile.currentWaistCm = measurement.waistCm;
    this.saveProfile(profile);
  },

  getAchievements(): Achievement[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.ACHIEVEMENTS);
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return initialAchievements;
  },

  saveAchievements(list: Achievement[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.ACHIEVEMENTS, JSON.stringify(list));
    } catch (e) {}
  },

  checkAndUpdateAchievements(): Achievement[] {
    const achievements = this.getAchievements();
    const workouts = this.getWorkoutHistory();
    const cardio = this.getCardioHistory();
    const core = this.getCoreHistory();
    const hydration = this.getHydrationHistory();

    const workoutCount = workouts.filter(w => w.completed).length;
    const cardioMinutes = cardio.reduce((sum, c) => sum + c.durationMinutes, 0);
    const coreCount = core.length;

    // Count sets with RPE logged
    let rpeSetsCount = 0;
    workouts.forEach(w => {
      w.exercises.forEach(e => {
        e.sets.forEach(s => {
          if (s.rpe > 0) rpeSetsCount++;
        });
      });
    });

    const now = new Date().toISOString().split('T')[0];

    achievements.forEach(ach => {
      if (ach.id === 'first_workout') {
        ach.progress = workoutCount >= 1 ? 1 : 0;
      } else if (ach.id === 'workouts_10') {
        ach.progress = Math.min(workoutCount, 10);
      } else if (ach.id === 'workouts_25') {
        ach.progress = Math.min(workoutCount, 25);
      } else if (ach.id === 'streak_7') {
        ach.progress = Math.min(workoutCount, 7); // simplified streak representation
      } else if (ach.id === 'rpe_master') {
        ach.progress = Math.min(rpeSetsCount, 20);
      } else if (ach.id === 'core_titan') {
        ach.progress = Math.min(coreCount, 5);
      } else if (ach.id === 'cardio_consistency') {
        ach.progress = Math.min(cardioMinutes, 100);
      } else if (ach.id === 'hydration_hero') {
        ach.progress = Math.min(hydration.length > 0 ? 5 : 0, 5);
      }

      if (!ach.unlocked && ach.progress >= ach.maxProgress) {
        ach.unlocked = true;
        ach.unlockedAt = now;
      }
    });

    this.saveAchievements(achievements);
    return achievements;
  },

  getChatHistory(): AIChatMessage[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.CHAT_HISTORY);
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return [];
  },

  saveChatHistory(history: AIChatMessage[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.CHAT_HISTORY, JSON.stringify(history));
    } catch (e) {}
  },

  addChatMessage(msg: AIChatMessage): void {
    const list = this.getChatHistory();
    list.push(msg);
    this.saveChatHistory(list);
  },

  clearChatHistory(): void {
    localStorage.removeItem(STORAGE_KEYS.CHAT_HISTORY);
  },

  getSavedImages(): GeneratedImageRecord[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.SAVED_IMAGES);
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return [];
  },

  saveGeneratedImage(record: GeneratedImageRecord): void {
    const list = this.getSavedImages();
    list.unshift(record);
    localStorage.setItem(STORAGE_KEYS.SAVED_IMAGES, JSON.stringify(list));
  },

  exportAllDataAsJSON(): string {
    const data = {
      profile: this.getProfile(),
      workouts: this.getWorkoutHistory(),
      cardio: this.getCardioHistory(),
      core: this.getCoreHistory(),
      recovery: this.getRecoveryHistory(),
      nutrition: this.getNutritionHistory(),
      hydration: this.getHydrationHistory(),
      measurements: this.getMeasurements(),
      achievements: this.getAchievements(),
      savedImagesCount: this.getSavedImages().length,
      exportDate: new Date().toISOString(),
      appVersion: '1.0.0',
    };
    return JSON.stringify(data, null, 2);
  },

  exportWorkoutsAsCSV(): string {
    const workouts = this.getWorkoutHistory();
    let csv = 'Workout Date,Workout Name,Mode,Duration (min),Exercise,Set Number,Weight (kg),Reps,RPE,Completed\n';

    workouts.forEach(w => {
      w.exercises.forEach(e => {
        e.sets.forEach(s => {
          csv += `"${w.date}","${w.name}","${w.mode}",${w.durationMinutes},"${e.exerciseName}",${s.setNumber},${s.actualWeight || s.targetWeight},${s.actualReps || s.targetReps},${s.rpe},${s.completed}\n`;
        });
      });
    });

    return csv;
  },

  resetAllData(): void {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  },
};
