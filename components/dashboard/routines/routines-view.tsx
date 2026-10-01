import { Loader2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Metric from '@/components/dashboard/metric';
import RoutineCard from '@/components/dashboard/routines/routine-card';
import type { Routine } from '@/lib/supabase/routines';

export default function RoutinesView({
  routines,
  loading,
  deletingId,
  onCreate,
  onEdit,
  onDelete,
}: {
  routines: Routine[];
  loading: boolean;
  deletingId: string | null;
  onCreate: () => void;
  onEdit: (routine: Routine) => void;
  onDelete: (routine: Routine) => void;
}) {
  return (
    <>
      <section className='mb-8 flex flex-col gap-6 lg:mb-10 lg:flex-row lg:items-end lg:justify-between'>
        <div>
          <div className='mb-3 flex items-center gap-2'>
            <span className='h-2 w-2 rounded-full bg-[#d6ff3f] shadow-[0_0_14px_#d6ff3f]' />
            <span className='font-mono text-sm uppercase tracking-[.17em] text-[#d6ff3f]'>
              Tu biblioteca
            </span>
          </div>
          <h1 className='font-heading text-5xl leading-[.85] font-semibold uppercase tracking-[-.045em] sm:text-7xl'>
            Tus rutinas<span className='text-[#d6ff3f]'>.</span>
          </h1>
        </div>
        <Button
          onClick={onCreate}
          className='h-11 rounded-none bg-[#d6ff3f] font-mono text-sm uppercase tracking-wider text-[#101311] hover:bg-[#edff9c]'
        >
          <Plus /> Nueva rutina
        </Button>
      </section>

      <section className='mb-8 grid gap-px overflow-hidden rounded-sm border border-white/10 bg-white/10 sm:grid-cols-3'>
        <Metric
          label='Rutinas creadas'
          value={`${routines.length}`}
          suffix=''
          note='Plantillas activas'
          accent
        />
        <Metric
          label='Ejercicios totales'
          value={`${routines.reduce((count, r) => count + r.exercises.length, 0)}`}
          suffix=''
          note='En todas las rutinas'
        />
        <Metric
          label='Más reciente'
          value={routines.at(-1)?.name ?? '—'}
          suffix=''
          note='Última rutina creada'
        />
      </section>

      {loading ? (
        <p className='flex items-center gap-2 font-mono text-sm uppercase tracking-wider text-white/40'>
          <Loader2 className='size-4 animate-spin' /> Cargando rutinas…
        </p>
      ) : (
        <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-3'>
          {routines.map((routine) => (
            <RoutineCard
              key={routine.id}
              routine={routine}
              deleting={deletingId === routine.id}
              onEdit={() => onEdit(routine)}
              onDelete={() => onDelete(routine)}
            />
          ))}
          <button
            onClick={onCreate}
            className='flex min-h-[220px] flex-col items-center justify-center gap-2 border border-dashed border-white/15 text-white/40 transition hover:border-[#d6ff3f]/60 hover:text-[#d6ff3f]'
          >
            <Plus className='size-5' />
            <span className='font-mono text-sm uppercase tracking-wider'>
              Nueva rutina
            </span>
          </button>
        </div>
      )}
    </>
  );
}
