import { WorkoutSession, WorkoutExercise, SetLog, PersonalRecordEvent } from '../types';

export interface ExercisePRSummary {
  maxWeight: number;
  maxSetVolume: number;
  maxRepsAtMaxWeight: number;
  totalSetsCompleted: number;
}

export const PRService = {
  /**
   * Scans history and current workout to find historical bests for an exercise
   */
  getHistoricalBests(
    exerciseId: string,
    exerciseName: string,
    history: WorkoutSession[],
    currentWorkout?: WorkoutSession,
    excludeSetId?: string
  ): ExercisePRSummary {
    let maxWeight = 0;
    let maxSetVolume = 0;
    let maxRepsAtMaxWeight = 0;
    let totalSetsCompleted = 0;

    // 1. Scan completed sessions in history
    history.forEach(session => {
      if (!session.completed) return;
      session.exercises.forEach(ex => {
        if (ex.exerciseId === exerciseId || ex.exerciseName.toLowerCase() === exerciseName.toLowerCase()) {
          ex.sets.forEach(s => {
            if (s.completed) {
              totalSetsCompleted += 1;
              const w = s.actualWeight || 0;
              const r = s.actualReps || 0;
              const setVol = w * r;

              if (w > maxWeight) {
                maxWeight = w;
                maxRepsAtMaxWeight = r;
              } else if (w === maxWeight && r > maxRepsAtMaxWeight) {
                maxRepsAtMaxWeight = r;
              }

              if (setVol > maxSetVolume) {
                maxSetVolume = setVol;
              }
            }
          });
        }
      });
    });

    // 2. Scan currently completed sets in the ongoing session (excluding current set)
    if (currentWorkout) {
      currentWorkout.exercises.forEach(ex => {
        if (ex.exerciseId === exerciseId || ex.exerciseName.toLowerCase() === exerciseName.toLowerCase()) {
          ex.sets.forEach(s => {
            if (s.completed && s.id !== excludeSetId) {
              const w = s.actualWeight || 0;
              const r = s.actualReps || 0;
              const setVol = w * r;

              if (w > maxWeight) {
                maxWeight = w;
                maxRepsAtMaxWeight = r;
              } else if (w === maxWeight && r > maxRepsAtMaxWeight) {
                maxRepsAtMaxWeight = r;
              }

              if (setVol > maxSetVolume) {
                maxSetVolume = setVol;
              }
            }
          });
        }
      });
    }

    return {
      maxWeight,
      maxSetVolume,
      maxRepsAtMaxWeight,
      totalSetsCompleted,
    };
  },

  /**
   * Checks if a completed set constitutes a new Weight PR or Volume PR
   */
  checkForPR(
    exerciseId: string,
    exerciseName: string,
    exerciseNameAr: string | undefined,
    setLog: SetLog,
    history: WorkoutSession[],
    currentWorkout?: WorkoutSession
  ): PersonalRecordEvent | null {
    const weight = setLog.actualWeight || 0;
    const reps = setLog.actualReps || 0;

    // Bodyweight or zero-rep sets don't count for lifting PRs
    if (weight <= 0 || reps <= 0) return null;

    const bests = this.getHistoricalBests(
      exerciseId,
      exerciseName,
      history,
      currentWorkout,
      setLog.id
    );

    const currentSetVolume = weight * reps;

    // Condition 1: Absolute Weight PR (Higher working weight than ever completed)
    if (bests.maxWeight > 0 && weight > bests.maxWeight) {
      const diff = Math.round((weight - bests.maxWeight) * 10) / 10;
      return {
        exerciseId,
        exerciseName,
        exerciseNameAr,
        prType: 'weight',
        newValue: weight,
        previousValue: bests.maxWeight,
        unit: 'kg',
        reps,
        diff,
        setNumber: setLog.setNumber,
      };
    }

    // Condition 2: Set Volume PR (Weight * Reps exceeds highest previous single-set tonnage)
    if (bests.maxSetVolume > 0 && currentSetVolume > bests.maxSetVolume) {
      const diff = Math.round(currentSetVolume - bests.maxSetVolume);
      return {
        exerciseId,
        exerciseName,
        exerciseNameAr,
        prType: 'volume',
        newValue: Math.round(currentSetVolume),
        previousValue: Math.round(bests.maxSetVolume),
        unit: 'kg-vol',
        reps,
        diff,
        setNumber: setLog.setNumber,
      };
    }

    return null;
  }
};
