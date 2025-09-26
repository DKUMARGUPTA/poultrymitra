
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
import { diseaseDetection, DiseaseDetectionOutput } from '@/ai/flows/disease-detection';
import { Loader, FlaskConical, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Separator } from './ui/separator';
import { Input } from './ui/input';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';

const commonSymptoms = [
  "Lethargy", "Ruffled Feathers", "Coughing", "Sneezing",
  "Nasal Discharge", "Swollen Face", "Diarrhea", "Lameness",
  "Paralysis", "Twisted Neck", "Loss of Appetite", "Watery Eyes"
];


export function DiseaseDetectionModal({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DiseaseDetectionOutput | null>(null);
  const { toast } = useToast();

  const [ageInDays, setAgeInDays] = useState('');
  const [symptomsDuration, setSymptomsDuration] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [language, setLanguage] = useState<'English' | 'Hindi'>('English');


  const handleSubmit = async () => {
    const age = parseInt(ageInDays);
    if (isNaN(age) || age <= 0) {
      toast({ variant: 'destructive', title: 'Invalid Age', description: 'Please enter a valid age in days.' });
      return;
    }
     if (!symptomsDuration.trim()) {
      toast({ variant: 'destructive', title: 'Input Required', description: 'Please enter the symptom duration.' });
      return;
    }
     if (!symptoms.trim()) {
      toast({ variant: 'destructive', title: 'Input Required', description: 'Please enter the observed symptoms.' });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await diseaseDetection({ 
        ageInDays: age,
        symptomsDuration,
        symptoms,
        language
    });
      setResult(response);
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to get a diagnosis. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      // Reset state on close
      setSymptoms('');
      setResult(null);
      setLoading(false);
      setAgeInDays('');
      setSymptomsDuration('');
      setLanguage('English');
    }
  };

  const handleSymptomClick = (symptom: string) => {
    setSymptoms(prev => prev ? `${prev}, ${symptom}` : symptom);
  };
  
  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl flex items-center gap-2">
            <FlaskConical className="w-6 h-6 text-primary" />
            AI Disease Detection
          </DialogTitle>
          <DialogDescription>
            Answer a few questions to get an AI-powered analysis of potential poultry diseases.
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
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="age">Age of Bird (in days)</Label>
                    <Input id="age" type="number" value={ageInDays} onChange={(e) => setAgeInDays(e.target.value)} placeholder="e.g., 15" />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="duration">Symptom Duration</Label>
                    <Input id="duration" value={symptomsDuration} onChange={(e) => setSymptomsDuration(e.target.value)} placeholder="e.g., 2 days" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="symptoms">Observed Symptoms</Label>
                <Textarea
                id="symptoms"
                placeholder="e.g., lethargy, ruffled feathers, difficulty breathing..."
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                rows={4}
                />
                 <div className="flex flex-wrap gap-2 pt-2">
                    {commonSymptoms.map(symptom => (
                        <Badge 
                            key={symptom} 
                            variant="outline" 
                            className="cursor-pointer hover:bg-muted"
                            onClick={() => handleSymptomClick(symptom)}
                        >
                            {symptom}
                        </Badge>
                    ))}
                </div>
              </div>
            </div>
           )}

          {loading && (
            <div className="flex items-center justify-center space-x-2 text-muted-foreground">
              <Loader className="animate-spin h-5 w-5" />
              <span>Analyzing symptoms...</span>
            </div>
          )}
          {result && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertTitle className="font-headline">Diagnosis Complete</AlertTitle>
              <AlertDescription>
                <Tabs defaultValue="issues" className="w-full mt-4">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="issues">Possible Issues</TabsTrigger>
                    <TabsTrigger value="suggestions">Suggestions</TabsTrigger>
                  </TabsList>
                  <TabsContent value="issues" className="prose prose-sm dark:prose-invert max-h-60 overflow-y-auto mt-4 pr-2">
                     <p>{result.possibleIssues}</p>
                  </TabsContent>
                  <TabsContent value="suggestions" className="prose prose-sm dark:prose-invert max-h-60 overflow-y-auto mt-4 pr-2">
                     <p>{result.suggestions}</p>
                  </TabsContent>
                </Tabs>
                <div className='pt-4'>
                    <Badge variant="outline">Disclaimer: This is an AI-generated suggestion. Always consult a veterinarian.</Badge>
                </div>
              </AlertDescription>
            </Alert>
          )}
        </div>
        <DialogFooter>
          {result ? (
             <Button type="button" onClick={() => { setResult(null); setSymptoms(''); setAgeInDays(''); setSymptomsDuration(''); }}>
              Diagnose Another
            </Button>
          ) : (
            <>
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" onClick={handleSubmit} disabled={loading}>
                {loading ? 'Analyzing...' : 'Get Diagnosis'}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
