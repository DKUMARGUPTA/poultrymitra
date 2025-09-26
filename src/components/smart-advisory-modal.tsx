
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
import { getSmartAdvisory, SmartAdvisoryOutput } from '@/ai/flows/smart-advisory';
import { Loader, BrainCircuit, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

export function SmartAdvisoryModal({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [batchHealth, setBatchHealth] = useState('');
  const [growthRate, setGrowthRate] = useState('');
  const [historicalData, setHistoricalData] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SmartAdvisoryOutput | null>(null);
  const { toast } = useToast();
  const [language, setLanguage] = useState<'English' | 'Hindi'>('English');


  const handleSubmit = async () => {
    if (!batchHealth.trim() || !growthRate.trim()) {
      toast({
        variant: 'destructive',
        title: 'Input Required',
        description: 'Please describe the batch health and growth rate.',
      });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await getSmartAdvisory({
        batchHealth,
        growthRate,
        historicalData,
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
      setBatchHealth('');
      setGrowthRate('');
      setHistoricalData('');
      setResult(null);
      setLoading(false);
      setLanguage('English');
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl flex items-center gap-2">
            <BrainCircuit className="w-6 h-6 text-primary" />
            AI Smart Advisory
          </DialogTitle>
          <DialogDescription>
            Provide details about your batch to receive an AI-powered advisory.
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
                <Label htmlFor="batchHealth">Batch Health</Label>
                <Input
                  id="batchHealth"
                  placeholder="e.g., Active and alert, no signs of distress."
                  value={batchHealth}
                  onChange={(e) => setBatchHealth(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="growthRate">Growth Rate</Label>
                <Input
                  id="growthRate"
                  placeholder="e.g., Consistent weight gain, meeting targets."
                  value={growthRate}
                  onChange={(e) => setGrowthRate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="historicalData">Historical Data (Optional)</Label>
                <Textarea
                  id="historicalData"
                  placeholder="e.g., Previous batch FCR was 1.7, mortality was 5%..."
                  value={historicalData}
                  onChange={(e) => setHistoricalData(e.target.value)}
                  rows={3}
                />
              </div>
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
                  <h4 className="font-semibold text-foreground">AI Advisory</h4>
                  <p>{result.advisory}</p>
                </div>
                {result.confidenceScore && (
                     <div>
                        <h4 className="font-semibold text-foreground">Confidence</h4>
                        <p>{result.confidenceScore.toFixed(2)}%</p>
                    </div>
                )}
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
              <Button type="submit" onClick={handleSubmit} disabled={loading}>
                {loading ? 'Analyzing...' : 'Get Advisory'}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
