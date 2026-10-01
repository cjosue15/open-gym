import { Dumbbell } from 'lucide-react';

export default function Brand() {
  return (
    <div className='flex items-center gap-2'>
      <span className='flex size-8 items-center justify-center bg-[#d6ff3f] text-[#101311]'>
        <Dumbbell className='size-4' />
      </span>
      <span className='font-heading text-3xl leading-none uppercase tracking-tight'>
        Kilo
      </span>
    </div>
  );
}
