import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin', 'arabic'] });

export const metadata: Metadata = {
  title: 'MedAI Academy | أكاديمية الذكاء الاصطناعي الطبي',
  description: 'منصة تعليمية طبية متقدمة تدعم الذكاء الاصطناعي، المحاكيات السريرية، واختبارات تفاعلية',
  keywords: ['طبية', 'ذكاء اصطناعي', 'تعليم', 'MedAI', 'أكاديمية', 'محاكيات', 'اختبارات'],
  authors: [{ name: 'Archerhood', email: 'archerh456@gmail.com' }],
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
  openGraph: {
    type: 'website',
    locale: 'ar_EG',
    url: 'https://medai-academy.vercel.app',
    siteName: 'MedAI Academy',
    title: 'MedAI Academy | أكاديمية الذكاء الاصطناعي الطبي',
    description: 'منصة تعليمية طبية متقدمة تدعم الذكاء الاصطناعي',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MedAI Academy',
    description: 'منصة تعليمية طبية متقدمة',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
