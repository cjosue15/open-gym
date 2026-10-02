import { createClient } from '@/lib/supabase/client';

export const PERIODS = ['7D', '30D', '90D'] as const;
export type Period = (typeof PERIODS)[number];

const PERIOD_DAYS: Record<Period, number> = { '7D': 7, '30D': 28, '90D': 90 };
const PERIOD_BUCKETS: Record<Period, number> = { '7D': 7, '30D': 4, '90D': 3 };

const KG_PER_LB = 1 / 2.20462;
const WEEKDAY_LETTERS = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];

function toKg(weight: number | null, unit: 'kg' | 'lb'): number {
  if (!weight) return 0;
  return unit === 'kg' ? weight : weight * KG_PER_LB;
}

function dayKey(iso: string): string {
  const date = new Date(iso);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function daysAgo(n: number): Date {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - n);
  return date;
}

type WorkoutSetRow = {
  reps: number;
  weight: number | null;
  weight_unit: 'kg' | 'lb';
};
type WorkoutExerciseRow = { name: string; workout_sets: WorkoutSetRow[] };
type WorkoutRow = {
  id: string;
  started_at: string;
  finished_at: string;
  workout_exercises: WorkoutExerciseRow[];
};

export type VolumePoint = { label: string; value: number };
export type ExerciseProgress = {
  name: string;
  bestWeightKg: number;
  bestReps: number;
  deltaPct: number | null;
  trend: number[];
};
export type ProgressData = {
  volumeByPeriod: Record<Period, VolumePoint[]>;
  workoutsCountByPeriod: Record<Period, number>;
  workoutsDeltaByPeriod: Record<Period, number>;
  totalVolumeKgByPeriod: Record<Period, number>;
  exerciseProgressByPeriod: Record<Period, ExerciseProgress[]>;
  currentStreak: number;
  streakDays: boolean[];
  hasAnyWorkouts: boolean;
};

export async function fetchProgress(): Promise<ProgressData> {
  const supabase = createClient();
  const cutoff = daysAgo(180);

  const { data, error } = await supabase
    .from('workouts')
    .select(
      'id, started_at, finished_at, workout_exercises(name, workout_sets(reps, weight, weight_unit))',
    )
    .not('finished_at', 'is', null)
    .gte('started_at', cutoff.toISOString())
    .order('started_at', { ascending: true })
    .returns<WorkoutRow[]>();
  if (error) throw error;
  const workouts = data ?? [];

  const workoutDays = new Set(
    workouts.map((workout) => dayKey(workout.started_at)),
  );

  const currentStreak = (() => {
    let count = 0;
    let cursor = daysAgo(0);
    if (!workoutDays.has(dayKey(cursor.toISOString()))) cursor = daysAgo(1);
    while (workoutDays.has(dayKey(cursor.toISOString()))) {
      count += 1;
      cursor.setDate(cursor.getDate() - 1);
    }
    return count;
  })();

  const streakDays = Array.from({ length: 28 }, (_, index) =>
    workoutDays.has(dayKey(daysAgo(27 - index).toISOString())),
  );

  function windowSets(startDaysAgo: number, endDaysAgo: number) {
    const start = daysAgo(startDaysAgo);
    const end = endDaysAgo === 0 ? new Date() : daysAgo(endDaysAgo);
    return workouts.filter((workout) => {
      const started = new Date(workout.started_at);
      return started >= start && started < end;
    });
  }

  const volumeByPeriod = {} as Record<Period, VolumePoint[]>;
  const workoutsCountByPeriod = {} as Record<Period, number>;
  const workoutsDeltaByPeriod = {} as Record<Period, number>;
  const totalVolumeKgByPeriod = {} as Record<Period, number>;
  const exerciseProgressByPeriod = {} as Record<Period, ExerciseProgress[]>;

  for (const period of PERIODS) {
    const totalDays = PERIOD_DAYS[period];
    const buckets = PERIOD_BUCKETS[period];
    const bucketSize = totalDays / buckets;

    const points: VolumePoint[] = [];
    for (let b = 0; b < buckets; b++) {
      const endDaysAgo = totalDays - b * bucketSize - bucketSize;
      const startDaysAgo = totalDays - b * bucketSize;
      const bucketWorkouts = windowSets(startDaysAgo, endDaysAgo);
      const bucketVolume = bucketWorkouts.reduce(
        (sum, workout) =>
          sum +
          workout.workout_exercises.reduce(
            (exerciseSum, exercise) =>
              exerciseSum +
              exercise.workout_sets.reduce(
                (setSum, set) =>
                  setSum + set.reps * toKg(set.weight, set.weight_unit),
                0,
              ),
            0,
          ),
        0,
      );
      const label =
        period === '7D'
          ? WEEKDAY_LETTERS[daysAgo(endDaysAgo).getDay()]
          : period === '30D'
            ? `S${b + 1}`
            : daysAgo(endDaysAgo).toLocaleDateString('es', { month: 'short' });
      points.push({ label, value: Math.round(bucketVolume) });
    }
    volumeByPeriod[period] = points;
    totalVolumeKgByPeriod[period] = points.reduce(
      (sum, point) => sum + point.value,
      0,
    );

    const currentWorkouts = windowSets(totalDays, 0);
    const previousWorkouts = windowSets(totalDays * 2, totalDays);
    workoutsCountByPeriod[period] = currentWorkouts.length;
    workoutsDeltaByPeriod[period] =
      currentWorkouts.length - previousWorkouts.length;

    const bestByExercise = (workouts: WorkoutRow[]) => {
      const map = new Map<
        string,
        { bestWeightKg: number; bestReps: number; trend: number[] }
      >();
      for (const workout of workouts) {
        for (const exercise of workout.workout_exercises) {
          let sessionBest = 0;
          let sessionBestReps = 0;
          for (const set of exercise.workout_sets) {
            const kg = toKg(set.weight, set.weight_unit);
            if (kg > sessionBest) {
              sessionBest = kg;
              sessionBestReps = set.reps;
            }
          }
          if (sessionBest <= 0) continue;
          const entry = map.get(exercise.name) ?? {
            bestWeightKg: 0,
            bestReps: 0,
            trend: [],
          };
          entry.trend.push(sessionBest);
          if (sessionBest > entry.bestWeightKg) {
            entry.bestWeightKg = sessionBest;
            entry.bestReps = sessionBestReps;
          }
          map.set(exercise.name, entry);
        }
      }
      return map;
    };

    const currentBest = bestByExercise(currentWorkouts);
    const previousBest = bestByExercise(previousWorkouts);

    const exerciseProgress: ExerciseProgress[] = [...currentBest.entries()]
      .map(([name, entry]) => {
        const previous = previousBest.get(name);
        const deltaPct = previous
          ? Math.round(
              ((entry.bestWeightKg - previous.bestWeightKg) /
                previous.bestWeightKg) *
                100,
            )
          : null;
        return {
          name,
          bestWeightKg: entry.bestWeightKg,
          bestReps: entry.bestReps,
          deltaPct,
          trend: entry.trend.slice(-7),
        };
      })
      .sort((a, b) => b.bestWeightKg - a.bestWeightKg)
      .slice(0, 6);

    exerciseProgressByPeriod[period] = exerciseProgress;
  }

  return {
    volumeByPeriod,
    workoutsCountByPeriod,
    workoutsDeltaByPeriod,
    totalVolumeKgByPeriod,
    exerciseProgressByPeriod,
    currentStreak,
    streakDays,
    hasAnyWorkouts: workouts.length > 0,
  };
}

export async function fetchBestStreak(): Promise<number> {
  const supabase = createClient();
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const { data, error } = await supabase.rpc('best_workout_streak', { tz });
  if (error) throw error;
  return data ?? 0;
}
