'use client';

import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { fetchCalendarMonth, type DaySummary } from '@/lib/supabase/calendario';

const WEEKDAY_LETTERS = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
const MONTH_NAMES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

function dayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function isSameDay(a: Date, b: Date): boolean {
  return dayKey(a) === dayKey(b);
}

export default function CalendarioView() {
  const today = useMemo(() => new Date(), []);
  const [cursor, setCursor] = useState(
    () => new Date(today.getFullYear(), today.getMonth(), 1),
  );
  const [selected, setSelected] = useState(today);
  const [loading, setLoading] = useState(true);
  const [summaries, setSummaries] = useState<Record<string, DaySummary>>({});

  useEffect(() => {
    fetchCalendarMonth(cursor.getFullYear(), cursor.getMonth())
      .then(setSummaries)
      .catch((error: unknown) =>
        toast.error('No se pudo cargar tu historial', {
          description: error instanceof Error ? error.message : undefined,
        }),
      )
      .finally(() => setLoading(false));
  }, [cursor]);

  function changeMonth(delta: number) {
    setLoading(true);
    setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + delta, 1));
  }

  const weeks = useMemo(() => {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const firstWeekday = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const cells: (Date | null)[] = [
      ...Array.from({ length: firstWeekday }, () => null),
      ...Array.from(
        { length: daysInMonth },
        (_, index) => new Date(year, month, index + 1),
      ),
    ];
    while (cells.length % 7 !== 0) cells.push(null);

    const rows: (Date | null)[][] = [];
    for (let i = 0; i < cells.length; i += 7) {
      rows.push(cells.slice(i, i + 7));
    }
    return rows;
  }, [cursor]);

  const selectedSummary = summaries[dayKey(selected)];
  const monthWorkoutDays = Object.keys(summaries).length;

  return (
    <>
      <section className='mb-8 flex flex-col gap-6 lg:mb-10 lg:flex-row lg:items-end lg:justify-between'>
        <div>
          <div className='mb-3 flex items-center gap-2'>
            <span className='h-2 w-2 rounded-full bg-[#d6ff3f] shadow-[0_0_14px_#d6ff3f]' />
            <span className='font-mono text-sm uppercase tracking-[.17em] text-[#d6ff3f]'>
              Calendario
            </span>
          </div>
          <h1 className='font-heading text-5xl leading-[.85] font-semibold uppercase tracking-[-.045em] sm:text-7xl'>
            Tu historial<span className='text-[#d6ff3f]'>.</span>
          </h1>
        </div>
        <div className='flex items-center gap-3'>
          <button
            onClick={() => changeMonth(-1)}
            className='flex h-10 w-10 items-center justify-center border border-white/15 text-white/50 transition hover:text-white'
            aria-label='Mes anterior'
          >
            <ChevronLeft className='size-4' />
          </button>
          <p className='w-40 text-center font-mono text-sm uppercase tracking-wider text-white/70'>
            {MONTH_NAMES[cursor.getMonth()]} {cursor.getFullYear()}
          </p>
          <button
            onClick={() => changeMonth(1)}
            className='flex h-10 w-10 items-center justify-center border border-white/15 text-white/50 transition hover:text-white'
            aria-label='Mes siguiente'
          >
            <ChevronRight className='size-4' />
          </button>
        </div>
      </section>

      <div className='grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_320px]'>
        <article className='border border-white/10 bg-[#171b18]'>
          <div className='flex items-center justify-between border-b border-white/10 px-5 py-4'>
            <p className='font-mono text-sm uppercase tracking-[.17em] text-white/50'>
              {loading
                ? 'Cargando…'
                : `${monthWorkoutDays} entrenamientos este mes`}
            </p>
          </div>
          {loading ? (
            <p className='flex items-center gap-2 px-5 py-10 font-mono text-sm uppercase tracking-wider text-white/40'>
              <Loader2 className='size-4 animate-spin' /> Cargando tu historial…
            </p>
          ) : (
            <div className='p-5'>
              <div className='grid grid-cols-7 gap-1.5'>
                {WEEKDAY_LETTERS.map((letter, index) => (
                  <span
                    key={index}
                    className='py-2 text-center font-mono text-sm text-white/30'
                  >
                    {letter}
                  </span>
                ))}
                {weeks.flat().map((date, index) => {
                  if (!date) return <span key={index} />;
                  const hasWorkout = Boolean(summaries[dayKey(date)]);
                  const isToday = isSameDay(date, today);
                  const isSelected = isSameDay(date, selected);
                  return (
                    <button
                      key={index}
                      onClick={() => setSelected(date)}
                      className={cn(
                        'relative flex aspect-square flex-col items-center justify-center gap-1 rounded-[2px] font-mono text-sm transition',
                        isSelected
                          ? 'bg-[#d6ff3f] text-[#101311]'
                          : isToday
                            ? 'border border-[#d6ff3f]/50 text-white'
                            : 'text-white/60 hover:bg-white/5',
                      )}
                    >
                      {date.getDate()}
                      <span
                        className={cn(
                          'h-1 w-1 rounded-full',
                          hasWorkout
                            ? isSelected
                              ? 'bg-[#101311]'
                              : 'bg-[#d6ff3f]'
                            : 'bg-transparent',
                        )}
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </article>

        <aside className='space-y-5 xl:sticky xl:top-8'>
          <article className='border border-white/10 bg-[#171b18]'>
            <div className='border-b border-white/10 px-5 py-4'>
              <p className='font-mono text-sm uppercase tracking-[.17em] text-white/50'>
                {selected.toLocaleDateString('es', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                })}
              </p>
            </div>
            {selectedSummary ? (
              <div className='divide-y divide-white/5'>
                <div className='px-5 py-4'>
                  <h3 className='font-heading text-2xl uppercase tracking-tight'>
                    {selectedSummary.routineName}
                  </h3>
                  <p className='mt-1 font-mono text-sm text-white/45'>
                    {selectedSummary.totalVolumeKg.toLocaleString('es')} kg
                    totales
                  </p>
                </div>
                <div className='divide-y divide-white/5'>
                  {selectedSummary.exercises.map((exercise) => (
                    <div
                      key={exercise.name}
                      className='flex items-center justify-between px-5 py-3'
                    >
                      <div>
                        <p className='font-mono text-sm text-white/80'>
                          {exercise.name}
                        </p>
                        <p className='font-mono text-sm text-white/40'>
                          {exercise.sets} series
                        </p>
                      </div>
                      <span className='font-mono text-sm text-[#d6ff3f]'>
                        {exercise.bestSet}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className='px-5 py-6 text-sm text-white/40'>
                Sin entrenamiento registrado este día.
              </p>
            )}
          </article>
        </aside>
      </div>
    </>
  );
}
