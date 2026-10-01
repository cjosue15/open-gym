'use client';

import { useState } from 'react';
import { Loader2, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { WEEKDAYS } from '@/components/day-picker';
import type { Routine } from '@/lib/supabase/routines';

export default function RoutineCard({
  routine,
  deleting,
  onEdit,
  onDelete,
}: {
  routine: Routine;
  deleting: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [confirming, setConfirming] = useState(false);
  return (
    <article
      className={cn(
        'flex flex-col border border-white/10 bg-[#171b18] transition',
        deleting && 'opacity-50',
      )}
    >
      <div className='flex items-start justify-between gap-3 border-b border-white/10 px-5 py-4'>
        <div>
          <p className='font-mono text-sm uppercase tracking-wider text-[#d6ff3f]'>
            {routine.weekday !== null ? WEEKDAYS[routine.weekday] : 'Sin día'}
          </p>
          <h3 className='mt-1 font-heading text-2xl uppercase leading-none'>
            {routine.name}
          </h3>
        </div>
        <div className='flex shrink-0 items-center gap-2'>
          <Badge
            variant='outline'
            className='border-white/15 bg-transparent font-mono text-sm text-white/45'
          >
            {routine.exercises.length} ejercicios
          </Badge>
          {!confirming && (
            <button
              onClick={() => setConfirming(true)}
              disabled={deleting}
              className='flex size-7 items-center justify-center text-white/30 transition hover:text-[#ff755f] disabled:opacity-40'
              aria-label='Eliminar rutina'
            >
              {deleting ? (
                <Loader2 className='size-4 animate-spin' />
              ) : (
                <Trash2 className='size-4' />
              )}
            </button>
          )}
        </div>
      </div>
      {confirming && (
        <div className='flex items-center justify-between gap-3 border-b border-white/10 bg-[#ff755f]/[.08] px-5 py-3'>
          <p className='font-mono text-sm uppercase tracking-wider text-[#ff9d8c]'>
            ¿Eliminar &quot;{routine.name}&quot;?
          </p>
          <div className='flex shrink-0 gap-2'>
            <button
              onClick={onDelete}
              disabled={deleting}
              className='font-mono text-sm uppercase tracking-wider text-[#ff755f] hover:text-[#ff9d8c] disabled:opacity-40'
            >
              {deleting ? 'Eliminando…' : 'Sí'}
            </button>
            <button
              onClick={() => setConfirming(false)}
              disabled={deleting}
              className='font-mono text-sm uppercase tracking-wider text-white/45 hover:text-white disabled:opacity-40'
            >
              No
            </button>
          </div>
        </div>
      )}
      <div className='flex-1 divide-y divide-white/5'>
        {routine.exercises.map((exercise, index) => (
          <div
            key={index}
            className='flex items-center justify-between px-5 py-2.5'
          >
            <span className='font-mono text-sm text-white/60'>
              {exercise.name}
            </span>
            <span className='font-mono text-sm text-white/30'>
              {exercise.sets} × {exercise.reps}
            </span>
          </div>
        ))}
      </div>
      <div className='flex border-t border-white/10'>
        <button
          onClick={onEdit}
          className='flex-1 py-3 font-mono text-sm uppercase tracking-wider text-white/50 transition hover:bg-white/5 hover:text-white'
        >
          Editar
        </button>
        <button className='flex-1 border-l border-white/10 py-3 font-mono text-sm uppercase tracking-wider text-[#d6ff3f] transition hover:bg-[#d6ff3f]/10'>
          Usar hoy
        </button>
      </div>
    </article>
  );
}
