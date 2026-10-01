'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Dumbbell, Loader2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Metric from '@/components/dashboard/metric';
import ExerciseCard, {
  type Exercise,
  type SetEntry,
} from '@/components/dashboard/today/exercise-card';
import { WEEKDAYS } from '@/components/day-picker';
import {
  fetchRoutineById,
  fetchTodayRoutine,
  fetchTodaysCompletedWorkout,
  getTodayWeekday,
  saveWorkout,
  updateWorkout,
  type CompletedWorkout,
  type TodayRoutine,
} from '@/lib/supabase/workouts';
import { fetchRoutines, type Routine } from '@/lib/supabase/routines';

function draftKey(routineId: string) {
  return `kilo-draft-${routineId}-${new Date().toISOString().slice(0, 10)}`;
}

function seedExercises(routine: TodayRoutine): Exercise[] {
  return routine.exercises.map((exercise, index) => ({
    id: index + 1,
    name: exercise.name,
    cue: `${exercise.targetSets} series objetivo · ${exercise.targetReps} reps`,
    open: index === 0,
    sets: Array.from({ length: exercise.targetSets }, (_, setIndex) => ({
      id: setIndex + 1,
      reps: 0,
      weight: 0,
      unit: 'kg' as const,
      note: '',
    })),
  }));
}

function reconcileExercises(
  routine: TodayRoutine,
  draft: Exercise[],
): Exercise[] {
  return routine.exercises.map((exercise, index) => {
    const existing = draft.find((item) => item.name === exercise.name);
    if (existing) {
      return {
        ...existing,
        id: index + 1,
        cue: `${exercise.targetSets} series objetivo · ${exercise.targetReps} reps`,
        open: index === 0,
      };
    }
    return {
      id: index + 1,
      name: exercise.name,
      cue: `${exercise.targetSets} series objetivo · ${exercise.targetReps} reps`,
      open: index === 0,
      sets: Array.from({ length: exercise.targetSets }, (_, setIndex) => ({
        id: setIndex + 1,
        reps: 0,
        weight: 0,
        unit: 'kg' as const,
        note: '',
      })),
    };
  });
}

function loadExercises(routine: TodayRoutine): Exercise[] {
  const stored = window.localStorage.getItem(draftKey(routine.id));
  if (!stored) return seedExercises(routine);
  const draft = JSON.parse(stored) as Exercise[];
  return reconcileExercises(routine, draft);
}

function exercisesFromCompleted(completed: CompletedWorkout): Exercise[] {
  return completed.exercises.map((exercise, index) => ({
    id: index + 1,
    name: exercise.name,
    cue: '',
    open: index === 0,
    sets: exercise.sets.map((set, setIndex) => ({
      id: setIndex + 1,
      reps: set.reps,
      weight: set.weight ?? 0,
      unit: set.unit,
      note: set.note ?? '',
    })),
  }));
}

export default function TodayView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [routine, setRoutine] = useState<TodayRoutine | null>(null);
  const [completed, setCompleted] = useState<CompletedWorkout | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [allRoutines, setAllRoutines] = useState<Routine[]>([]);
  const [switching, setSwitching] = useState(false);
  const weekday = getTodayWeekday();

  useEffect(() => {
    Promise.all([
      fetchTodayRoutine(weekday),
      fetchTodaysCompletedWorkout(),
      fetchRoutines(),
    ])
      .then(async ([todayRoutine, todaysCompleted, routines]) => {
        setCompleted(todaysCompleted);
        setAllRoutines(routines);

        let activeRoutine = todayRoutine;
        if (
          todaysCompleted?.routineId &&
          todaysCompleted.routineId !== todayRoutine?.id
        ) {
          activeRoutine = await fetchRoutineById(todaysCompleted.routineId);
        }
        setRoutine(activeRoutine);

        if (activeRoutine && !todaysCompleted) {
          setExercises(loadExercises(activeRoutine));
        }
      })
      .catch((error: unknown) =>
        toast.error('No se pudo cargar el entrenamiento de hoy', {
          description: error instanceof Error ? error.message : undefined,
        }),
      )
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (loading) return;
    const requestedRoutineId = searchParams.get('routine');
    if (!requestedRoutineId) return;
    router.replace('/dashboard');
    if (completed) {
      toast.error('Ya completaste tu entrenamiento de hoy', {
        description: 'Edítalo si quieres ajustar las series.',
      });
      return;
    }
    selectRoutineForToday(requestedRoutineId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  useEffect(() => {
    if (!routine || completed) return;
    window.localStorage.setItem(
      draftKey(routine.id),
      JSON.stringify(exercises),
    );
  }, [exercises, routine, completed]);

  const totalSets = useMemo(
    () =>
      exercises.reduce(
        (count, item) => count + item.sets.filter((set) => set.reps > 0).length,
        0,
      ),
    [exercises],
  );
  const totalTargetSets = exercises.reduce(
    (count, item) => count + item.sets.length,
    0,
  );
  const completedPct =
    totalTargetSets > 0 ? Math.round((totalSets / totalTargetSets) * 100) : 0;
  const volume = useMemo(
    () =>
      exercises.reduce(
        (sum, item) =>
          sum +
          item.sets.reduce(
            (setSum, set) =>
              setSum + (set.reps > 0 ? set.reps * set.weight : 0),
            0,
          ),
        0,
      ),
    [exercises],
  );

  function updateSet(
    exerciseId: number,
    setId: number,
    key: keyof SetEntry,
    value: string | number,
  ) {
    setExercises((current) =>
      current.map((exercise) =>
        exercise.id !== exerciseId
          ? exercise
          : {
              ...exercise,
              sets: exercise.sets.map((set) =>
                set.id !== setId
                  ? set
                  : {
                      ...set,
                      [key]:
                        key === 'reps' || key === 'weight'
                          ? Number(value)
                          : value,
                    },
              ),
            },
      ),
    );
  }
  function addSet(exerciseId: number) {
    setExercises((current) =>
      current.map((exercise) =>
        exercise.id !== exerciseId
          ? exercise
          : {
              ...exercise,
              sets: [
                ...exercise.sets,
                { id: Date.now(), reps: 0, weight: 0, unit: 'kg', note: '' },
              ],
            },
      ),
    );
  }
  function toggle(exerciseId: number) {
    setExercises((current) =>
      current.map((exercise) =>
        exercise.id === exerciseId
          ? { ...exercise, open: !exercise.open }
          : exercise,
      ),
    );
  }

  function startEdit() {
    if (!completed) return;
    const base = exercisesFromCompleted(completed);
    setExercises(routine ? reconcileExercises(routine, base) : base);
    setEditing(true);
  }

  function cancelEdit() {
    setEditing(false);
  }

  function selectRoutineForToday(routineId: string) {
    setSwitching(true);
    fetchRoutineById(routineId)
      .then((picked) => {
        if (!picked) return;
        setRoutine(picked);
        setExercises(loadExercises(picked));
      })
      .catch((error: unknown) =>
        toast.error('No se pudo cargar la rutina', {
          description: error instanceof Error ? error.message : undefined,
        }),
      )
      .finally(() => setSwitching(false));
  }

  async function handleSave() {
    if (!completed && !routine) return;
    if (totalSets === 0) {
      toast.error('Registra al menos una serie antes de guardar');
      return;
    }
    setSaving(true);
    const exercisesPayload = exercises.map((exercise, index) => ({
      routineExerciseId: routine?.exercises[index]?.routineExerciseId ?? null,
      name: exercise.name,
      sets: exercise.sets,
    }));
    const isEditing = Boolean(completed);
    const request = completed
      ? updateWorkout(completed.id, {
          routineName: routine?.name ?? completed.routineName,
          exercises: exercisesPayload,
        })
      : saveWorkout({
          routineId: routine!.id,
          routineName: routine!.name,
          exercises: exercisesPayload,
        });
    toast.promise(request, {
      loading: isEditing
        ? 'Actualizando entrenamiento…'
        : 'Guardando entrenamiento…',
      success: (saved) => {
        if (routine) window.localStorage.removeItem(draftKey(routine.id));
        setCompleted(saved);
        setEditing(false);
        return isEditing
          ? 'Entrenamiento actualizado'
          : 'Entrenamiento guardado';
      },
      error: (error: unknown) =>
        error instanceof Error
          ? error.message
          : 'No se pudo guardar el entrenamiento',
    });
    try {
      await request;
    } catch {
      /* handled by toast.promise */
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <p className='flex items-center gap-2 font-mono text-sm uppercase tracking-wider text-white/40'>
        <Loader2 className='size-4 animate-spin' /> Cargando tu día…
      </p>
    );
  }

  if (completed && !editing) {
    return (
      <>
        <section className='mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between'>
          <div>
            <div className='mb-3 flex items-center gap-2'>
              <span className='h-2 w-2 rounded-full bg-[#d6ff3f] shadow-[0_0_14px_#d6ff3f]' />
              <span className='font-mono text-sm uppercase tracking-[.17em] text-[#d6ff3f]'>
                {WEEKDAYS[weekday]} · {completed.routineName ?? 'Entrenamiento'}
              </span>
            </div>
            <h1 className='font-heading text-5xl leading-[.85] font-semibold uppercase tracking-[-.045em] sm:text-7xl'>
              Ya lo lograste<span className='text-[#d6ff3f]'>.</span>
            </h1>
            <p className='mt-3 text-sm text-white/45'>
              Entrenamiento completado hoy a las{' '}
              {new Date(completed.finishedAt).toLocaleTimeString('es', {
                hour: '2-digit',
                minute: '2-digit',
              })}
              .
            </p>
          </div>
          <Button
            onClick={startEdit}
            variant='outline'
            className='h-11 rounded-none border-white/15 bg-transparent font-mono text-sm uppercase tracking-wider text-white hover:bg-white/10 hover:text-white'
          >
            Editar
          </Button>
        </section>
        <div className='space-y-2'>
          {completed.exercises.map((exercise, index) => (
            <article
              key={index}
              className='border border-white/10 bg-[#171b18]'
            >
              <div className='flex items-center justify-between px-5 py-3 border-b border-white/10'>
                <h3 className='font-heading text-xl uppercase tracking-tight'>
                  {exercise.name}
                </h3>
                <Badge
                  variant='outline'
                  className='border-white/15 bg-transparent font-mono text-sm text-white/45'
                >
                  {exercise.sets.length} series
                </Badge>
              </div>
              <div className='divide-y divide-white/5'>
                {exercise.sets.map((set, setIndex) => (
                  <div
                    key={setIndex}
                    className='flex items-center justify-between px-5 py-2.5 font-mono text-sm text-white/60'
                  >
                    <span>Serie {setIndex + 1}</span>
                    <span>
                      {set.reps} reps
                      {set.weight ? ` · ${set.weight}${set.unit}` : ''}
                    </span>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      </>
    );
  }

  if (!routine && !editing) {
    return (
      <div className='flex min-h-[50vh] flex-col items-center justify-center text-center'>
        <p className='font-mono text-sm uppercase tracking-[.17em] text-[#d6ff3f]'>
          {WEEKDAYS[weekday]}
        </p>
        <h1 className='mt-2 font-heading text-5xl uppercase tracking-tight'>
          Sin rutina para hoy
        </h1>
        <p className='mt-3 max-w-sm text-sm leading-relaxed text-white/45'>
          Asigna una rutina a {WEEKDAYS[weekday]} para empezar a registrar tu
          entrenamiento.
        </p>
        <Button
          render={<Link href='/dashboard/rutinas' />}
          nativeButton={false}
          className='mt-6 h-11 rounded-none bg-[#d6ff3f] px-6 font-mono text-sm uppercase tracking-wider text-[#101311] hover:bg-[#edff9c]'
        >
          Ir a rutinas
        </Button>
        {allRoutines.length > 0 && (
          <div className='mt-10 w-full max-w-sm'>
            <p className='mb-3 font-mono text-sm uppercase tracking-[.17em] text-white/30'>
              O usa otra rutina hoy
            </p>
            <div className='space-y-2'>
              {allRoutines.map((item) => (
                <button
                  key={item.id}
                  onClick={() => selectRoutineForToday(item.id)}
                  disabled={switching}
                  className='flex w-full items-center justify-between border border-white/15 px-4 py-3 text-left font-mono text-sm uppercase tracking-wider text-white/70 transition hover:border-[#d6ff3f] hover:text-white disabled:opacity-50'
                >
                  {item.name}
                  <span className='text-white/30'>
                    {item.exercises.length} ejercicios
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  const routineLabel = routine?.name ?? completed?.routineName ?? 'Libre';

  return (
    <>
      <section className='mb-8 flex flex-col gap-6 lg:mb-10 lg:flex-row lg:items-end lg:justify-between'>
        <div>
          <div className='mb-3 flex items-center gap-2'>
            <span className='h-2 w-2 rounded-full bg-[#d6ff3f] shadow-[0_0_14px_#d6ff3f]' />
            <span className='font-mono text-sm uppercase tracking-[.17em] text-[#d6ff3f]'>
              {WEEKDAYS[weekday]} · {routineLabel}
            </span>
          </div>
          <h1 className='font-heading text-5xl leading-[.85] font-semibold uppercase tracking-[-.045em] sm:text-7xl'>
            Haz que cuente<span className='text-[#d6ff3f]'>.</span>
          </h1>
        </div>
      </section>

      <section className='mb-8 grid gap-px overflow-hidden rounded-sm border border-white/10 bg-white/10 sm:grid-cols-3'>
        <Metric
          label='Volumen hoy'
          value={`${volume.toLocaleString('es')}`}
          suffix='kg/lb'
          note='Suma de reps × peso'
          accent
        />
        <Metric
          label='Series completas'
          value={`${totalSets}`}
          suffix={` / ${totalTargetSets}`}
          note={`${completedPct}% de la rutina`}
        />
        <Metric
          label='Rutina'
          value={routineLabel}
          suffix=''
          note={routine ? `${routine.exercises.length} ejercicios` : 'Editando'}
        />
      </section>

      <div className='grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_320px]'>
        <section>
          <div className='mb-3 flex items-center justify-between'>
            <div>
              <p className='font-mono text-sm uppercase tracking-[.18em] text-white/45'>
                Entrenamiento activo
              </p>
              <h2 className='font-heading text-3xl uppercase tracking-tight'>
                {WEEKDAYS[weekday]} · {routineLabel}
              </h2>
            </div>
            <Button
              render={<Link href='/dashboard/rutinas' />}
              nativeButton={false}
              variant='outline'
              size='sm'
              className='border-white/15 bg-transparent font-mono text-sm uppercase tracking-wider text-white hover:bg-white/10 hover:text-white'
            >
              <Plus /> Rutina
            </Button>
          </div>
          <div className='space-y-2'>
            {exercises.map((exercise, index) => (
              <ExerciseCard
                key={exercise.id}
                exercise={exercise}
                index={index}
                toggle={() => toggle(exercise.id)}
                update={updateSet}
                add={() => addSet(exercise.id)}
              />
            ))}
          </div>
          <div className='mt-4 flex flex-col gap-3 sm:flex-row'>
            <Button
              onClick={handleSave}
              disabled={saving || totalSets === 0}
              className='h-12 bg-[#d6ff3f] px-4 font-mono text-sm uppercase tracking-wide text-[#101311] hover:bg-[#edff9c] disabled:opacity-60 sm:tracking-[.15em]'
            >
              <Dumbbell />
              {saving ? (
                'Guardando…'
              ) : editing ? (
                'Guardar cambios'
              ) : (
                <>
                  <span className='sm:hidden'>Guardar</span>
                  <span className='hidden sm:inline'>
                    Guardar entrenamiento
                  </span>
                </>
              )}
            </Button>
            {editing && (
              <Button
                onClick={cancelEdit}
                disabled={saving}
                variant='outline'
                className='h-12 border-white/15 bg-transparent px-4 font-mono text-sm uppercase tracking-wide text-white/70 hover:bg-white/10 hover:text-white sm:tracking-[.15em]'
              >
                Cancelar
              </Button>
            )}
          </div>
        </section>

        <aside className='space-y-5 xl:sticky xl:top-8'>
          {routine && (
            <article className='border border-white/10 bg-[#171b18]'>
              <div className='border-b border-white/10 px-5 py-4'>
                <p className='font-mono text-sm uppercase tracking-[.17em] text-white/50'>
                  Objetivo de la rutina
                </p>
              </div>
              <div className='divide-y divide-white/5'>
                {routine.exercises.map((exercise, index) => (
                  <div
                    key={index}
                    className='flex items-center justify-between px-5 py-2.5'
                  >
                    <span className='font-mono text-sm text-white/60'>
                      {exercise.name}
                    </span>
                    <span className='font-mono text-sm text-white/30'>
                      {exercise.targetSets} × {exercise.targetReps}
                    </span>
                  </div>
                ))}
              </div>
            </article>
          )}
        </aside>
      </div>
    </>
  );
}
