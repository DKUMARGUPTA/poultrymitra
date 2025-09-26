'use client';

import { useState, useMemo } from 'react';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, LineChart, Line } from "recharts";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { MarketRate, BirdSize } from '@/services/market-rates.service';
import { format, subDays, parseISO } from 'date-fns';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from './ui/chart';
import { TrendingUp } from 'lucide-react';

interface RateTrendChartModalProps {
  children: React.ReactNode;
  allRates: MarketRate[];
  state: string;
  district: string;
  size: BirdSize;
}

export function RateTrendChartModal({ children, allRates, state, district, size }: RateTrendChartModalProps) {
  const [open, setOpen] = useState(false);

  const chartData = useMemo(() => {
    if (!open) return [];

    const thirtyDaysAgo = subDays(new Date(), 30);
    const relevantRates = allRates
      .filter(rate => 
        rate.state === state && 
        rate.district === district && 
        rate.size === size &&
        parseISO(rate.date) >= thirtyDaysAgo
      )
      .sort((a, b) => a.date.localeCompare(b.date)); // Sort by date ascending

    return relevantRates.map(rate => ({
      date: format(parseISO(rate.date), 'MMM dd'),
      rate: rate.rate
    }));
  }, [open, allRates, state, district, size]);

  const yDomain: [number, number] = useMemo(() => {
    if (chartData.length === 0) return [0, 100];
    const rates = chartData.map(d => d.rate);
    const min = Math.min(...rates);
    const max = Math.max(...rates);
    const padding = (max - min) * 0.1; // 10% padding
    return [Math.floor(min - padding), Math.ceil(max + padding)];
  }, [chartData]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-primary" />
            Price Trend: {size} Birds
          </DialogTitle>
          <DialogDescription>
            30-day market rate trend for {district}, {state}.
          </DialogDescription>
        </DialogHeader>
        <div className="h-80 w-full pt-4">
          {chartData.length > 1 ? (
             <ChartContainer config={{}} className="h-full w-full">
                <ResponsiveContainer>
                    <LineChart
                        data={chartData}
                        margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis
                            dataKey="date"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                            fontSize={12}
                        />
                        <YAxis
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                            tickFormatter={(value) => `₹${value}`}
                            domain={yDomain}
                        />
                        <ChartTooltip
                            cursor={false}
                            content={
                                <ChartTooltipContent
                                    indicator="dot"
                                    formatter={(value) => `₹${Number(value).toFixed(2)}`}
                                />
                            }
                        />
                        <Line
                            dataKey="rate"
                            type="monotone"
                            stroke="hsl(var(--primary))"
                            strokeWidth={2}
                            dot={{
                                fill: "hsl(var(--primary))",
                            }}
                            activeDot={{
                                r: 6,
                            }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </ChartContainer>
          ) : (
            <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">Not enough data to display a trend.</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
