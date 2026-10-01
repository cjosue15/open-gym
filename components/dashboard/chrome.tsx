'use client';

import { useState } from 'react';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AccountMenu from '@/components/account-menu';
import Brand from '@/components/dashboard/brand';
import Sidebar from '@/components/dashboard/sidebar';

export default function DashboardChrome({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sideOpen, setSideOpen] = useState(false);

  return (
    <main className='min-h-screen bg-[#101311] text-[#eff0e7] selection:bg-[#d6ff3f] selection:text-[#101311]'>
      <div className='grain pointer-events-none fixed inset-0 opacity-30' />
      <header className='relative z-20 flex h-16 items-center justify-between border-b border-white/10 px-4 lg:hidden'>
        <Brand />
        <Button
          variant='ghost'
          size='icon'
          className='text-[#d6ff3f]'
          onClick={() => setSideOpen(true)}
        >
          <Menu />
        </Button>
      </header>
      <Sidebar open={sideOpen} close={() => setSideOpen(false)} />

      <section className='relative z-10 min-h-screen lg:ml-[250px]'>
        <header className='hidden h-20 items-center justify-between border-b border-white/10 px-8 lg:flex'>
          <div className='font-mono text-sm uppercase tracking-[.18em] text-white/45'>
            Semana 39 · 2026
          </div>
          <div className='flex items-center gap-4'>
            <AccountMenu />
          </div>
        </header>

        <div className='mx-auto max-w-[1480px] px-4 py-7 sm:px-7 lg:px-10 lg:py-10'>
          {children}
        </div>
      </section>
    </main>
  );
}
