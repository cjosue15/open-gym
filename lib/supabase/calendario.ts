import { createClient } from '@/lib/supabase/client';

const KG_PER_LB = 1 / 2.20462;

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

type WorkoutSetRow = {
  reps: number;
  weight: number | null;
  weight_unit: 'kg' | 'lb';
};
type WorkoutExerciseRow = {
  name: string;
  position: number;
  workout_sets: WorkoutSetRow[];
};
type WorkoutRow = {
  id: string;
  started_at: string;
  routines: { name: string } | null;
  workout_exercises: WorkoutExerciseRow[];
};

export type DaySummary = {
  routineName: string;
  totalVolumeKg: number;
  exercises: { name: string; sets: number; bestSet: string }[];
};

export async function fetchCalendarMonth(
  year: number,
  month: number,
): Promise<Record<string, DaySummary>> {
  const supabase = createClient();
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 1);

  const { data, error } = await supabase
    .from('workouts')
    .select(
      'id, started_at, routines(name), workout_exercises(name, position, workout_sets(reps, weight, weight_unit))',
    )
    .not('finished_at', 'is', null)
    .gte('started_at', start.toISOString())
    .lt('started_at', end.toISOString())
    .order('started_at', { ascending: true })
    .returns<WorkoutRow[]>();
  if (error) throw error;
  const workouts = data ?? [];

  const summaries: Record<string, DaySummary> = {};

  for (const workout of workouts) {
    let totalVolumeKg = 0;
    const exercises = [...workout.workout_exercises]
      .sort((a, b) => a.position - b.position)
      .map((exercise) => {
        let bestWeightKg = 0;
        let bestReps = 0;
        let bestUnit: 'kg' | 'lb' = 'kg';
        let bestRawWeight = 0;
        for (const set of exercise.workout_sets) {
          const kg = toKg(set.weight, set.weight_unit);
          totalVolumeKg += set.reps * kg;
          if (kg > bestWeightKg) {
            bestWeightKg = kg;
            bestReps = set.reps;
            bestUnit = set.weight_unit;
            bestRawWeight = set.weight ?? 0;
          }
        }
        return {
          name: exercise.name,
          sets: exercise.workout_sets.length,
          bestSet:
            bestWeightKg > 0
              ? `${bestRawWeight}${bestUnit} × ${bestReps}`
              : `${bestReps} reps`,
        };
      });

    summaries[dayKey(workout.started_at)] = {
      routineName: workout.routines?.name ?? 'Entrenamiento libre',
      totalVolumeKg: Math.round(totalVolumeKg),
      exercises,
    };
  }

  return summaries;
}
