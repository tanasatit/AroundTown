import type { Metadata } from 'next';
import './globals.css';
import SessionProvider from '@/components/providers/SessionProvider';

export const metadata: Metadata = {
  title: 'Mini Mystery - Cash Flow System',
  description: 'Thai Postcard Vending Machine Management',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <SessionProvider>
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}
