'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowUpRight,
  Dumbbell,
  Flame,
  MoreHorizontal,
  Plus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import Metric from '@/components/dashboard/metric';
import ExerciseCard, {
  type Exercise,
  type SetEntry,
} from '@/components/dashboard/today/exercise-card';

const initialExercises: Exercise[] = [
  {
    id: 1,
    name: 'Pantorrillas',
    cue: 'Controla la bajada · 3 series',
    open: true,
    sets: [
      { id: 1, reps: 14, weight: 95, unit: 'lb', note: '' },
      { id: 2, reps: 13, weight: 95, unit: 'lb', note: '' },
      { id: 3, reps: 11, weight: 95, unit: 'lb', note: '' },
    ],
  },
  {
    id: 2,
    name: 'Aductores cerrado',
    cue: 'Máquina · 3 series',
    open: true,
    sets: [
      { id: 1, reps: 12, weight: 32, unit: 'kg', note: 'Última con ayuda' },
      { id: 2, reps: 8, weight: 32, unit: 'kg', note: '2 últimas con ayuda' },
      { id: 3, reps: 8, weight: 25, unit: 'kg', note: 'Últimas 2 con 25 kg' },
    ],
  },
  {
    id: 3,
    name: 'Prensa inclinada',
    cue: 'Pendiente · 3 series',
    sets: [
      { id: 1, reps: 0, weight: 0, unit: 'kg', note: '' },
      { id: 2, reps: 0, weight: 0, unit: 'kg', note: '' },
      { id: 3, reps: 0, weight: 0, unit: 'kg', note: '' },
    ],
  },
  {
    id: 4,
    name: 'Extensión de cuádriceps',
    cue: 'Pendiente · 3 series',
    sets: [
      { id: 1, reps: 0, weight: 0, unit: 'kg', note: '' },
      { id: 2, reps: 0, weight: 0, unit: 'kg', note: '' },
      { id: 3, reps: 0, weight: 0, unit: 'kg', note: '' },
    ],
  },
];

export default function TodayView() {
  const [exercises, setExercises] = useState<Exercise[]>(initialExercises);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const savedWorkout = window.localStorage.getItem('kilo-current-workout');
    if (savedWorkout) setExercises(JSON.parse(savedWorkout));
  }, []);

  const totalSets = useMemo(
    () =>
      exercises.reduce(
        (count, item) => count + item.sets.filter((set) => set.reps > 0).length,
        0,
      ),
    [exercises],
  );
  const completed = Math.round(
    (totalSets /
      exercises.reduce((count, item) => count + item.sets.length, 0)) *
      100,
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
  function saveWorkout() {
    window.localStorage.setItem(
      'kilo-current-workout',
      JSON.stringify(exercises),
    );
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2500);
  }

  return (
    <>
      <section className='mb-8 flex flex-col gap-6 lg:mb-10 lg:flex-row lg:items-end lg:justify-between'>
        <div>
          <div className='mb-3 flex items-center gap-2'>
            <span className='h-2 w-2 rounded-full bg-[#d6ff3f] shadow-[0_0_14px_#d6ff3f]' />
            <span className='font-mono text-sm uppercase tracking-[.17em] text-[#d6ff3f]'>
              Lunes · Día de piernas
            </span>
          </div>
          <h1 className='font-heading text-5xl leading-[.85] font-semibold uppercase tracking-[-.045em] sm:text-7xl'>
            Haz que cuente<span className='text-[#d6ff3f]'>.</span>
          </h1>
        </div>
        <div className='flex items-center gap-3 rounded-sm border border-white/10 bg-white/[.035] px-4 py-3'>
          <Flame className='size-6 text-[#ff755f]' />
          <div>
            <div className='font-heading text-xl leading-none uppercase'>
              3 semanas
            </div>
            <div className='mt-1 font-mono text-sm uppercase tracking-wider text-white/45'>
              racha actual
            </div>
          </div>
        </div>
      </section>

      <section className='mb-8 grid gap-px overflow-hidden rounded-sm border border-white/10 bg-white/10 sm:grid-cols-3'>
        <Metric
          label='Volumen hoy'
          value='3,897'
          suffix='kg'
          note='+12% vs. último lunes'
          accent
        />
        <Metric
          label='Series completas'
          value={`${totalSets}`}
          suffix=' / 12'
          note={`${completed}% de la rutina`}
        />
        <Metric
          label='Enfoque'
          value='Piernas'
          suffix=''
          note='Fuerza · hipertrofia'
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
                Lunes · Lower 01
              </h2>
            </div>
            <Button
              render={<Link href='/dashboard/rutinas' />}
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
          <button className='mt-3 flex w-full items-center justify-center gap-2 border border-dashed border-white/15 py-3 font-mono text-sm uppercase tracking-[.14em] text-white/45 transition hover:border-[#d6ff3f]/60 hover:text-[#d6ff3f]'>
            <Plus className='size-3' /> Añadir ejercicio
          </button>
          <div className='mt-4 flex flex-col gap-3 sm:flex-row'>
            <Button
              onClick={saveWorkout}
              className='h-12 flex-1 rounded-none bg-[#d6ff3f] font-mono text-sm uppercase tracking-[.15em] text-[#101311] hover:bg-[#edff9c]'
            >
              <Dumbbell />{' '}
              {saved ? 'Entrenamiento guardado' : 'Guardar entrenamiento'}
            </Button>
            <Button
              variant='outline'
              className='h-12 rounded-none border-white/15 bg-transparent font-mono text-sm uppercase tracking-[.15em] text-white/70 hover:bg-white/10 hover:text-white'
            >
              <MoreHorizontal /> Notas del día
            </Button>
          </div>
        </section>

        <aside className='space-y-5 xl:sticky xl:top-8'>
          <Card className='gap-0 rounded-sm border-white/10 bg-[#171b18] py-0 shadow-none'>
            <CardHeader className='border-b border-white/10 px-5 py-4'>
              <CardTitle className='font-mono text-sm uppercase tracking-[.17em] text-white/50'>
                Progreso semanal
              </CardTitle>
            </CardHeader>
            <CardContent className='px-5 py-5'>
              <div className='mb-5 flex items-end justify-between'>
                <span className='font-heading text-5xl leading-none'>
                  2<span className='text-white/30'>/3</span>
                </span>
                <span className='font-mono text-sm uppercase text-[#d6ff3f]'>
                  en ritmo
                </span>
              </div>
              <Progress
                value={67}
                className='[&_[data-slot=progress-indicator]]:bg-[#d6ff3f]'
              />
              <div className='mt-5 grid grid-cols-3 gap-1 font-mono text-sm uppercase'>
                <WeekDay day='L' done />
                <WeekDay day='M' done />
                <WeekDay day='X' />
              </div>
            </CardContent>
          </Card>
          <Card className='rounded-sm border-white/10 bg-[#171b18] py-0 shadow-none'>
            <CardHeader className='flex-row items-center justify-between border-b border-white/10 px-5 py-4'>
              <CardTitle className='font-mono text-sm uppercase tracking-[.17em] text-white/50'>
                Señal de progreso
              </CardTitle>
              <ArrowUpRight className='size-4 text-[#d6ff3f]' />
            </CardHeader>
            <CardContent className='px-5 py-5'>
              <p className='font-heading text-2xl leading-none uppercase'>
                Pantorrillas
              </p>
              <p className='mt-2 text-sm leading-relaxed text-white/55'>
                Mantienes 95 lb y ganas repeticiones. En la próxima sesión,
                intenta 3 × 14.
              </p>
              <div className='mt-5 flex h-16 items-end gap-2 border-b border-white/10 pb-1'>
                {[35, 48, 46, 70, 58, 86, 76].map((value, index) => (
                  <div
                    key={index}
                    style={{ height: `${value}%` }}
                    className={cn(
                      'flex-1',
                      index === 6 ? 'bg-[#d6ff3f]' : 'bg-white/15',
                    )}
                  />
                ))}
              </div>
              <div className='mt-2 flex justify-between font-mono text-sm text-white/35'>
                <span>semana anterior</span>
                <span>hoy</span>
              </div>
            </CardContent>
          </Card>
          <div className='border-l-2 border-[#ff755f] bg-[#ff755f]/[.07] px-4 py-3'>
            <p className='font-mono text-sm uppercase tracking-wider text-[#ff9d8c]'>
              Atención
            </p>
            <p className='mt-1 text-sm text-white/65'>
              Aductores: baja un poco el peso si necesitas asistencia en más de
              2 repeticiones.
            </p>
          </div>
        </aside>
      </div>
    </>
  );
}

function WeekDay({ day, done }: { day: string; done?: boolean }) {
  return (
    <div
      className={cn(
        'flex aspect-square items-center justify-center border',
        done
          ? 'border-[#d6ff3f] bg-[#d6ff3f] text-[#101311]'
          : 'border-white/10 text-white/35',
      )}
    >
      {done ? '✓' : day}
    </div>
  );
}
