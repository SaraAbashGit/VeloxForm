import { Rubik, Heebo } from 'next/font/google';
import type { Metadata } from 'next';
import { Toaster } from '@/components/ui/sonner';
import './globals.css';

// Both fonts include Hebrew glyphs (Inter/Cairo did not, so Hebrew fell back to system fonts)
const rubik = Rubik({ subsets: ['hebrew', 'latin'], weight: ['500', '600', '700'], variable: '--font-rubik' });
const heebo = Heebo({ subsets: ['hebrew', 'latin'], weight: ['400', '500', '600'], variable: '--font-heebo' });

export const metadata: Metadata = {
  title: 'FormAI',
  description: 'פלטפורמת טפסים וחוזים דיגיטליים מבוססת AI',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl">
      <body className={`${rubik.variable} ${heebo.variable} font-sans antialiased bg-surface`}>
        {children}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
