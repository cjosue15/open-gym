import { ChevronDown, ChevronRight, CircleHelp, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export type SetEntry = {
  id: number;
  reps: number;
  weight: number;
  unit: 'kg' | 'lb';
  note: string;
};
export type Exercise = {
  id: number;
  name: string;
  cue: string;
  sets: SetEntry[];
  open?: boolean;
};

export default function ExerciseCard({
  exercise,
  index,
  toggle,
  update,
  add,
}: {
  exercise: Exercise;
  index: number;
  toggle: () => void;
  update: (
    exerciseId: number,
    setId: number,
    key: keyof SetEntry,
    value: string | number,
  ) => void;
  add: () => void;
}) {
  const done = exercise.sets.filter((set) => set.reps > 0).length;
  return (
    <article className='overflow-hidden border border-white/10 bg-[#171b18]'>
      <button
        onClick={toggle}
        className='flex w-full items-center gap-4 px-4 py-4 text-left transition hover:bg-white/[.025] sm:px-5'
      >
        <span className='font-mono text-sm text-[#d6ff3f]'>0{index + 1}</span>
        <div className='min-w-0 flex-1'>
          <h3 className='font-heading text-2xl leading-none uppercase tracking-tight'>
            {exercise.name}
          </h3>
          <p className='mt-1 font-mono text-sm uppercase tracking-wider text-white/35'>
            {exercise.cue}
          </p>
        </div>
        <Badge
          variant='outline'
          className='hidden border-white/15 bg-transparent font-mono text-sm text-white/45 sm:inline-flex'
        >
          {done}/{exercise.sets.length}
        </Badge>
        {exercise.open ? (
          <ChevronDown className='size-4 text-white/50' />
        ) : (
          <ChevronRight className='size-4 text-white/50' />
        )}
      </button>
      {exercise.open && (
        <div className='border-t border-white/10 px-4 pb-4 pt-3 sm:px-5'>
          <div className='grid grid-cols-[32px_1fr_1fr_28px] gap-2 border-b border-white/10 pb-2 font-mono text-sm uppercase tracking-wider text-white/35 sm:grid-cols-[42px_100px_100px_1fr]'>
            <span>Serie</span>
            <span>Reps</span>
            <span>Peso</span>
            <span className='hidden sm:block'>Nota</span>
          </div>
          {exercise.sets.map((set, itemIndex) => (
            <div
              key={set.id}
              className='grid grid-cols-[32px_1fr_1fr_28px] items-center gap-2 border-b border-white/5 py-2.5 sm:grid-cols-[42px_100px_100px_1fr]'
            >
              <span className='font-mono text-sm text-white/55'>
                {itemIndex + 1}
              </span>
              <input
                aria-label={`Repeticiones serie ${itemIndex + 1}`}
                value={set.reps || ''}
                onChange={(event) =>
                  update(exercise.id, set.id, 'reps', event.target.value)
                }
                type='number'
                placeholder='—'
                className='h-8 w-full border border-white/10 bg-[#101311] px-2 font-mono text-sm text-white outline-none focus:border-[#d6ff3f]'
              />
              <div className='flex h-8 border border-white/10 bg-[#101311] focus-within:border-[#d6ff3f]'>
                <input
                  aria-label={`Peso serie ${itemIndex + 1}`}
                  value={set.weight || ''}
                  onChange={(event) =>
                    update(exercise.id, set.id, 'weight', event.target.value)
                  }
                  type='number'
                  placeholder='—'
                  className='min-w-0 flex-1 bg-transparent px-2 font-mono text-sm text-white outline-none'
                />
                <button
                  onClick={() =>
                    update(
                      exercise.id,
                      set.id,
                      'unit',
                      set.unit === 'kg' ? 'lb' : 'kg',
                    )
                  }
                  className='border-l border-white/10 px-1.5 font-mono text-sm text-[#d6ff3f]'
                >
                  {set.unit}
                </button>
              </div>
              <input
                aria-label={`Nota serie ${itemIndex + 1}`}
                value={set.note}
                onChange={(event) =>
                  update(exercise.id, set.id, 'note', event.target.value)
                }
                placeholder='Añadir nota'
                className='hidden h-8 w-full bg-transparent px-2 text-sm text-white/60 outline-none placeholder:text-white/20 sm:block'
              />
              <CircleHelp className='size-3 text-white/20 sm:hidden' />
            </div>
          ))}
          <button
            onClick={add}
            className='mt-3 flex items-center gap-1 font-mono text-sm uppercase tracking-wider text-white/40 hover:text-[#d6ff3f]'
          >
            <Plus className='size-3' /> Añadir serie
          </button>
        </div>
      )}
    </article>
  );
}
