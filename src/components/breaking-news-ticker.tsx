// src/components/breaking-news-ticker.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Megaphone, ArrowRight } from 'lucide-react';
import { getLatestMarketRates, MarketRate } from '@/services/market-rates.service';
import { useAuth } from '@/hooks/use-auth';
import { format, parseISO } from 'date-fns';
import { useFirestore } from '@/firebase/provider';

export function BreakingNewsTicker() {
  const { user } = useAuth();
  const db = useFirestore();
  const [latestRates, setLatestRates] = useState<MarketRate[]>([]);

  useEffect(() => {
    if (db) {
      getLatestMarketRates(db, 5).then(setLatestRates);
    }
  }, [db]);

  if (latestRates.length === 0) {
    return null; // Don't render anything if there are no rates
  }

  const TickerContent = () => (
    <>
      {latestRates.map((rate, index) => (
        <span key={index} className="flex items-center flex-shrink-0 mx-4">
          <Megaphone className="mr-2 h-5 w-5 flex-shrink-0" />
          <p className="text-base font-semibold">
            <span className="text-primary-foreground/70">({format(parseISO(rate.date), 'MMM dd')})</span> {rate.district}: <span className="font-bold">₹{rate.rate.toFixed(2)}/kg</span> ({rate.size})
          </p>
        </span>
      ))}
    </>
  );

  return (
    <div className="bg-gradient-to-r from-primary to-green-600 text-primary-foreground shadow-md">
      <div className="container mx-auto px-4">
        <div className="relative flex h-10 items-center overflow-hidden">
          <div className="flex animate-ticker items-center whitespace-nowrap">
            <TickerContent />
          </div>
          {/* Duplicate for seamless loop */}
           <div className="absolute top-0 flex animate-ticker2 items-center whitespace-nowrap pt-2">
            <TickerContent />
          </div>
        </div>
      </div>
    </div>
  );
}
