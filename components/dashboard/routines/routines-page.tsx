'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import RoutinesView from '@/components/dashboard/routines/routines-view';
import RoutineModal from '@/components/dashboard/routines/routine-modal';
import {
  deleteRoutine,
  fetchRoutines,
  type Routine,
} from '@/lib/supabase/routines';
import { fetchTodaysCompletedWorkout } from '@/lib/supabase/workouts';

export default function RoutinesPage() {
  const router = useRouter();
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [checkingTodayId, setCheckingTodayId] = useState<string | null>(null);
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

  async function openRoutineToday(routine: Routine) {
    setCheckingTodayId(routine.id);
    try {
      const completed = await fetchTodaysCompletedWorkout();
      if (completed) {
        toast.error('Ya completaste tu entrenamiento de hoy', {
          description: 'Edítalo desde Hoy si quieres ajustar las series.',
        });
        return;
      }
      router.push(`/dashboard?routine=${routine.id}`);
    } catch (error: unknown) {
      toast.error('No se pudo verificar tu entrenamiento de hoy', {
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setCheckingTodayId(null);
    }
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
        checkingTodayId={checkingTodayId}
        onCreate={openCreate}
        onEdit={openEdit}
        onDelete={removeRoutine}
        onUseToday={openRoutineToday}
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
