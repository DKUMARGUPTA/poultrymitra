// src/components/landing-page-header.tsx
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { UserNav } from './user-nav';
import { AnimatedLogo } from './animated-logo';
import { ThemeToggle } from './theme-toggle';
import React, { useEffect, useState } from 'react';
import { useUser } from '@/firebase';

export function LandingPageHeader() {
  const { user, loading } = useUser();
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  // Determine isLoggedIn only after component has mounted and auth state is resolved
  const isLoggedIn = hasMounted && !loading && !!user;
  const isLoggedOut = hasMounted && !loading && !user;

  return (
      <header className="px-4 lg:px-6 h-16 flex items-center shadow-sm fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm">
        <div className="flex items-center">
           <Link href="/" className="flex items-center justify-center" prefetch={false}>
              <AnimatedLogo className="h-8 w-8 text-green-600" />
              <span className="ml-2 text-xl font-headline font-bold">Poultry Mitra</span>
            </Link>
        </div>
        {isLoggedOut && (
           <nav className="ml-auto hidden md:flex gap-4 sm:gap-6 items-center">
                <Link href="/#features" className="text-sm font-medium hover:text-primary" prefetch={false}>Features</Link>
                <Link href="/tools" className="text-sm font-medium hover:text-primary" prefetch={false}>Tools</Link>
                <Link href="/market-rates" className="text-sm font-medium hover:text-primary" prefetch={false}>Market Rates</Link>
                <Link href="/blog" className="text-sm font-medium hover:text-primary" prefetch={false}>Blog</Link>
                <Link href="/#pricing" className="text-sm font-medium hover:text-primary" prefetch={false}>Pricing</Link>
           </nav>
        )}
        <div className="ml-auto flex gap-2 items-center">
          {isLoggedIn ? (
            <UserNav />
          ) : hasMounted && !loading ? (
            <>
              <ThemeToggle />
              <Button asChild variant="ghost">
                <Link href="/auth">Login</Link>
              </Button>
              <Button asChild className="bg-green-600 hover:bg-green-700 text-white">
                <Link href="/auth?view=signup">Register Free</Link>
              </Button>
            </>
          ) : (
            null // Render nothing while loading to prevent flicker
          )}
        </div>
      </header>
  );
}
