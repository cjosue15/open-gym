'use client';

import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import DayPicker from '@/components/day-picker';
import Modal from '@/components/dashboard/modal';
import {
  createRoutine,
  updateRoutine,
  type Routine,
  type RoutineExercise,
} from '@/lib/supabase/routines';

export default function RoutineModal({
  close,
  routine,
  onSaved,
}: {
  close: () => void;
  routine: Routine | null;
  onSaved: (routine: Routine) => void;
}) {
  const [name, setName] = useState(routine?.name ?? '');
  const [weekday, setWeekday] = useState<number | null>(
    routine?.weekday ?? null,
  );
  const [rows, setRows] = useState<RoutineExercise[]>(
    routine && routine.exercises.length > 0
      ? routine.exercises
      : [{ name: '', sets: 3, reps: 10 }],
  );
  const [saving, setSaving] = useState(false);

  function updateRow(index: number, key: keyof RoutineExercise, value: string) {
    setRows((current) =>
      current.map((row, i) =>
        i !== index
          ? row
          : { ...row, [key]: key === 'name' ? value : Number(value) },
      ),
    );
  }
  function addRow() {
    setRows((current) => [...current, { name: '', sets: 3, reps: 10 }]);
  }
  function removeRow(index: number) {
    setRows((current) => current.filter((_, i) => i !== index));
  }

  const validExercises = rows.filter((row) => row.name.trim().length > 0);
  const canSave =
    name.trim().length > 0 && validExercises.length > 0 && !saving;

  async function handleSave() {
    if (!canSave) return;
    setSaving(true);
    const request = routine
      ? updateRoutine(routine.id, {
          name: name.trim(),
          weekday,
          exercises: validExercises,
        })
      : createRoutine({
          name: name.trim(),
          weekday,
          exercises: validExercises,
        });
    toast.promise(request, {
      loading: routine ? 'Actualizando rutina…' : 'Creando rutina…',
      success: (saved) => {
        onSaved(saved);
        return routine
          ? `Rutina actualizada: ${saved.name}`
          : `Rutina creada: ${saved.name}`;
      },
      error: (error: unknown) =>
        error instanceof Error
          ? error.message
          : routine
            ? 'No se pudo actualizar la rutina'
            : 'No se pudo crear la rutina',
    });
    try {
      await request;
    } catch {
      /* handled by toast.promise */
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal close={close} width='max-w-xl'>
      <div className='max-h-[80vh] overflow-y-auto pr-1'>
        <p className='font-mono text-sm uppercase tracking-[.17em] text-[#d6ff3f]'>
          {routine ? 'Editar plantilla' : 'Nueva plantilla'}
        </p>
        <h2 className='mt-2 font-heading text-4xl uppercase'>
          {routine ? 'Edita tu rutina' : 'Crea una rutina'}
        </h2>

        <label className='mt-6 block font-mono text-sm uppercase tracking-wider text-white/45'>
          Nombre
          <input
            autoFocus
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder='Ej. Lower 02'
            className='mt-2 h-11 w-full border border-white/15 bg-[#101311] px-3 text-sm text-white outline-none focus:border-[#d6ff3f]'
          />
        </label>

        <p className='mt-6 font-mono text-sm uppercase tracking-wider text-white/45'>
          Día
        </p>
        <div className='mt-2'>
          <DayPicker value={weekday} onChange={setWeekday} />
        </div>

        <p className='mt-6 font-mono text-sm uppercase tracking-wider text-white/45'>
          Ejercicios
        </p>
        <div className='mt-2 grid grid-cols-[1fr_56px_56px_28px] gap-2 font-mono text-sm uppercase text-white/30'>
          <span>Ejercicio</span>
          <span className='text-center'>Series</span>
          <span className='text-center'>Reps</span>
          <span />
        </div>
        <div className='mt-1 space-y-2'>
          {rows.map((row, index) => (
            <div
              key={index}
              className='grid grid-cols-[1fr_56px_56px_28px] items-center gap-2'
            >
              <input
                value={row.name}
                onChange={(event) =>
                  updateRow(index, 'name', event.target.value)
                }
                placeholder='Nombre del ejercicio'
                className='h-10 w-full border border-white/15 bg-[#101311] px-2 text-sm text-white outline-none focus:border-[#d6ff3f]'
              />
              <input
                value={row.sets}
                onChange={(event) =>
                  updateRow(index, 'sets', event.target.value)
                }
                type='number'
                min={1}
                className='h-10 w-full border border-white/15 bg-[#101311] px-2 text-center text-sm text-white outline-none focus:border-[#d6ff3f]'
              />
              <input
                value={row.reps}
                onChange={(event) =>
                  updateRow(index, 'reps', event.target.value)
                }
                type='number'
                min={1}
                className='h-10 w-full border border-white/15 bg-[#101311] px-2 text-center text-sm text-white outline-none focus:border-[#d6ff3f]'
              />
              <button
                onClick={() => removeRow(index)}
                disabled={rows.length === 1}
                className='flex size-7 items-center justify-center text-white/30 transition hover:text-[#ff755f] disabled:opacity-20'
                aria-label='Quitar ejercicio'
              >
                <X className='size-4' />
              </button>
            </div>
          ))}
        </div>
        <button
          onClick={addRow}
          className='mt-3 flex items-center gap-1 font-mono text-sm uppercase tracking-wider text-white/40 hover:text-[#d6ff3f]'
        >
          <Plus className='size-3' /> Añadir ejercicio
        </button>

        <div className='mt-6 flex gap-2'>
          <Button
            onClick={handleSave}
            disabled={!canSave}
            className='h-11 flex-1 rounded-none bg-[#d6ff3f] font-mono text-sm uppercase tracking-wider text-[#101311] disabled:opacity-40'
          >
            {saving
              ? 'Guardando…'
              : routine
                ? 'Guardar cambios'
                : 'Crear rutina'}
          </Button>
          <Button
            onClick={close}
            variant='outline'
            disabled={saving}
            className='h-11 rounded-none border-white/15 bg-transparent text-white hover:bg-white/10 hover:text-white'
          >
            Cancelar
          </Button>
        </div>
      </div>
    </Modal>
  );
}
