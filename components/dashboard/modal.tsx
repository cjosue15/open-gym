import { cn } from '@/lib/utils';

export default function Modal({
  children,
  close,
  width = 'max-w-md',
}: {
  children: React.ReactNode;
  close: () => void;
  width?: string;
}) {
  return (
    <div
      className='fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm'
      onMouseDown={close}
    >
      <div
        onMouseDown={(event) => event.stopPropagation()}
        className={cn(
          'w-full border border-white/15 bg-[#171b18] p-6 shadow-2xl',
          width,
        )}
      >
        {children}
      </div>
    </div>
  );
}
