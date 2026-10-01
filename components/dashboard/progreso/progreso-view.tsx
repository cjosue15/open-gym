'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Loader2, TrendingDown, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import Metric from '@/components/dashboard/metric';
import {
  fetchBestStreak,
  fetchProgress,
  PERIODS,
  type Period,
  type ProgressData,
} from '@/lib/supabase/progress';

const WEIGHT_UNITS = ['kg', 'lb'] as const;
type WeightUnit = (typeof WEIGHT_UNITS)[number];
const KG_TO_LB = 2.20462;

function toUnit(kg: number, unit: WeightUnit) {
  return unit === 'kg' ? kg : kg * KG_TO_LB;
}

export default function ProgresoView() {
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [bestStreak, setBestStreak] = useState(0);
  const [period, setPeriod] = useState<Period>('30D');
  const [unit, setUnit] = useState<WeightUnit>('kg');

  useEffect(() => {
    Promise.all([fetchProgress(), fetchBestStreak()])
      .then(([progressData, streak]) => {
        setProgress(progressData);
        setBestStreak(streak);
      })
      .catch((error: unknown) =>
        toast.error('No se pudo cargar tu progreso', {
          description: error instanceof Error ? error.message : undefined,
        }),
      )
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <p className='flex items-center gap-2 font-mono text-sm uppercase tracking-wider text-white/40'>
        <Loader2 className='size-4 animate-spin' /> Cargando tu progreso…
      </p>
    );
  }

  const hasHistory = progress && progress.hasAnyWorkouts;

  if (!progress || !hasHistory) {
    return (
      <div className='flex min-h-[50vh] flex-col items-center justify-center text-center'>
        <p className='font-mono text-sm uppercase tracking-[.17em] text-[#d6ff3f]'>
          Progreso
        </p>
        <h1 className='mt-2 font-heading text-5xl uppercase tracking-tight'>
          Aún no hay datos
        </h1>
        <p className='mt-3 max-w-sm text-sm leading-relaxed text-white/45'>
          Registra entrenamientos en Hoy para empezar a ver tu progreso aquí.
        </p>
        <Button
          render={<Link href='/dashboard' />}
          nativeButton={false}
          className='mt-6 h-11 rounded-none bg-[#d6ff3f] px-6 font-mono text-sm uppercase tracking-wider text-[#101311] hover:bg-[#edff9c]'
        >
          Ir a hoy
        </Button>
      </div>
    );
  }

  const volume = progress.volumeByPeriod[period];
  const maxVolume = Math.max(...volume.map((item) => item.value), 1);
  const totalVolumeKg = progress.totalVolumeKgByPeriod[period];
  const workoutsCount = progress.workoutsCountByPeriod[period];
  const workoutsDelta = progress.workoutsDeltaByPeriod[period];
  const exerciseProgress = progress.exerciseProgressByPeriod[period];

  return (
    <>
      <section className='mb-8 flex flex-col gap-6 lg:mb-10 lg:flex-row lg:items-end lg:justify-between'>
        <div>
          <div className='mb-3 flex items-center gap-2'>
            <span className='h-2 w-2 rounded-full bg-[#d6ff3f] shadow-[0_0_14px_#d6ff3f]' />
            <span className='font-mono text-sm uppercase tracking-[.17em] text-[#d6ff3f]'>
              Progreso
            </span>
          </div>
          <h1 className='font-heading text-5xl leading-[.85] font-semibold uppercase tracking-[-.045em] sm:text-7xl'>
            Tu evolución<span className='text-[#d6ff3f]'>.</span>
          </h1>
        </div>
        <div className='flex flex-col gap-3 sm:flex-row sm:items-center'>
          <div className='flex border border-white/15'>
            {PERIODS.map((item) => (
              <button
                key={item}
                onClick={() => setPeriod(item)}
                className={cn(
                  'h-10 flex-1 px-4 font-mono text-sm uppercase tracking-wider transition sm:flex-none',
                  period === item
                    ? 'bg-[#d6ff3f] text-[#101311]'
                    : 'text-white/50 hover:text-white',
                )}
              >
                {item}
              </button>
            ))}
          </div>
          <div className='flex border border-white/15'>
            {WEIGHT_UNITS.map((item) => (
              <button
                key={item}
                onClick={() => setUnit(item)}
                className={cn(
                  'h-10 flex-1 px-4 font-mono text-sm uppercase tracking-wider transition sm:flex-none',
                  unit === item
                    ? 'bg-[#d6ff3f] text-[#101311]'
                    : 'text-white/50 hover:text-white',
                )}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className='mb-8 grid gap-px overflow-hidden rounded-sm border border-white/10 bg-white/10 sm:grid-cols-3'>
        <Metric
          label='Entrenamientos'
          value={`${workoutsCount}`}
          suffix={`/ ${period}`}
          note={
            workoutsDelta === 0
              ? 'Igual que el período anterior'
              : `${workoutsDelta > 0 ? '+' : ''}${workoutsDelta} vs. período anterior`
          }
          accent
        />
        <Metric
          label='Racha actual'
          value={`${progress.currentStreak}`}
          suffix='días'
          note={`Mejor racha: ${bestStreak} días`}
        />
        <Metric
          label='Volumen total'
          value={Math.round(toUnit(totalVolumeKg, unit)).toLocaleString('es')}
          suffix={unit}
          note={`Suma de reps × peso · ${period}`}
        />
      </section>

      <div className='grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_320px]'>
        <div className='space-y-6'>
          <article className='border border-white/10 bg-[#171b18]'>
            <div className='border-b border-white/10 px-5 py-4'>
              <p className='font-mono text-sm uppercase tracking-[.17em] text-white/50'>
                Volumen por período
              </p>
            </div>
            <div className='flex h-48 items-end gap-3 px-5 py-6'>
              {volume.map((item, index) => (
                <div
                  key={index}
                  className='flex flex-1 flex-col items-center gap-2'
                >
                  <div className='flex h-32 w-full items-end'>
                    <div
                      className={cn(
                        'w-full transition-all',
                        item.value > 0 ? 'bg-[#d6ff3f]/80' : 'bg-white/5',
                      )}
                      style={{
                        height: `${Math.max((item.value / maxVolume) * 100, 4)}%`,
                      }}
                    />
                  </div>
                  <span className='font-mono text-sm text-white/40'>
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </article>

          <article className='border border-white/10 bg-[#171b18]'>
            <div className='border-b border-white/10 px-5 py-4'>
              <p className='font-mono text-sm uppercase tracking-[.17em] text-white/50'>
                Progreso por ejercicio
              </p>
            </div>
            {exerciseProgress.length === 0 ? (
              <p className='px-5 py-6 text-sm text-white/40'>
                Sin series registradas en este período.
              </p>
            ) : (
              <div className='divide-y divide-white/5'>
                {exerciseProgress.map((exercise) => {
                  const max = Math.max(...exercise.trend);
                  const min = Math.min(...exercise.trend);
                  const range = max - min || 1;
                  const positive = (exercise.deltaPct ?? 0) >= 0;
                  return (
                    <div
                      key={exercise.name}
                      className='flex items-center justify-between gap-4 px-5 py-4'
                    >
                      <div className='min-w-0'>
                        <h3 className='font-heading text-xl uppercase tracking-tight'>
                          {exercise.name}
                        </h3>
                        <p className='mt-1 font-mono text-sm text-white/45'>
                          {toUnit(exercise.bestWeightKg, unit).toFixed(1)}{' '}
                          {unit} × {exercise.bestReps}
                        </p>
                      </div>
                      <div className='hidden h-10 w-28 items-end gap-0.5 sm:flex'>
                        {exercise.trend.map((value, index) => (
                          <div
                            key={index}
                            className='flex-1 bg-[#d6ff3f]/60'
                            style={{
                              height: `${((value - min) / range) * 70 + 30}%`,
                            }}
                          />
                        ))}
                      </div>
                      {exercise.deltaPct === null ? (
                        <span className='shrink-0 font-mono text-sm text-white/40'>
                          Nuevo
                        </span>
                      ) : (
                        <span
                          className={cn(
                            'flex shrink-0 items-center gap-1 font-mono text-sm',
                            positive ? 'text-[#d6ff3f]' : 'text-[#ff755f]',
                          )}
                        >
                          {positive ? (
                            <TrendingUp className='size-3.5' />
                          ) : (
                            <TrendingDown className='size-3.5' />
                          )}
                          {positive ? '+' : ''}
                          {exercise.deltaPct}%
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </article>
        </div>

        <aside className='space-y-5 xl:sticky xl:top-8'>
          <article className='border border-white/10 bg-[#171b18]'>
            <div className='border-b border-white/10 px-5 py-4'>
              <p className='font-mono text-sm uppercase tracking-[.17em] text-white/50'>
                Últimos 28 días
              </p>
            </div>
            <div className='grid grid-cols-7 gap-1.5 p-5'>
              {progress.streakDays.map((done, index) => (
                <span
                  key={index}
                  className={cn(
                    'aspect-square w-full rounded-[2px]',
                    done ? 'bg-[#d6ff3f]' : 'bg-white/10',
                  )}
                />
              ))}
            </div>
          </article>
        </aside>
      </div>
    </>
  );
}
