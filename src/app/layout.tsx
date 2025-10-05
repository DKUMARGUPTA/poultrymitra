// src/app/layout.tsx
import type {Metadata} from 'next';
import './globals.css';
import '@/components/animated-logo.css';
import { cn } from '@/lib/utils';
import { Providers } from '@/components/providers';
import { belleza, alegreya } from '@/lib/fonts';
import { AuthProvider } from '@/components/auth-provider';

export const metadata: Metadata = {
  title: 'Poultry Mitra',
  description: 'A Complete Poultry Management Platform',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn("min-h-screen bg-background font-body antialiased", belleza.variable, alegreya.variable)} suppressHydrationWarning>
        <AuthProvider>
            <Providers>
                {children}
            </Providers>
        </AuthProvider>
      </body>
    </html>
  );
}
