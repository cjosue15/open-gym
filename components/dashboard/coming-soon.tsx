export default function ComingSoon({ label }: { label: string }) {
  return (
    <div className='flex min-h-[50vh] flex-col items-center justify-center text-center'>
      <p className='font-mono text-sm uppercase tracking-[.17em] text-[#d6ff3f]'>
        Próximamente
      </p>
      <h1 className='mt-2 font-heading text-5xl uppercase tracking-tight'>
        {label}
      </h1>
      <p className='mt-3 max-w-sm text-sm leading-relaxed text-white/45'>
        Esta sección aún no está construida.
      </p>
    </div>
  );
}
