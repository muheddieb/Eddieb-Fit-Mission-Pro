export type TrainingMode = 'muscle_recomp' | 'controlled_fat_loss';

export type TrainingLocation = 'gym' | 'home' | 'both';

export type FitnessLevel = 'beginner' | 'intermediate' | 'advanced';

export type AppTheme = 
  | 'fitness_dark' 
  | 'volcanic_red' 
  | 'electric_cyan' 
  | 'cyber_lime' 
  | 'spartan_gold' 
  | 'solar_orange' 
  | 'royal_violet' 
  | 'arctic_frost' 
  | 'warm_amber' 
  | 'elegant_dark' 
  | 'dark' 
  | 'light';

export type AppLanguage = 'en' | 'ar';

export type ExerciseCategory = 
  | 'push' 
  | 'pull' 
  | 'legs' 
  | 'core' 
  | 'cardio' 
  | 'recovery' 
  | 'home';

export type MovementPattern = 
  | 'horizontal_press' 
  | 'incline_press' 
  | 'overhead_press' 
  | 'horizontal_row' 
  | 'vertical_pull' 
  | 'squat' 
  | 'hinge' 
  | 'lunge' 
  | 'isolation_chest' 
  | 'isolation_shoulder' 
  | 'isolation_triceps' 
  | 'isolation_biceps' 
  | 'isolation_quad' 
  | 'isolation_hamstring' 
  | 'isolation_calves' 
  | 'anti_extension' 
  | 'anti_rotation' 
  | 'anti_lateral_flexion' 
  | 'flexion' 
  | 'trunk_stability' 
  | 'cardio_aerobic' 
  | 'mobility_stretch';

export interface Exercise {
  id: string;
  name: string;
  nameAr: string;
  category: ExerciseCategory;
  movementPattern: MovementPattern;
  primaryMuscle: string;
  primaryMuscleAr?: string;
  secondaryMuscles: string[];
  secondaryMusclesAr?: string[];
  equipment: string;
  equipmentAr?: string;
  location: TrainingLocation;
  difficulty: FitnessLevel;
  level: string;
  exerciseType: 'compound' | 'isolation' | 'isometric' | 'cardio' | 'mobility';
  description?: string;
  descriptionAr?: string;
  instructions: string[];
  instructionsAr: string[];
  benefits: string[];
  benefitsAr: string[];
  commonMistakes: string[];
  commonMistakesAr: string[];
  breathing: string;
  breathingAr: string;
  targetSets: number;
  targetRepRange: string;
  restSeconds: number;
  rpeTarget: number;
  imageUrl?: string;
  youtubeSearchQuery: string;
  youtubeVideoId?: string;
  youtubeVideoUrl?: string;
  videoStatus?: 'verified' | 'search_ready' | 'fallback';
  alternatives: string[]; // Exercise IDs
  tags: string[];
}

export interface SetLog {
  id: string;
  setNumber: number;
  targetReps: string | number;
  actualReps: number;
  targetWeight: number;
  actualWeight: number;
  rpe: number; // 1 to 10
  completed: boolean;
  notes?: string;
  timestamp?: number;
  isPR?: boolean;
  prType?: 'weight' | 'volume';
}

export interface PersonalRecordEvent {
  exerciseId: string;
  exerciseName: string;
  exerciseNameAr?: string;
  prType: 'weight' | 'volume';
  newValue: number;
  previousValue: number;
  unit: string;
  reps: number;
  diff: number;
  setNumber: number;
}

export interface WorkoutExercise {
  exerciseId: string;
  exerciseName: string;
  exerciseNameAr?: string;
  primaryMuscle: string;
  sets: SetLog[];
  restSeconds: number;
  targetRpe: number;
  notes?: string;
  completed: boolean;
  isSubstituted?: boolean;
  originalExerciseId?: string;
  originalExerciseName?: string;
  originalExerciseNameAr?: string;
  substitutionReason?: string;
}

export interface WorkoutSubstitutionRecord {
  id: string;
  timestamp: number;
  date: string;
  type: 'exercise_swap' | 'day_swap' | 'custom_split';
  originalItem: string;
  originalItemAr: string;
  newItem: string;
  newItemAr: string;
  reason: string;
  reasonAr: string;
  targetMuscleGroup?: string;
  fatigueLevelReported?: string;
  sessionId?: string;
  originalId?: string;
  originalName?: string;
  substitutedId?: string;
  substitutedName?: string;
}

export interface WorkoutSession {
  id: string;
  date: string; // YYYY-MM-DD
  name: string;
  nameAr: string;
  type: ExerciseCategory | 'push' | 'pull' | 'legs' | 'full_body' | 'rest_active' | 'shoulders_arms' | 'upper' | 'lower';
  mode: TrainingMode;
  durationMinutes: number;
  exercises: WorkoutExercise[];
  totalVolumeKg?: number;
  notes?: string;
  rating?: number; // 1-5
  energyLevel?: number; // 1-5
  completed: boolean;
  startedAt?: number;
  completedAt?: number;
  timestamp?: number;
  isSubstituted?: boolean;
  originalType?: string;
  originalName?: string;
  originalNameAr?: string;
  substitutionReason?: string;
  telemetrySummary?: {
    avgHeartRateBpm?: number;
    maxHeartRateBpm?: number;
    caloriesBurned?: number;
    avgHrvRmssd?: number;
    primaryZone?: HeartRateZone;
    deviceName?: string;
  };
}

export type CardioModality = 
  | 'treadmill_incline' 
  | 'treadmill_walk' 
  | 'treadmill_run' 
  | 'stationary_bike' 
  | 'outdoor_walk' 
  | 'outdoor_run' 
  | 'elliptical';

export interface CardioSession {
  id: string;
  date: string;
  type: CardioModality;
  modality?: CardioModality;
  modalityName?: string;
  modalityNameAr?: string;
  durationMinutes: number;
  inclinePercentage?: number;
  speedKmh?: number;
  distanceKm?: number;
  caloriesBurned?: number;
  calories?: number;
  avgHeartRate?: number;
  intensity: 'zone2_fat_loss' | 'low' | 'moderate' | 'high';
  notes?: string;
  timestamp?: number;
}

export interface CoreExercise {
  id: string;
  name: string;
  nameAr?: string;
  description: string;
  descriptionAr?: string;
  primaryPattern: string;
  equipment: string;
  targetRepRange: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  videoDemonstrationUrl?: string;
  targetMuscles?: string[];
}

export interface CoreSession {
  id: string;
  date: string;
  name?: string;
  routineName?: string;
  routineNameAr?: string;
  exercises?: any[];
  exercisesCount?: number;
  setsCompleted?: number;
  completed?: boolean;
  durationMinutes: number;
  rpe?: number;
  notes?: string;
  timestamp?: number;
}

export type RecoveryType = 
  | 'sauna' 
  | 'steam' 
  | 'jacuzzi' 
  | 'stretching' 
  | 'mobility' 
  | 'sleep' 
  | 'rest_day';

export interface RecoverySession {
  id: string;
  date: string;
  type: RecoveryType | string;
  typeName?: string;
  typeNameAr?: string;
  durationMinutes: number;
  recoveryRating?: number; // 1-5
  notes?: string;
  timestamp?: number;
}

export interface SleepLog {
  id: string;
  date: string; // Wake up date 'YYYY-MM-DD'
  bedTime: string; // "23:00"
  wakeTime: string; // "07:30"
  durationHours: number; // e.g. 7.5
  qualityScore: number; // 1 to 100
  deepSleepMinutes?: number;
  remSleepMinutes?: number;
  lightSleepMinutes?: number;
  awakeMinutes?: number;
  restingHeartRateBpm?: number;
  hrvRmssdMs?: number;
  perceivedRecovery: 1 | 2 | 3 | 4 | 5; // 1=Exhausted, 2=Sluggish, 3=Normal, 4=Energized, 5=Peak / PR Ready
  factors?: string[]; // e.g. 'dark_cool_room', 'no_screens_60m', 'magnesium', 'no_caffeine_late', 'late_heavy_meal', 'stress'
  factorsAr?: string[];
  notes?: string;
  source?: 'manual' | 'galaxy_watch' | 'apple_health' | 'fitbit' | 'garmin';
  timestamp: number;
}

export interface SleepWorkoutCorrelationPoint {
  date: string;
  displayDate: string;
  displayDateAr: string;
  sleepDurationHours: number;
  sleepQualityScore: number;
  perceivedRecovery: number;
  deepSleepMinutes?: number;
  remSleepMinutes?: number;
  restingHeartRateBpm?: number;
  hrvRmssdMs?: number;
  hasWorkout: boolean;
  workoutName?: string;
  workoutNameAr?: string;
  workoutType?: string;
  workoutVolumeKg?: number;
  workoutVolumeTons?: number;
  avgWorkoutRpe?: number;
  workoutDurationMin?: number;
  completedSets?: number;
  performanceScore?: number; // 0 to 100 composite index
  sleepDeficit: boolean; // duration < 6.5h or score < 70
  notes?: string;
}

export interface SleepCorrelationSummary {
  avgSleepDurationHours: number;
  avgQualityScore: number;
  avgRestingHeartRate: number;
  avgHrv: number;
  volumeBoostOnOptimalSleepPercent: number; // e.g. +17.5% volume when sleep >= 7.5h
  rpeFatigueDiffOnShortSleep: number; // e.g. +1.1 higher RPE when sleep < 6.5h
  optimalSleepRange: string;
  optimalSleepRangeAr: string;
  highSleepVolumeAvgKg: number;
  lowSleepVolumeAvgKg: number;
  correlationStrength: 'strong' | 'moderate' | 'mild';
  correlationStrengthAr: string;
  bioInsights: {
    title: string;
    titleAr: string;
    desc: string;
    descAr: string;
    impact: 'positive' | 'warning' | 'info';
  }[];
}

export interface NutritionEntry {
  id: string;
  date: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'pre_workout' | 'post_workout';
  foodName: string;
  foodNameAr?: string;
  portion?: string;
  portionGrams?: number;
  calories: number;
  protein?: number;
  proteinGrams: number;
  carbs?: number;
  carbsGrams?: number;
  fat?: number;
  fatGrams?: number;
  notes?: string;
  timestamp?: number;
}

export interface FoodItemSeed {
  id: string;
  name: string;
  nameAr: string;
  category: 'egyptian' | 'protein' | 'carbs' | 'fats' | 'pre_post_workout' | 'fruits_veggies';
  portionUnit: string;
  portionUnitAr: string;
  defaultPortion: number;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  description?: string;
  descriptionAr?: string;
}

export interface HydrationEntry {
  id: string;
  date: string;
  amountMl: number;
  timestamp: number;
}

export interface BodyMeasurement {
  id: string;
  date: string;
  weight: number; // kg
  waistCm?: number;
  chestCm?: number;
  armCm?: number;
  thighCm?: number;
  notes?: string;
}

export type ScreenWakeDuration = '1m' | '2m' | '5m' | '10m' | '30m' | 'never';
export type CardioMotivationFrequency = '1m' | '2m' | 'off';
export type RestSoundType = 'beep' | 'whistle' | 'chime' | 'buzzer' | 'bell';

export interface BodyCompositionScan {
  scanDate: string;
  weightKg: number;
  goalWeightKg: number;
  bmi: number;
  bodyFatPercent: number;
  bodyFatKg: number;
  skeletalMuscleKg: number;
  muscleWeightKg: number;
  visceralFat: number;
  waterPercent: number;
  waterKg: number;
  proteinPercent: number;
  proteinKg: number;
  boneMassKg: number;
  bmrKcal: number;
  bodyAge: number;
  actualAge: number;
  heightCm: number;
  weightWithoutFatKg: number;
  obesityDegreePercent: number;
}

export interface UserProfile {
  name: string;
  age: number;
  heightCm: number;
  currentWeightKg: number;
  goalWeightKg: number;
  trainingDaysPerWeek: number; // 3 to 6
  level: FitnessLevel;
  preferredLocation: TrainingLocation;
  availableEquipment: string[];
  mode: TrainingMode;
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'very_active';
  currentWaistCm: number;
  startDate: string; // YYYY-MM-DD
  dailyCalorieTarget: number;
  dailyProteinTargetGrams: number;
  dailyCarbsTargetGrams?: number;
  dailyFatTargetGrams?: number;
  dailyWaterTargetMl: number;
  notes?: string;
  theme: AppTheme;
  language: AppLanguage;
  unitSystem: 'kg' | 'lbs';
  screenWakeDuration?: ScreenWakeDuration;
  cardioMotivationFrequency?: CardioMotivationFrequency;
  autoGpsTracking?: boolean;
  units?: 'km' | 'miles';
  restSoundType?: RestSoundType;
  latestScaleScan?: BodyCompositionScan;
}

export interface Achievement {
  id: string;
  title: string;
  titleAr: string;
  description: string;
  descriptionAr: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: string;
  progress: number;
  maxProgress: number;
  category: 'workouts' | 'streak' | 'strength' | 'cardio' | 'core' | 'nutrition' | 'hydration';
}

export interface AIChatMessage {
  id: string;
  role: 'user' | 'model' | 'assistant';
  content: string;
  timestamp: number;
  model?: string;
  modelUsed?: string;
}

export interface GeneratedImageRecord {
  id: string;
  prompt: string;
  imageUrl: string;
  imageSize: '1K' | '2K' | '4K';
  aspectRatio: string;
  createdAt: number;
}

export interface AppState {
  profile: UserProfile;
  activeWorkout: WorkoutSession | null;
  workoutHistory: WorkoutSession[];
  cardioHistory: CardioSession[];
  coreHistory: CoreSession[];
  recoveryHistory: RecoverySession[];
  nutritionHistory: NutritionEntry[];
  hydrationHistory: HydrationEntry[];
  measurementsHistory: BodyMeasurement[];
  achievements: Achievement[];
  chatHistory: AIChatMessage[];
  savedImages: GeneratedImageRecord[];
  customExercises: Exercise[];
}

export type SyncStatus = 'synced' | 'syncing' | 'offline' | 'error' | 'idle';

export type HeartRateZone = 1 | 2 | 3 | 4 | 5;

export type BluetoothDeviceType = 
  | 'samsung_galaxy_watch' 
  | 'apple_watch' 
  | 'garmin' 
  | 'polar' 
  | 'fitbit'
  | 'huawei_watch'
  | 'xiaomi_amazfit'
  | 'coros'
  | 'whoop' 
  | 'wahoo'
  | 'suunto'
  | 'smart_ring'
  | 'generic_hrm'
  | 'generic_smartwatch';

export type BluetoothConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface LiveTelemetryData {
  timestamp: number;
  heartRateBpm: number;
  heartRateZone: HeartRateZone;
  rrIntervalMs?: number;
  hrvRmssd?: number;
  caloriesBurnedRate?: number;
  totalSessionCalories?: number;
  stepsCount?: number;
  cadenceRpm?: number;
  bloodOxygenSpO2?: number;
  skinTemperatureC?: number;
  sensorLocation?: string;
  batteryLevel?: number;
  isSimulated?: boolean;
  deviceName?: string;
  deviceType?: BluetoothDeviceType;
}

export interface BluetoothDeviceInfo {
  id: string;
  name: string;
  type: BluetoothDeviceType;
  brandLabel?: string;
  batteryLevel?: number;
  sensorLocation?: string;
  connectedAt?: number;
  lastHeartRate?: number;
  lastSpO2?: number;
  lastSteps?: number;
  lastHrv?: number;
  supportedMetrics?: ('heart_rate' | 'hrv' | 'spo2' | 'steps' | 'calories' | 'battery' | 'temperature')[];
  firmwareVersion?: string;
  manufacturerName?: string;
}

export interface SamsungHealthDailySummary {
  id: string;
  date: string; // YYYY-MM-DD
  steps: number;
  stepTarget: number;
  activeMinutes: number;
  activeCaloriesBurnedKcal: number;
  totalCaloriesBurnedKcal: number;
  distanceKm: number;
  restingHeartRateBpm?: number;
  minHeartRateBpm?: number;
  maxHeartRateBpm?: number;
  avgHeartRateBpm?: number;
  bloodOxygenSpO2Percent?: number;
  sleepDurationMinutes?: number;
  sleepScore?: number;
  sleepDeepMinutes?: number;
  sleepRemMinutes?: number;
  sleepLightMinutes?: number;
  sleepAwakeMinutes?: number;
  bloodPressureSystolic?: number;
  bloodPressureDiastolic?: number;
  stressLevel?: 'low' | 'moderate' | 'high';
  bodyComposition?: {
    weightKg: number;
    bodyFatPercent: number;
    skeletalMuscleKg: number;
    bodyFatKg: number;
    waterPercent: number;
    bmrKcal: number;
    visceralFat?: number;
  };
  source: 'samsung_health_file' | 'health_connect' | 'manual_entry' | 'sample_data';
  importedAt: number;
}

export interface SamsungHealthSyncRecord {
  id: string;
  timestamp: number;
  fileName?: string;
  fileType?: string;
  recordsImported: number;
  dateRange: string;
  status: 'success' | 'warning' | 'error';
  summary: string;
  summaryAr: string;
}

export type BluetoothActivityCategory = 'workout' | 'cardio' | 'walking' | 'hiit' | 'mobility' | 'daily_tracking';

export interface HeartRate24hPoint {
  timestamp: number;
  timeLabel: string;
  hour: number;
  heartRate: number;
  restingHr: number;
  minHr: number;
  maxHr: number;
  hrvRmssd?: number;
  zone: HeartRateZone;
  zoneNameEn: string;
  zoneNameAr: string;
  activityEn: string;
  activityAr: string;
  isWorkout: boolean;
  isSleep: boolean;
  source: string;
}

export interface BluetoothActivityLog {
  id: string;
  deviceId: string;
  deviceName: string;
  deviceType: BluetoothDeviceType;
  timestamp: number;
  dateStr: string;
  activityTitle: string;
  activityTitleAr: string;
  category: BluetoothActivityCategory;
  durationMinutes: number;
  steps: number;
  hrvRmssd: number; // Heart Rate Variability (RMSSD in ms)
  hrvStatus: 'optimal' | 'good' | 'fatigued' | 'recovering';
  activeCalories: number; // Active calories burned (kcal)
  totalCalories?: number;
  avgHeartRateBpm: number;
  maxHeartRateBpm: number;
  minHeartRateBpm?: number;
  primaryZone: HeartRateZone;
  timeInZones?: {
    zone1Mins: number;
    zone2Mins: number;
    zone3Mins: number;
    zone4Mins: number;
    zone5Mins: number;
  };
  distanceKm?: number;
  cadenceAvgRpm?: number;
  sensorLocation?: string;
  batteryLevelAtSync?: number;
  source: 'live_ble_sync' | 'watch_memory_pull' | 'manual_device_log' | 'simulated_ble';
  syncedAt: number;
  notes?: string;
}

export type MajorMuscleGroup = 
  | 'chest'
  | 'back'
  | 'shoulders'
  | 'triceps'
  | 'biceps'
  | 'quads'
  | 'hamstrings_glutes'
  | 'calves'
  | 'core';

export interface MuscleGroupVolumePoint {
  weekNumber: number;
  weekLabel: string;
  weekLabelAr: string;
  dateRange: string;
  // Volume in kg (sets x reps x weight)
  chestKg: number;
  backKg: number;
  shouldersKg: number;
  tricepsKg: number;
  bicepsKg: number;
  quadsKg: number;
  hamstringsGlutesKg: number;
  calvesKg: number;
  coreKg: number;
  totalKg: number;
  // Sets counts
  chestSets: number;
  backSets: number;
  shouldersSets: number;
  tricepsSets: number;
  bicepsSets: number;
  quadsSets: number;
  hamstringsGlutesSets: number;
  calvesSets: number;
  coreSets: number;
  totalSets: number;
  // Top exercise drivers per muscle group
  topExercises?: {
    [key: string]: string[];
  };
}

export interface MuscleGroupSummary {
  id: MajorMuscleGroup;
  name: string;
  nameAr: string;
  splitCategory: 'push' | 'pull' | 'legs' | 'core';
  color: string;
  currentWeeklyVolumeKg: number;
  previousWeeklyVolumeKg: number;
  deltaPercent: number;
  currentWeeklySets: number;
  recommendedSetRange: string;
  volumeStatus: 'optimal_hypertrophy' | 'maintenance' | 'overloaded' | 'deload';
  volumeStatusAr: string;
  topExerciseNames: string[];
  allTimeVolumeKg: number;
}

export interface ExerciseLastPerformance {
  date: string;
  formattedDate: string;
  daysAgo: number;
  workoutName: string;
  sets: {
    setNumber: number;
    weight: number;
    reps: number;
    rpe?: number;
    volumeKg: number;
  }[];
  totalVolumeKg: number;
  maxWeight: number;
  maxReps: number;
  avgRpe: number;
  totalSets: number;
}

export interface ExerciseOverloadRecord {
  timesOverloaded: number; // How many times the user beat prior performance
  totalSessionsRecorded: number;
  overloadRatePercent: number;
  allTimeMaxWeight: number;
  allTimeMaxReps: number;
  allTimeMaxVolumeKg: number;
  recentSessions: {
    date: string;
    formattedDate: string;
    bestWeight: number;
    bestReps: number;
    totalVolumeKg: number;
    totalSets: number;
    exceededPrior: boolean;
    overloadType?: 'weight' | 'reps' | 'volume' | 'baseline';
  }[];
}

export interface TrainingBlockInfo {
  blockNumber: number;
  blockTitle: string;
  blockTitleAr: string;
  phaseType: 'hypertrophy_foundation' | 'progressive_overload' | 'strength_peak' | 'active_deload';
  startWeek: number;
  endWeek: number;
  totalTonnageKg: number;
  avgWeeklyVolumeKg: number;
  totalSets: number;
  totalReps: number;
  completedWorkouts: number;
  overloadGainPercent: number;
  status: 'completed' | 'active' | 'upcoming';
}

export interface WeeklyVolumeBlockPoint {
  weekNumber: number;
  blockNumber: number;
  weekInBlock: number; // 1, 2, 3, 4
  weekLabel: string;
  weekLabelAr: string;
  dateRange: string;
  volumeKg: number;
  volumeTons: number;
  previousBlockVolumeKg?: number;
  previousBlockVolumeTons?: number;
  overloadDeltaPercent?: number;
  targetVolumeKg: number;
  pushVolumeKg: number;
  pullVolumeKg: number;
  legsVolumeKg: number;
  completedSets: number;
  completedReps: number;
  workoutsCount: number;
  avgIntensityRpe: number;
  isOverloadAchieved: boolean;
  isDeload: boolean;
  isCurrentWeek: boolean;
  milestones: string[];
  milestonesAr: string[];
}

export interface OverloadMilestone {
  id: string;
  title: string;
  titleAr: string;
  description: string;
  descriptionAr: string;
  category: 'tonnage' | 'block_gain' | 'streak' | 'intensity' | 'pr';
  thresholdValue: number;
  currentValue: number;
  unit: string;
  achieved: boolean;
  achievedDate?: string;
  badgeColor: string;
  iconName: string;
}

// ==========================================
// Return to Training / العودة بعد الانقطاع Types
// ==========================================

export type ReturnToTrainingLevel = 'normal' | 'light' | 'moderate' | 'reconditioning' | 'restart';

export interface InterruptionAnalysis {
  daysSinceLastWorkout: number;
  lastWorkoutDate: string | null;
  lastWorkoutName?: string;
  lastWorkoutNameAr?: string;
  interruptionLevel: ReturnToTrainingLevel;
  interruptionLevelNumber: 0 | 1 | 2 | 3 | 4;
  levelLabel: string;
  levelLabelAr: string;
  isInterrupted: boolean; // true if days >= 4
  currentReadinessScore: number; // 0 to 100
  readinessLevel: 'optimal' | 'good' | 'moderate' | 'low' | 'reconditioning';
  readinessLabel: string;
  readinessLabelAr: string;
  totalReturnSessionsNeeded: number; // 1, 2, or 3+
  currentReturnSessionIndex: number; // 1-indexed (e.g. 1 of 2)
  recurringBreakPattern: boolean;
  totalPreviousBreaks: number;
  recommendedLoadFactor: number; // e.g. 0.65 (65% of last working weight)
  recommendedVolumeFactor: number; // e.g. 0.70 (70% of sets)
  recommendedRpeTarget: number; // e.g. 6 to 7
  reasonText: string;
  reasonTextAr: string;
  summaryGuidance: string;
  summaryGuidanceAr: string;
  lastPerformanceSummary?: {
    totalVolumeKg: number;
    avgRpe: number;
    primaryExercises: string[];
  };
}

export interface PreReturnCheckin {
  feeling: 'great' | 'good' | 'normal' | 'tired' | 'very_tired';
  painLevel: 'none' | 'mild' | 'pain';
  painArea?: string;
  energyLevel: number; // 1 to 10
  sleepQuality: number; // 1 to 10
  timestamp: number;
}

export interface PostReturnFeedback {
  id: string;
  date: string;
  sessionNumber: number;
  energyRating: number; // 1-5
  fatigueRating: number; // 1-5
  muscleSoreness: 'none' | 'mild' | 'moderate' | 'severe';
  difficultyRating: 'too_easy' | 'just_right' | 'challenging' | 'too_hard';
  sessionRpe: number; // 1-10
  completedAllExercises: boolean;
  experiencedShortnessOfBreath: boolean;
  experiencedPain: boolean;
  painDetails?: string;
  timestamp: number;
  aiDecision: 'ready_to_resume' | 'take_extra_recovery' | 'extend_reconditioning' | 'medical_consultation_advised';
  aiDecisionText: string;
  aiDecisionTextAr: string;
}

export type ReturnPhaseStage = 'warmup' | 'mobility' | 'activation' | 'light_strength' | 'cooldown';

export interface ReturnExerciseItem {
  id: string;
  exerciseId: string;
  name: string;
  nameAr: string;
  stage: ReturnPhaseStage;
  stageLabel: string;
  stageLabelAr: string;
  targetSets: number;
  targetReps: string;
  suggestedWeightKg: number;
  historicalWorkingWeightKg?: number;
  weightReductionPercent?: number;
  durationSeconds?: number;
  restSeconds: number;
  targetRpe: number;
  instructions: string[];
  instructionsAr: string[];
  safetyNotes?: string;
  safetyNotesAr?: string;
  primaryMuscle: string;
  primaryMuscleAr?: string;
  imageUrl?: string;
  alternatives?: string[];
  completed?: boolean;
}

export interface ReturnWorkoutPlan {
  id: string;
  sessionIndex: number; // 1, 2, 3...
  totalSessions: number;
  level: ReturnToTrainingLevel;
  levelNumber: number;
  title: string;
  titleAr: string;
  subtitle: string;
  subtitleAr: string;
  estimatedDurationMinutes: number;
  targetIntensity: 'light' | 'light_moderate' | 'moderate';
  targetRpeRange: string;
  estimatedCalories: number;
  stages: {
    warmup: ReturnExerciseItem[];
    mobility: ReturnExerciseItem[];
    activation: ReturnExerciseItem[];
    lightStrength: ReturnExerciseItem[];
    cooldown: ReturnExerciseItem[];
  };
  totalExercisesCount: number;
  primaryGoal: string;
  primaryGoalAr: string;
  adaptiveNote?: string;
  adaptiveNoteAr?: string;
}

export interface ReturnTrainingState {
  isInReturnMode: boolean;
  analysis: InterruptionAnalysis | null;
  activePlan: ReturnWorkoutPlan | null;
  completedSessionsCount: number;
  targetSessionsCount: number;
  preCheckinHistory: PreReturnCheckin[];
  postFeedbackHistory: PostReturnFeedback[];
  userDismissed: boolean;
  resumedStandardAt?: number;
}

