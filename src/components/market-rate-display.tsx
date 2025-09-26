'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { MarketRate, getMarketRates, BirdSize, BirdSizes, deleteMarketRate } from '@/services/market-rates.service';
import { format, parseISO, subDays } from 'date-fns';
import { TrendingUp, MapPin, Edit, Trash2, Calendar as CalendarIcon, Plus, ArrowUp, ArrowDown, Minus, Clock, Bot, ShieldCheck } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { useAuth } from '@/hooks/use-auth';
import { Button } from './ui/button';
import { EditMarketRateModal } from './edit-market-rate-modal';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { cn } from '@/lib/utils';
import { Calendar } from './ui/calendar';
import { AddMarketRateModal } from './add-market-rate-modal';
import { RateTrendChartModal } from './rate-trend-chart-modal';

type GroupedRates = {
  [state: string]: {
    [district: string]: {
      rates: MarketRate[];
    }
  }
};

const toTitleCase = (str: string) => {
  if (!str) return '';
  return str.replace(
    /\w\S*/g,
    (txt) => txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase()
  );
};

const sizeOrder: BirdSize[] = ['Small', 'Medium', 'Big'];

export function MarketRateDisplay({ initialRates }: { initialRates?: MarketRate[] }) {
  const [allMarketRates, setAllMarketRates] = useState<MarketRate[]>(initialRates || []);
  const [ratesLoading, setRatesLoading] = useState(!initialRates);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const { userProfile } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    // If we have initial rates, we don't need to fetch, but we do need to set the date.
    if (initialRates) {
        if (initialRates.length > 0 && !selectedDate) {
             const mostRecentDate = initialRates.reduce((latest, rate) => {
                return rate.date > latest ? rate.date : latest;
            }, initialRates[0].date);
            setSelectedDate(parseISO(mostRecentDate));
        }
        return;
    }

    // Otherwise, subscribe to live updates.
    const unsubscribe = getMarketRates((rates) => {
      setAllMarketRates(rates);
      if (rates.length > 0 && !selectedDate) {
        const mostRecentDate = rates.reduce((latest, rate) => {
            return rate.date > latest ? rate.date : latest;
        }, rates[0].date);
        setSelectedDate(parseISO(mostRecentDate));
      }
      setRatesLoading(false);
    });
    return () => unsubscribe();
  }, [selectedDate, initialRates]);
  
  const handleRateUpdated = (updatedRate: MarketRate) => {
    // The listener will automatically handle the update.
  };

  const handleRateDeleted = async (rateId: string, rateDetails: string) => {
    try {
      await deleteMarketRate(rateId);
      toast({
        title: "Rate Deleted",
        description: `The rate for ${rateDetails} has been removed.`,
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Deletion Failed",
        description: error.message,
      });
    }
  }
  
  const availableDates = useMemo(() => {
    const uniqueDates = [...new Set(allMarketRates.map(rate => rate.date))];
    return uniqueDates.sort((a,b) => b.localeCompare(a));
  }, [allMarketRates]);

  const { currentDayRates, previousDayRates } = useMemo(() => {
    if (!selectedDate) return { currentDayRates: [], previousDayRates: [] };
    
    const formattedSelectedDate = format(selectedDate, 'yyyy-MM-dd');
    const formattedPreviousDate = format(subDays(selectedDate, 1), 'yyyy-MM-dd');

    const current = allMarketRates.filter(rate => rate.date === formattedSelectedDate);
    const previous = allMarketRates.filter(rate => rate.date === formattedPreviousDate);
    
    return { currentDayRates: current, previousDayRates: previous };
  }, [selectedDate, allMarketRates]);

  const groupedRatesByStateAndDistrict = useMemo(() => {
      return currentDayRates.reduce((acc, rate) => {
        const state = toTitleCase(rate.state);
        const district = toTitleCase(rate.district);

        if (!acc[state]) acc[state] = {};
        if (!acc[state][district]) acc[state][district] = { rates: [] };

        acc[state][district].rates.push(rate);
        return acc;
    }, {} as GroupedRates);
  }, [currentDayRates]);
  
  const getPreviousRate = (state: string, district: string, size: BirdSize) => {
    return previousDayRates.find(r => toTitleCase(r.state) === state && toTitleCase(r.district) === district && r.size === size);
  }

  const isAdmin = userProfile?.role === 'admin';
  const canAddRates = isAdmin || (userProfile?.ratePermissions?.length ?? 0) > 0;

  const RateIndicator = ({ current, previous }: { current: number, previous: number | undefined }) => {
    if (previous === undefined || current === previous) {
        return <Minus className="h-3 w-3 text-muted-foreground" />;
    }
    if (current > previous) {
        return <ArrowUp className="h-3 w-3 text-green-500" />;
    }
    return <ArrowDown className="h-3 w-3 text-red-500" />;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-primary" />
            <CardTitle className="font-headline">Market Rates</CardTitle>
        </div>
        <CardDescription>Latest broiler rates. Click any rate to see its historical trend. Rates with a shield are admin-verified.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap items-center gap-2 p-4 mb-4 bg-muted/50 rounded-lg">
            <div className="flex-wrap flex gap-2">
              {availableDates.slice(0, 7).map(dateStr => (
                <Button 
                  key={dateStr}
                  variant={format(selectedDate || new Date(), 'yyyy-MM-dd') === dateStr ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedDate(parseISO(dateStr))}
                >
                  {format(parseISO(dateStr), 'MMM dd, yyyy')}
                </Button>
              ))}
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  size="sm"
                  className={cn(
                    "w-auto justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
        </div>
        {ratesLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="p-4 border rounded-lg">
                <Skeleton className="h-6 w-1/3 mb-2" />
                <div className="flex justify-between">
                  <Skeleton className="h-5 w-1/4" />
                  <Skeleton className="h-5 w-1/4" />
                </div>
              </div>
            ))}
          </div>
        ) : Object.keys(groupedRatesByStateAndDistrict).length === 0 ? (
          <div className="text-center py-12 flex flex-col items-center gap-4">
              <Clock className="w-12 h-12 text-muted-foreground" />
              <div>
                  <p className="font-semibold">Rates Not Updated Yet</p>
                  <p className="text-muted-foreground text-sm">Please check back later for the latest updates for this date.</p>
              </div>
          </div>
        ) : (
          <Accordion type="multiple" className="w-full space-y-4">
            {Object.entries(groupedRatesByStateAndDistrict).sort(([stateA], [stateB]) => stateA.localeCompare(stateB)).map(([state, districts]) => (
              <AccordionItem value={state} key={state} className="border rounded-lg">
                <AccordionTrigger className="p-4 hover:no-underline">
                  <h3 className="font-bold text-lg flex items-center gap-2"><MapPin className="w-5 h-5 text-muted-foreground"/>{state}</h3>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="p-4 pt-0 space-y-4">
                    {Object.entries(districts).sort(([distA], [distB]) => distA.localeCompare(distB)).map(([district, data]) => (
                       <div key={district} className="p-4 border rounded-md bg-background">
                            <div className="flex justify-between items-center mb-2">
                                <h4 className="font-semibold">{district}</h4>
                            </div>
                            <div className="grid grid-cols-3 gap-2 text-center">
                                {sizeOrder.map(size => {
                                  const rate = data.rates.find(r => r.size === size);
                                  const prevRate = getPreviousRate(state, district, size);
                                  const isAiSourced = rate?.source?.includes('-ai');
                                  return (
                                    <div key={size} className="p-2 rounded-md bg-muted/50 relative group">
                                      <p className="text-xs font-medium flex items-center justify-center gap-1">
                                        {canAddRates && isAiSourced && <Bot className="w-3 h-3 text-blue-500" title="Sourced by AI" />}
                                        {rate?.addedBy === 'admin' && <ShieldCheck className="w-3 h-3 text-green-600" title="Admin Verified" />}
                                        {size}
                                      </p>
                                      {rate ? (
                                        <RateTrendChartModal
                                            allRates={allMarketRates}
                                            state={rate.state}
                                            district={rate.district}
                                            size={rate.size}
                                        >
                                            <div className="cursor-pointer">
                                                <div className="flex items-center justify-center gap-1">
                                                <p className="font-bold text-primary text-lg">₹{rate.rate.toFixed(2)}</p>
                                                <RateIndicator current={rate.rate} previous={prevRate?.rate} />
                                                </div>
                                                {canAddRates && (
                                                <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <EditMarketRateModal rate={rate} onRateUpdated={handleRateUpdated}>
                                                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => e.stopPropagation()}>
                                                        <Edit className="h-3 w-3" />
                                                    </Button>
                                                    </EditMarketRateModal>
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive/70 hover:text-destructive" onClick={(e) => e.stopPropagation()}>
                                                            <Trash2 className="h-3 w-3" />
                                                        </Button>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                            This will permanently delete the rate of <strong>₹{rate.rate}</strong> for <strong>{size}</strong> birds in <strong>{district}</strong>. This cannot be undone.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                            <AlertDialogAction onClick={() => handleRateDeleted(rate.id, `${size} birds in ${district}`)} variant="destructive">Delete</AlertDialogAction>
                                                        </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                </div>
                                                )}
                                            </div>
                                        </RateTrendChartModal>
                                      ) : (
                                        <div className="h-[28px] flex items-center justify-center">
                                            {canAddRates ? (
                                                <AddMarketRateModal
                                                    onRateAdded={handleRateUpdated}
                                                    initialData={{ 
                                                        date: format(selectedDate!, 'yyyy-MM-dd'),
                                                        state: state,
                                                        district: district,
                                                        size: size
                                                    }}
                                                >
                                                    <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Plus className="h-4 w-4 text-primary" />
                                                    </Button>
                                                </AddMarketRateModal>
                                            ) : (
                                                <p className="font-bold text-muted-foreground text-lg">-</p>
                                            )}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                            </div>
                       </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </CardContent>
    </Card>
  );
}
