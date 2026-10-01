"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Dumbbell, Mail } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

const configured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [checking, setChecking] = useState(configured);

  useEffect(() => {
    if (!configured) return;
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) router.replace("/dashboard");
      else setChecking(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) router.replace("/dashboard");
    });
    return () => listener.subscription.unsubscribe();
  }, [router]);

  async function sendLink(event: React.FormEvent) {
    event.preventDefault();
    if (!configured) return;
    setSending(true);
    const { error } = await createClient().auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/dashboard` },
    });
    setSending(false);
    if (error) toast.error("No se pudo enviar el enlace", { description: error.message });
    else toast.success("Enlace enviado", { description: `Revisa ${email}` });
  }

  if (checking) return null;

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#101311] px-4 text-[#eff0e7]">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center justify-center gap-2">
          <span className="flex size-8 items-center justify-center bg-[#d6ff3f] text-[#101311]"><Dumbbell className="size-4" /></span>
          <span className="font-heading text-3xl leading-none uppercase tracking-tight">Kilo</span>
        </div>
        <div className="border border-white/15 bg-[#171b18] p-6">
          <p className="font-mono text-sm uppercase tracking-[.16em] text-[#d6ff3f]">Tu cuenta</p>
          <h1 className="mt-1 font-heading text-4xl uppercase">Entrar a Kilo</h1>
          {configured ? (
            <form onSubmit={sendLink}>
              <p className="mt-3 text-sm leading-relaxed text-white/55">Te enviaremos un enlace seguro para entrar a tu cuenta.</p>
              <label className="mt-5 block font-mono text-sm uppercase tracking-wider text-white/45">
                Tu email
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="tu@email.com"
                  className="mt-2 h-11 w-full border border-white/15 bg-[#101311] px-3 text-sm text-white outline-none focus:border-[#d6ff3f]"
                />
              </label>
              <Button type="submit" disabled={sending} className="mt-4 h-11 w-full rounded-none bg-[#d6ff3f] font-mono text-sm uppercase tracking-wider text-[#101311]">
                <Mail /> {sending ? "Enviando…" : "Enviar enlace"}
              </Button>
            </form>
          ) : (
            <div className="mt-5 border-l-2 border-[#ff755f] bg-[#ff755f]/10 p-4 text-sm leading-relaxed text-white/65">
              Añade tus variables de Supabase en <code className="text-[#d6ff3f]">.env.local</code> para activar cuentas y sincronización entre dispositivos.
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
