'use client';

import { cn } from '@/lib/utils';

export const WEEKDAYS = [
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
  'Domingo',
];

export default function DayPicker({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (weekday: number) => void;
}) {
  return (
    <div className='grid grid-cols-7 gap-1'>
      {WEEKDAYS.map((day, index) => (
        <button
          key={day}
          type='button'
          onClick={() => onChange(index)}
          title={day}
          className={cn(
            'flex h-10 items-center justify-center border font-mono text-sm uppercase transition',
            value === index
              ? 'border-[#d6ff3f] bg-[#d6ff3f] text-[#101311]'
              : 'border-white/15 text-white/45 hover:border-white/30 hover:text-white',
          )}
        >
          {day[0]}
        </button>
      ))}
    </div>
  );
}
