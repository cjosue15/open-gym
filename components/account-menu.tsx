'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

const configured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
);

export default function AccountMenu() {
  const router = useRouter();
  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    if (!configured) return;
    const supabase = createClient();
    supabase.auth
      .getUser()
      .then(({ data }) => setUserName(data.user?.email?.split('@')[0] ?? null));
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) =>
        setUserName(session?.user.email?.split('@')[0] ?? null),
    );
    return () => listener.subscription.unsubscribe();
  }, []);

  async function signOut() {
    if (!configured) return;
    await createClient().auth.signOut();
    router.push('/');
  }

  if (!userName) return null;
  return (
    <button
      onClick={signOut}
      title='Cerrar sesión'
      className='flex items-center gap-2 font-mono text-sm uppercase tracking-wider text-white/65 hover:text-[#d6ff3f]'
    >
      <span className='flex size-8 items-center justify-center rounded-full bg-[#d6ff3f] font-bold text-[#101311]'>
        {userName.slice(0, 2).toUpperCase()}
      </span>
      <LogOut className='size-3' />
    </button>
  );
}
