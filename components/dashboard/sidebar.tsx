'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart3, CalendarDays, Dumbbell, Layers3, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Brand from '@/components/dashboard/brand';

const menu = [
  { label: 'Hoy', icon: Dumbbell, href: '/dashboard' },
  { label: 'Progreso', icon: BarChart3, href: '/dashboard/progreso' },
  { label: 'Calendario', icon: CalendarDays, href: '/dashboard/calendario' },
  { label: 'Rutinas', icon: Layers3, href: '/dashboard/rutinas' },
];

export default function Sidebar({
  open,
  close,
}: {
  open: boolean;
  close: () => void;
}) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 z-40 flex w-[250px] flex-col border-r border-white/10 bg-[#101311] p-5 transition-transform lg:translate-x-0',
        open ? 'translate-x-0' : '-translate-x-full',
      )}
    >
      <div className='flex items-center justify-between'>
        <Brand />
        <Button
          variant='ghost'
          size='icon-sm'
          onClick={close}
          className='lg:hidden'
        >
          <X />
        </Button>
      </div>
      <div className='mt-11'>
        <p className='mb-3 px-3 font-mono text-sm uppercase tracking-[.18em] text-white/30'>
          Tu espacio
        </p>
        {menu.map(({ label, icon: Icon, href }) => {
          const active = pathname === href;
          return (
            <Link
              key={label}
              href={href}
              onClick={close}
              className={cn(
                'mb-1 flex w-full items-center gap-3 px-3 py-2.5 text-left font-mono text-sm uppercase tracking-[.12em] transition',
                active
                  ? 'bg-[#d6ff3f] text-[#101311]'
                  : 'text-white/45 hover:bg-white/5 hover:text-white',
              )}
            >
              <Icon className='size-4' />
              {label}
            </Link>
          );
        })}
      </div>
    </aside>
  );
}
