import { createClient } from '@/lib/supabase/client';

export type DraftSet = {
  reps: number;
  weight: number;
  unit: 'kg' | 'lb';
  note: string;
};

export type TodayExercise = {
  routineExerciseId: string;
  name: string;
  targetSets: number;
  targetReps: number;
};

export type TodayRoutine = {
  id: string;
  name: string;
  weekday: number;
  exercises: TodayExercise[];
};

type TodayRoutineRow = {
  id: string;
  name: string;
  weekday: number | null;
  routine_exercises: {
    id: string;
    name: string;
    position: number;
    target_sets: number;
    target_reps: number;
  }[];
};

export function getTodayWeekday(): number {
  const jsDay = new Date().getDay();
  return (jsDay + 6) % 7;
}

export async function fetchTodayRoutine(
  weekday: number,
): Promise<TodayRoutine | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('routines')
    .select(
      'id, name, weekday, routine_exercises(id, name, position, target_sets, target_reps)',
    )
    .eq('weekday', weekday)
    .is('deleted_at', null)
    .order('created_at', { ascending: true })
    .limit(1)
    .returns<TodayRoutineRow[]>();
  if (error) throw error;

  const routine = data[0];
  if (!routine) return null;

  return {
    id: routine.id,
    name: routine.name,
    weekday: routine.weekday ?? weekday,
    exercises: [...routine.routine_exercises]
      .sort((a, b) => a.position - b.position)
      .map((exercise) => ({
        routineExerciseId: exercise.id,
        name: exercise.name,
        targetSets: exercise.target_sets,
        targetReps: exercise.target_reps,
      })),
  };
}

export async function fetchRoutineById(
  routineId: string,
): Promise<TodayRoutine | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('routines')
    .select(
      'id, name, weekday, routine_exercises(id, name, position, target_sets, target_reps)',
    )
    .eq('id', routineId)
    .is('deleted_at', null)
    .limit(1)
    .returns<TodayRoutineRow[]>();
  if (error) throw error;

  const routine = data[0];
  if (!routine) return null;

  return {
    id: routine.id,
    name: routine.name,
    weekday: routine.weekday ?? getTodayWeekday(),
    exercises: [...routine.routine_exercises]
      .sort((a, b) => a.position - b.position)
      .map((exercise) => ({
        routineExerciseId: exercise.id,
        name: exercise.name,
        targetSets: exercise.target_sets,
        targetReps: exercise.target_reps,
      })),
  };
}

export type CompletedSet = {
  reps: number;
  weight: number | null;
  unit: 'kg' | 'lb';
  note: string | null;
};
export type CompletedExercise = { name: string; sets: CompletedSet[] };
export type CompletedWorkout = {
  id: string;
  routineId: string | null;
  routineName: string | null;
  finishedAt: string;
  exercises: CompletedExercise[];
};

type CompletedWorkoutRow = {
  id: string;
  finished_at: string;
  routine_id: string | null;
  routines: { name: string; deleted_at: string | null } | null;
  workout_exercises: {
    name: string;
    position: number;
    workout_sets: {
      set_number: number;
      reps: number;
      weight: number | null;
      weight_unit: 'kg' | 'lb';
      notes: string | null;
    }[];
  }[];
};

export async function fetchTodaysCompletedWorkout(): Promise<CompletedWorkout | null> {
  const supabase = createClient();
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from('workouts')
    .select(
      'id, finished_at, routine_id, routines(name, deleted_at), workout_exercises(name, position, workout_sets(set_number, reps, weight, weight_unit, notes))',
    )
    .gte('started_at', startOfDay.toISOString())
    .not('finished_at', 'is', null)
    .order('started_at', { ascending: false })
    .limit(5)
    .returns<CompletedWorkoutRow[]>();
  if (error) throw error;

  const workout = data.find((row) => !row.routines?.deleted_at);
  if (!workout) return null;

  return {
    id: workout.id,
    routineId: workout.routine_id,
    routineName: workout.routines?.name ?? null,
    finishedAt: workout.finished_at,
    exercises: [...workout.workout_exercises]
      .sort((a, b) => a.position - b.position)
      .map((exercise) => ({
        name: exercise.name,
        sets: [...exercise.workout_sets]
          .sort((a, b) => a.set_number - b.set_number)
          .map((set) => ({
            reps: set.reps,
            weight: set.weight,
            unit: set.weight_unit,
            note: set.notes,
          })),
      })),
  };
}

export async function updateWorkout(
  workoutId: string,
  input: {
    routineName: string | null;
    exercises: {
      routineExerciseId: string | null;
      name: string;
      sets: DraftSet[];
    }[];
  },
): Promise<CompletedWorkout> {
  const supabase = createClient();

  const { error: deleteError } = await supabase
    .from('workout_exercises')
    .delete()
    .eq('workout_id', workoutId);
  if (deleteError) throw deleteError;

  const { data: insertedExercises, error: exercisesError } = await supabase
    .from('workout_exercises')
    .insert(
      input.exercises.map((exercise, index) => ({
        workout_id: workoutId,
        routine_exercise_id: exercise.routineExerciseId,
        name: exercise.name,
        position: index + 1,
      })),
    )
    .select('id, position');
  if (exercisesError) throw exercisesError;

  const setsRows = input.exercises.flatMap((exercise, index) => {
    const workoutExerciseId = insertedExercises.find(
      (row) => row.position === index + 1,
    )!.id;
    return exercise.sets
      .filter((set) => set.reps > 0)
      .map((set, setIndex) => ({
        workout_exercise_id: workoutExerciseId,
        set_number: setIndex + 1,
        reps: set.reps,
        weight: set.weight || null,
        weight_unit: set.unit,
        notes: set.note || null,
      }));
  });
  if (setsRows.length > 0) {
    const { error: setsError } = await supabase
      .from('workout_sets')
      .insert(setsRows);
    if (setsError) throw setsError;
  }

  const { data: workout, error: workoutError } = await supabase
    .from('workouts')
    .select('finished_at, routine_id')
    .eq('id', workoutId)
    .single();
  if (workoutError) throw workoutError;

  return {
    id: workoutId,
    routineId: workout.routine_id,
    routineName: input.routineName,
    finishedAt: workout.finished_at,
    exercises: input.exercises.map((exercise) => ({
      name: exercise.name,
      sets: exercise.sets
        .filter((set) => set.reps > 0)
        .map((set) => ({
          reps: set.reps,
          weight: set.weight || null,
          unit: set.unit,
          note: set.note || null,
        })),
    })),
  };
}

export async function saveWorkout(input: {
  routineId: string | null;
  routineName: string | null;
  exercises: {
    routineExerciseId: string | null;
    name: string;
    sets: DraftSet[];
  }[];
}): Promise<CompletedWorkout> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('No hay sesión activa.');

  const nowIso = new Date().toISOString();
  const { data: workout, error: workoutError } = await supabase
    .from('workouts')
    .insert({
      user_id: user.id,
      routine_id: input.routineId,
      started_at: nowIso,
      finished_at: nowIso,
    })
    .select('id')
    .single();
  if (workoutError) throw workoutError;

  const { data: insertedExercises, error: exercisesError } = await supabase
    .from('workout_exercises')
    .insert(
      input.exercises.map((exercise, index) => ({
        workout_id: workout.id,
        routine_exercise_id: exercise.routineExerciseId,
        name: exercise.name,
        position: index + 1,
      })),
    )
    .select('id, position');
  if (exercisesError) throw exercisesError;

  const setsRows = input.exercises.flatMap((exercise, index) => {
    const workoutExerciseId = insertedExercises.find(
      (row) => row.position === index + 1,
    )!.id;
    return exercise.sets
      .filter((set) => set.reps > 0)
      .map((set, setIndex) => ({
        workout_exercise_id: workoutExerciseId,
        set_number: setIndex + 1,
        reps: set.reps,
        weight: set.weight || null,
        weight_unit: set.unit,
        notes: set.note || null,
      }));
  });
  if (setsRows.length > 0) {
    const { error: setsError } = await supabase
      .from('workout_sets')
      .insert(setsRows);
    if (setsError) throw setsError;
  }

  return {
    id: workout.id,
    routineId: input.routineId,
    routineName: input.routineName,
    finishedAt: nowIso,
    exercises: input.exercises.map((exercise) => ({
      name: exercise.name,
      sets: exercise.sets
        .filter((set) => set.reps > 0)
        .map((set) => ({
          reps: set.reps,
          weight: set.weight || null,
          unit: set.unit,
          note: set.note || null,
        })),
    })),
  };
}
