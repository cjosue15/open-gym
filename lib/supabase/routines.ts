import { createClient } from '@/lib/supabase/client';

export type RoutineExercise = { name: string; sets: number; reps: number };
export type Routine = {
  id: string;
  name: string;
  weekday: number | null;
  exercises: RoutineExercise[];
};

type RoutineRow = {
  id: string;
  name: string;
  weekday: number | null;
  routine_exercises: {
    name: string;
    position: number;
    target_sets: number;
    target_reps: number;
  }[];
};

export async function fetchRoutines(): Promise<Routine[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('routines')
    .select(
      'id, name, weekday, routine_exercises(name, position, target_sets, target_reps)',
    )
    .is('deleted_at', null)
    .order('created_at', { ascending: true })
    .returns<RoutineRow[]>();
  if (error) throw error;

  return data.map((routine) => ({
    id: routine.id,
    name: routine.name,
    weekday: routine.weekday,
    exercises: [...routine.routine_exercises]
      .sort((a, b) => a.position - b.position)
      .map((exercise) => ({
        name: exercise.name,
        sets: exercise.target_sets,
        reps: exercise.target_reps,
      })),
  }));
}

export async function createRoutine(input: {
  name: string;
  weekday: number | null;
  exercises: RoutineExercise[];
}): Promise<Routine> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('No hay sesión activa.');

  const { data: routine, error: routineError } = await supabase
    .from('routines')
    .insert({ user_id: user.id, name: input.name, weekday: input.weekday })
    .select('id, name, weekday')
    .single();
  if (routineError) throw routineError;

  const { error: exercisesError } = await supabase
    .from('routine_exercises')
    .insert(
      input.exercises.map((exercise, index) => ({
        routine_id: routine.id,
        name: exercise.name,
        position: index + 1,
        target_sets: exercise.sets,
        target_reps: exercise.reps,
      })),
    );
  if (exercisesError) throw exercisesError;

  return {
    id: routine.id,
    name: routine.name,
    weekday: routine.weekday,
    exercises: input.exercises,
  };
}

export async function updateRoutine(
  id: string,
  input: { name: string; weekday: number | null; exercises: RoutineExercise[] },
): Promise<Routine> {
  const supabase = createClient();

  const { error: routineError } = await supabase
    .from('routines')
    .update({ name: input.name, weekday: input.weekday })
    .eq('id', id);
  if (routineError) throw routineError;

  const { error: deleteError } = await supabase
    .from('routine_exercises')
    .delete()
    .eq('routine_id', id);
  if (deleteError) throw deleteError;

  const { error: insertError } = await supabase
    .from('routine_exercises')
    .insert(
      input.exercises.map((exercise, index) => ({
        routine_id: id,
        name: exercise.name,
        position: index + 1,
        target_sets: exercise.sets,
        target_reps: exercise.reps,
      })),
    );
  if (insertError) throw insertError;

  return {
    id,
    name: input.name,
    weekday: input.weekday,
    exercises: input.exercises,
  };
}

export async function deleteRoutine(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from('routines')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}
