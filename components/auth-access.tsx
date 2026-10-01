"use client";

import { useEffect, useState } from "react";
import { LogIn, LogOut, Mail, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

const configured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);

export default function AuthAccess() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sent" | "error">("idle");
  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    if (!configured) return;
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setUserName(data.user?.email?.split("@")[0] ?? null));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => setUserName(session?.user.email?.split("@")[0] ?? null));
    return () => listener.subscription.unsubscribe();
  }, []);

  async function sendLink(event: React.FormEvent) {
    event.preventDefault();
    if (!configured) return;
    const { error } = await createClient().auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin } });
    setStatus(error ? "error" : "sent");
  }
  async function signOut() { if (configured) await createClient().auth.signOut(); }

  if (userName) return <button onClick={signOut} title="Cerrar sesión" className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-white/65 hover:text-[#d6ff3f]"><span className="flex size-8 items-center justify-center rounded-full bg-[#d6ff3f] font-bold text-[#101311]">{userName.slice(0, 2).toUpperCase()}</span><LogOut className="size-3" /></button>;
  return <><button onClick={() => setOpen(true)} className="flex items-center gap-2 border border-white/15 px-3 py-2 font-mono text-[10px] uppercase tracking-wider text-white/65 transition hover:border-[#d6ff3f] hover:text-[#d6ff3f]"><LogIn className="size-3" /> {configured ? "Entrar" : "Modo demo"}</button>{open && <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4" onMouseDown={() => setOpen(false)}><form onSubmit={sendLink} onMouseDown={(event) => event.stopPropagation()} className="w-full max-w-sm border border-white/15 bg-[#171b18] p-6"><div className="flex items-start justify-between"><div><p className="font-mono text-[10px] uppercase tracking-[.16em] text-[#d6ff3f]">Tu cuenta</p><h2 className="mt-1 font-heading text-4xl uppercase">Entrar a Kilo</h2></div><button type="button" onClick={() => setOpen(false)}><X className="size-4 text-white/50" /></button></div>{configured ? <><p className="mt-3 text-sm leading-relaxed text-white/55">Te enviaremos un enlace seguro para entrar o crear tu cuenta.</p><label className="mt-5 block font-mono text-[10px] uppercase tracking-wider text-white/45">Tu email<input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="tu@email.com" className="mt-2 h-11 w-full border border-white/15 bg-[#101311] px-3 text-sm text-white outline-none focus:border-[#d6ff3f]" /></label><Button type="submit" className="mt-4 h-11 w-full rounded-none bg-[#d6ff3f] font-mono text-[10px] uppercase tracking-wider text-[#101311]">{status === "sent" ? "Enlace enviado" : <><Mail /> Enviar enlace</>}</Button>{status === "error" && <p className="mt-3 text-xs text-[#ff9d8c]">No se pudo enviar el enlace. Revisa la configuración de Supabase.</p>}</> : <div className="mt-5 border-l-2 border-[#ff755f] bg-[#ff755f]/10 p-4 text-sm leading-relaxed text-white/65">Añade tus variables de Supabase en <code className="text-[#d6ff3f]">.env.local</code> para activar cuentas y sincronización entre dispositivos.</div>}</form></div>}</>;
}
