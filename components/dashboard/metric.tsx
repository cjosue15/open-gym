import { cn } from '@/lib/utils';

export default function Metric({
  label,
  value,
  suffix,
  note,
  accent,
}: {
  label: string;
  value: string;
  suffix: string;
  note: string;
  accent?: boolean;
}) {
  return (
    <div className='bg-[#151916] px-5 py-5'>
      <p className='font-mono text-sm uppercase tracking-[.16em] text-white/40'>
        {label}
      </p>
      <p
        className={cn(
          'mt-2 font-heading text-4xl leading-none',
          accent && 'text-[#d6ff3f]',
        )}
      >
        {value}
        <span className='ml-1 text-xl text-white/40'>{suffix}</span>
      </p>
      <p className='mt-2 font-mono text-sm uppercase tracking-wide text-white/40'>
        {note}
      </p>
    </div>
  );
}
