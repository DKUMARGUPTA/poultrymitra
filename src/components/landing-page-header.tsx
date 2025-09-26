// src/components/landing-page-header.tsx
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { Skeleton } from './ui/skeleton';
import { UserNav } from './user-nav';
import { SidebarTrigger } from './ui/sidebar';
import { AnimatedLogo } from './animated-logo';
import { ThemeToggle } from './theme-toggle';

export function LandingPageHeader() {
  const { user, loading, userProfile } = useAuth();

  const navItems = {
    farmer: [
        { href: "/dashboard", label: "Dashboard" },
        { href: "/batches", label: "Batches" },
        { href: "/orders", label: "Orders" },
        { href: "/ledger", label: "My Ledger" },
    ],
    dealer: [
        { href: "/dashboard", label: "Dashboard" },
        { href: "/farmers", label: "Farmers" },
        { href: "/inventory", label: "Inventory" },
        { href: "/suppliers", label: "Suppliers" },
        { href: "/orders", label: "Orders" },
    ],
    admin: [
        { href: "/admin", label: "Admin Panel" },
        { href: "/users", label: "Manage Users" },
        { href: "/transactions", label: "All Transactions" },
        { href: "/market-rates", label: "Market Rates" },
        { href: "/admin/blog", label: "Blog" },
    ],
  };

  const getNavItems = () => {
    if (!userProfile) return [];
    switch (userProfile.role) {
      case 'farmer': return navItems.farmer;
      case 'dealer': return navItems.dealer;
      case 'admin': return navItems.admin;
      default: return [];
    }
  }

  return (
      <header className="px-4 lg:px-6 h-16 flex items-center shadow-sm fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm">
        <div className="flex items-center">
          {user && <SidebarTrigger className="md:hidden mr-2" />}
          <Link href="/" className="flex items-center justify-center" prefetch={false}>
              <AnimatedLogo className="h-8 w-8 text-green-600" />
              <span className="ml-2 text-xl font-headline font-bold">Poultry Mitra</span>
            </Link>
        </div>
        <nav className="ml-auto hidden md:flex gap-4 sm:gap-6 items-center">
          {user ? (
              getNavItems().map(item => (
                  <Link key={item.href} href={item.href} className="text-sm font-medium hover:text-primary" prefetch={false}>
                      {item.label}
                  </Link>
              ))
          ) : (
              <>
                  <Link href="/#features" className="text-sm font-medium hover:text-primary" prefetch={false}>
                  Features
                  </Link>
                   <Link href="/tools" className="text-sm font-medium hover:text-primary" prefetch={false}>
                  Tools
                  </Link>
                   <Link href="/market-rates" className="text-sm font-medium hover:text-primary" prefetch={false}>
                  Market Rates
                  </Link>
                  <Link href="/blog" className="text-sm font-medium hover:text-primary" prefetch={false}>
                  Blog
                  </Link>
                  <Link href="/#pricing" className="text-sm font-medium hover:text-primary" prefetch={false}>
                  Pricing
                  </Link>
              </>
          )}
        </nav>
        <div className="ml-auto flex gap-2 items-center">
          {loading ? (
            <Skeleton className="h-9 w-9 rounded-full" />
          ) : user ? (
            <UserNav />
          ) : (
            <>
              <ThemeToggle />
              <Button asChild variant="ghost">
                <Link href="/auth">Login</Link>
              </Button>
              <Button asChild className="bg-green-600 hover:bg-green-700 text-white">
                <Link href="/auth?view=signup">Register Free</Link>
              </Button>
            </>
          )}
        </div>
      </header>
  );
}
