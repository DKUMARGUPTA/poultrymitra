// src/app/tools/page.tsx
import { FeedCalculator } from '@/components/feed-calculator';
import { LandingPageHeader } from '@/components/landing-page-header';
import { AnimatedLogo } from '@/components/animated-logo';
import Link from 'next/link';

export default function ToolsPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <LandingPageHeader />
      <main className="flex-1 pt-24">
        <div className="container mx-auto px-4 py-12">
            <header className="text-center mb-12">
                <h1 className="text-4xl md:text-5xl font-bold tracking-tighter font-headline">Free Poultry Tools</h1>
                <p className="max-w-2xl mx-auto text-muted-foreground md:text-xl mt-4">
                    Use our free tools to make quick calculations for your farm.
                </p>
            </header>
            
            <div className="max-w-2xl mx-auto">
                <FeedCalculator />
            </div>
        </div>
      </main>
      <footer className="bg-gray-900 text-white">
        <div className="container px-4 md:px-6 py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
                <div className="flex items-center gap-2 mb-4">
                    <AnimatedLogo className="h-8 w-8 text-green-400" />
                    <span className="text-xl font-headline font-bold">Poultry Mitra</span>
                </div>
                <p className="text-sm text-gray-400">India's #1 Poultry Farm Management and Advisory company.</p>
            </div>
            <div>
                <h4 className="font-semibold mb-4">Quick Links</h4>
                <nav className="flex flex-col gap-2 text-sm">
                    <Link href="/#features" className="text-gray-400 hover:text-white">Features</Link>
                    <Link href="/blog" className="text-gray-400 hover:text-white">Blog</Link>
                     <Link href="/tools" className="text-gray-400 hover:text-white">Tools</Link>
                </nav>
            </div>
             <div>
                <h4 className="font-semibold mb-4">Support</h4>
                <nav className="flex flex-col gap-2 text-sm">
                    <Link href="#" className="text-gray-400 hover:text-white">Help</Link>
                    <Link href="#" className="text-gray-400 hover:text-white">Privacy Policy</Link>
                </nav>
            </div>
            <div>
                <h4 className="font-semibold mb-4">Contact</h4>
                <div className="text-sm text-gray-400">
                    <p>+91 9123456789</p>
                    <p>help@poultrymitra.com</p>
                </div>
            </div>
        </div>
        <div className="py-6 border-t border-gray-800">
             <p className="text-center text-xs text-gray-500">&copy; 2024 Poultry Mitra. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
