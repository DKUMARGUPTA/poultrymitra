'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { dealerAiAdvisory, DealerAiAdvisoryOutput } from '@/ai/flows/dealer-ai-advisory';
import { Loader, Bot, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Badge } from './ui/badge';
import { useAuth } from '@/hooks/use-auth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

export function StockAdvisoryModal({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DealerAiAdvisoryOutput | null>(null);
  const { toast } = useToast();
  const { user, userProfile } = useAuth();

  const [businessSummary, setBusinessSummary] = useState('');
  const [marketTrends, setMarketTrends] = useState('');
  const [language, setLanguage] = useState<'English' | 'Hindi'>('English');
  const isPremium = !!userProfile?.isPremium;

  const handleSubmit = async () => {
    if (!user) {
        toast({ variant: 'destructive', title: 'Not Authenticated', description: 'You must be logged in to use this feature.' });
        return;
    }
    if (!isPremium) {
      toast({ variant: 'destructive', title: 'Premium Feature', description: 'Please upgrade to use the AI Stock Advisory.' });
      return;
    }
    if (!businessSummary.trim() || !marketTrends.trim()) {
      toast({
        variant: 'destructive',
        title: 'All Fields Required',
        description: 'Please fill out all the fields to get an accurate advisory.',
      });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await dealerAiAdvisory({
        dealerId: user.uid,
        businessSummary,
        marketTrends,
        language,
      });
      setResult(response);
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to get an advisory. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      // Reset state on close
      setResult(null);
      setLoading(false);
      setBusinessSummary('');
      setMarketTrends('');
      setLanguage('English');
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl flex items-center gap-2">
            <Bot className="w-6 h-6 text-primary" />
            AI Stock Advisory
          </DialogTitle>
          <DialogDescription>
            Provide your business data to receive AI-driven advice for stock planning and payment tracking. Inventory and payment data will be loaded automatically.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
          {!result && (
            <div className="space-y-4">
              <Tabs defaultValue="English" value={language} onValueChange={(value) => setLanguage(value as 'English' | 'Hindi')}>
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="English">English</TabsTrigger>
                    <TabsTrigger value="Hindi">Hindi</TabsTrigger>
                </TabsList>
              </Tabs>
              <div className="space-y-2">
                <Label htmlFor="businessSummary">Business Summary</Label>
                <Textarea
                  id="businessSummary"
                  placeholder="e.g., We sell poultry feed and medicines to 50+ farmers in the region."
                  value={businessSummary}
                  onChange={(e) => setBusinessSummary(e.target.value)}
                  rows={2}
                  disabled={!isPremium}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="marketTrends">Current Market Trends</Label>
                <Textarea
                  id="marketTrends"
                  placeholder="e.g., Broiler rates are expected to increase next month. High demand for starter feed."
                  value={marketTrends}
                  onChange={(e) => setMarketTrends(e.target.value)}
                  rows={2}
                  disabled={!isPremium}
                />
              </div>
               {!isPremium && (
                <p className="text-sm text-center text-destructive">
                  This is a premium feature. Please upgrade to get AI-powered advice.
                </p>
              )}
            </div>
          )}

          {loading && (
            <div className="flex items-center justify-center space-x-2 text-muted-foreground">
              <Loader className="animate-spin h-5 w-5" />
              <span>Generating advisory...</span>
            </div>
          )}
          {result && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertTitle className="font-headline">Advisory Generated</AlertTitle>
              <AlertDescription className="space-y-4">
                <div className="prose prose-sm dark:prose-invert">
                  <h4 className="font-semibold text-foreground">Stock Planning Advice</h4>
                  <p>{result.stockPlanningAdvice}</p>
                </div>
                <div className="prose prose-sm dark:prose-invert">
                  <h4 className="font-semibold text-foreground">Payment Tracking Advice</h4>
                  <p>{result.paymentTrackingAdvice}</p>
                </div>
                <div className="pt-2">
                  <Badge variant="outline">
                    Disclaimer: This is an AI-generated suggestion.
                  </Badge>
                </div>
              </AlertDescription>
            </Alert>
          )}
        </div>
        <DialogFooter>
          {result ? (
            <Button type="button" onClick={() => setResult(null)}>
              Get New Advisory
            </Button>
          ) : (
            <>
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" onClick={handleSubmit} disabled={loading || !isPremium}>
                {loading ? 'Analyzing...' : 'Get Advisory'}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
