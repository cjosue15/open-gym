import type { Metadata } from 'next';
import { Barlow_Condensed, DM_Mono } from 'next/font/google';
import './globals.css';
import PwaRegister from '@/components/pwa-register';
import { Toaster } from '@/components/ui/sonner';

const heading = Barlow_Condensed({
  variable: '--font-heading',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});
const mono = DM_Mono({
  variable: '--font-mono',
  subsets: ['latin'],
  weight: ['400', '500'],
});

export const metadata: Metadata = {
  title: 'Kilo — entrenamiento con intención',
  description: 'Registra tus entrenamientos y mira tu progreso.',
  applicationName: 'Kilo',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Kilo',
  },
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang='es' className={`${heading.variable} ${mono.variable} h-full`}>
      <body className='min-h-full'>
        <PwaRegister />
        {children}
        <Toaster />
      </body>
    </html>
  );
}
