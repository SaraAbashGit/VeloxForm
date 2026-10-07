import { Inter, Cairo } from 'next/font/google';
import type { Metadata } from 'next';
import { Toaster } from '@/components/ui/sonner';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const cairo = Cairo({ subsets: ['arabic', 'latin'], variable: '--font-cairo' });

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
      <body className={`${inter.variable} ${cairo.variable} font-sans antialiased bg-surface`}>
        {children}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
