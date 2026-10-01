'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import RoutinesView from '@/components/dashboard/routines/routines-view';
import RoutineModal from '@/components/dashboard/routines/routine-modal';
import {
  deleteRoutine,
  fetchRoutines,
  type Routine,
} from '@/lib/supabase/routines';

export default function RoutinesPage() {
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingRoutine, setEditingRoutine] = useState<Routine | null>(null);

  useEffect(() => {
    fetchRoutines()
      .then(setRoutines)
      .catch((error: unknown) =>
        toast.error('No se pudieron cargar las rutinas', {
          description: error instanceof Error ? error.message : undefined,
        }),
      )
      .finally(() => setLoading(false));
  }, []);

  function openCreate() {
    setEditingRoutine(null);
    setShowModal(true);
  }
  function openEdit(routine: Routine) {
    setEditingRoutine(routine);
    setShowModal(true);
  }

  async function removeRoutine(routine: Routine) {
    setDeletingId(routine.id);
    const request = deleteRoutine(routine.id);
    toast.promise(request, {
      loading: `Eliminando "${routine.name}"…`,
      success: () => {
        setRoutines((current) => current.filter((r) => r.id !== routine.id));
        return `Rutina eliminada: ${routine.name}`;
      },
      error: (error: unknown) =>
        error instanceof Error
          ? error.message
          : 'No se pudo eliminar la rutina',
    });
    try {
      await request;
    } catch {
      /* handled by toast.promise */
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <>
      <RoutinesView
        routines={routines}
        loading={loading}
        deletingId={deletingId}
        onCreate={openCreate}
        onEdit={openEdit}
        onDelete={removeRoutine}
      />

      {showModal && (
        <RoutineModal
          close={() => setShowModal(false)}
          routine={editingRoutine}
          onSaved={(routine) => {
            setRoutines((current) =>
              current.some((r) => r.id === routine.id)
                ? current.map((r) => (r.id === routine.id ? routine : r))
                : [...current, routine],
            );
            setShowModal(false);
          }}
        />
      )}
    </>
  );
}
