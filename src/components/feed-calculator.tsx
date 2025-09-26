
'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import {
  calculateFeedCostAndMortality,
  CalculateFeedCostAndMortalityOutput,
} from '@/ai/flows/feed-cost-mortality-calculator';
import { Loader, Calculator, CheckCircle, ArrowRight } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { useAuth } from '@/hooks/use-auth';
import { Batch, getBatchesByFarmer } from '@/services/batches.service';
import { getDailyEntriesForBatch } from '@/services/daily-entries.service';
import { getTransactionsForBatch } from '@/services/transactions.service';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import Link from 'next/link';

export function FeedCalculator() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CalculateFeedCostAndMortalityOutput | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [batchesLoading, setBatchesLoading] = useState(false);

  const [selectedBatchId, setSelectedBatchId] = useState<string>('');
  const [initialChickCount, setInitialChickCount] = useState('');
  const [finalChickCount, setFinalChickCount] = useState('');
  const [feedCostPerBag, setFeedCostPerBag] = useState('');
  const [bagsOfFeedUsed, setBagsOfFeedUsed] = useState('');
  const [averageChickWeight, setAverageChickWeight] = useState('');
  
  useEffect(() => {
    if (user) {
      setBatchesLoading(true);
      const unsubscribe = getBatchesByFarmer(user.uid, (newBatches) => {
        setBatches(newBatches);
        setBatchesLoading(false);
      });
      return () => unsubscribe();
    }
  }, [user]);

  useEffect(() => {
    const autoFillFromBatch = async () => {
        const selectedBatch = batches.find(b => b.id === selectedBatchId);
        if (selectedBatch) {
            setLoading(true);
            const entries = await new Promise<any[]>(res => {
                const unsub = getDailyEntriesForBatch(selectedBatch.id, data => {
                    unsub();
                    res(data);
                });
            });
            const transactions = await new Promise<any[]>(res => {
                const unsub = getTransactionsForBatch(selectedBatch.id, data => {
                    unsub();
                    res(data);
                });
            });

            const totalMortality = entries.reduce((sum, entry) => sum + entry.mortality, 0);
            const birdsSold = transactions.filter(t => t.description.includes('Sale of birds')).reduce((sum, t) => sum + (t.quantitySold || 0), 0);
            const currentBirdCount = selectedBatch.initialBirdCount - totalMortality - birdsSold;

            const totalFeedInKg = entries.reduce((sum, entry) => sum + entry.feedConsumedInKg, 0);
            const totalBags = totalFeedInKg / 50; // Assuming 50kg bags

            const lastWeightEntry = entries[0]?.averageWeightInGrams;
            const avgWeightInKg = lastWeightEntry ? lastWeightEntry / 1000 : 0;

            setInitialChickCount(String(selectedBatch.initialBirdCount));
            setFinalChickCount(String(currentBirdCount));
            setBagsOfFeedUsed(String(Math.round(totalBags * 100) / 100)); // Round to 2 decimal places
            setAverageChickWeight(String(avgWeightInKg.toFixed(2)));

            setLoading(false);
        }
    }
    
    if (selectedBatchId) {
      autoFillFromBatch();
    }
  }, [selectedBatchId, batches]);


  const handleSubmit = async () => {
    const inputs = {
      initialChickCount: parseInt(initialChickCount),
      finalChickCount: parseInt(finalChickCount),
      feedCostPerBag: parseFloat(feedCostPerBag),
      bagsOfFeedUsed: parseFloat(bagsOfFeedUsed),
      averageChickWeight: parseFloat(averageChickWeight),
    };

    for (const key in inputs) {
      const value = inputs[key as keyof typeof inputs];
      if (isNaN(value) || value < 0) {
        toast({
          variant: 'destructive',
          title: 'Invalid Input',
          description: `Please enter a valid, non-negative number for all fields.`,
        });
        return;
      }
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await calculateFeedCostAndMortality(inputs);
      setResult(response);
    } catch (error: any) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to perform calculation. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setLoading(false);
    setInitialChickCount('');
    setFinalChickCount('');
    setFeedCostPerBag('');
    setBagsOfFeedUsed('');
    setAverageChickWeight('');
    setSelectedBatchId('');
  }

  return (
    <Card className="h-full flex flex-col">
        <CardHeader>
          <CardTitle className="font-headline text-2xl flex items-center gap-2">
            <Calculator className="w-6 h-6 text-primary" />
            Feed Cost & Mortality Calculator
          </CardTitle>
          <CardDescription>
            Enter your batch data to calculate key performance indicators.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 flex-1">
            {!result && (
              <div className="space-y-4">
                { user && (
                    <div className="space-y-2">
                        <Label htmlFor="batch">Select Batch (Optional)</Label>
                        <Select onValueChange={setSelectedBatchId} value={selectedBatchId} disabled={batchesLoading}>
                            <SelectTrigger id="batch">
                                <SelectValue placeholder={batchesLoading ? "Loading..." : "Select a batch to pre-fill data"} />
                            </SelectTrigger>
                            <SelectContent>
                                {batches.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">Selecting a batch will automatically fill in the latest data from your records.</p>
                    </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                    <Label htmlFor="initialChickCount">Initial Chick Count</Label>
                    <Input id="initialChickCount" type="number" value={initialChickCount} onChange={(e) => setInitialChickCount(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                    <Label htmlFor="finalChickCount">Final Chick Count</Label>
                    <Input id="finalChickCount" type="number" value={finalChickCount} onChange={(e) => setFinalChickCount(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                    <Label htmlFor="feedCostPerBag">Feed Cost per Bag</Label>
                    <Input id="feedCostPerBag" type="number" value={feedCostPerBag} onChange={(e) => setFeedCostPerBag(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                    <Label htmlFor="bagsOfFeedUsed">Bags of Feed Used</Label>
                    <Input id="bagsOfFeedUsed" type="number" step="any" value={bagsOfFeedUsed} onChange={(e) => setBagsOfFeedUsed(e.target.value)} />
                    </div>
                    <div className="space-y-2 col-span-2">
                    <Label htmlFor="averageChickWeight">Average Chick Weight (kg)</Label>
                    <Input id="averageChickWeight" type="number" step="any" value={averageChickWeight} onChange={(e) => setAverageChickWeight(e.target.value)} />
                    </div>
                </div>
              </div>
            )}
          
          {loading && (
            <div className="flex items-center justify-center space-x-2 text-muted-foreground h-40">
              <Loader className="animate-spin h-5 w-5" />
              <span>Calculating...</span>
            </div>
          )}
          {result && (
            <div>
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertTitle className="font-headline">Calculation Complete</AlertTitle>
                <AlertDescription className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-center">
                      <div>
                          <p className="font-bold text-lg text-foreground">{result.mortalityRate.toFixed(2)}%</p>
                          <p className="text-sm">Mortality Rate</p>
                      </div>
                      <div>
                          <p className="font-bold text-lg text-foreground">₹{result.totalFeedCost.toLocaleString()}</p>
                          <p className="text-sm">Total Feed Cost</p>
                      </div>
                      <div>
                          <p className="font-bold text-lg text-foreground">{result.feedConversionRatio.toFixed(2)}</p>
                          <p className="text-sm">FCR</p>
                      </div>
                      <div>
                          <p className="font-bold text-lg text-foreground">₹{result.costPerKgOfChicken.toLocaleString()}</p>
                          <p className="text-sm">Cost per Kg Chicken</p>
                      </div>
                  </div>
                  <div className='pt-2'>
                      <Badge variant="outline">Disclaimer: Calculations are based on the data provided.</Badge>
                  </div>
                </AlertDescription>
              </Alert>
              {!user && (
                 <Card className="mt-4 bg-primary/10 border-primary/20">
                    <CardHeader>
                        <CardTitle className="font-headline text-lg">Take the Next Step</CardTitle>
                        <CardDescription>Create a free account to save and track these calculations over time for all your batches.</CardDescription>
                    </CardHeader>
                    <CardFooter>
                        <Button asChild>
                            <Link href="/auth?view=signup">Register for Free <ArrowRight className="ml-2" /></Link>
                        </Button>
                    </CardFooter>
                 </Card>
              )}
            </div>
          )}
        </CardContent>
        <CardFooter>
          {result ? (
            <Button type="button" onClick={handleReset} className="w-full">
              Calculate Again
            </Button>
          ) : (
            <Button type="submit" onClick={handleSubmit} disabled={loading} className="w-full">
                {loading ? 'Calculating...' : 'Calculate'}
            </Button>
          )}
        </CardFooter>
    </Card>
  );
}
