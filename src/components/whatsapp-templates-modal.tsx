'use client';

import { useEffect, useState } from 'react';
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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import {
  generateWhatsAppDraft,
  GenerateWhatsAppDraftOutput,
  GenerateWhatsAppDraftInput,
} from '@/ai/flows/ai-powered-whatsapp-drafts';
import { Loader, MessageCircle, CheckCircle, Copy } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/hooks/use-auth';
import { Farmer, getFarmersByDealer } from '@/services/farmers.service';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

interface WhatsappTemplatesModalProps {
  children: React.ReactNode;
  onDraftGenerated?: (draft: string) => void;
}

export function WhatsappTemplatesModal({ children, onDraftGenerated }: WhatsappTemplatesModalProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GenerateWhatsAppDraftOutput | null>(null);
  const { toast } = useToast();
  const { user, userProfile } = useAuth();
  
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [farmersLoading, setFarmersLoading] = useState(true);

  const [draftType, setDraftType] = useState<'paymentReminder' | 'diseaseAlert' | ''>('');
  const [selectedFarmerId, setSelectedFarmerId] = useState('');
  const [contactName, setContactName] = useState('');
  const [amount, setAmount] = useState('');
  const [disease, setDisease] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [language, setLanguage] = useState<'English' | 'Hindi'>('English');
  const isPremium = !!userProfile?.isPremium;

  useEffect(() => {
    if (open && user) {
      setFarmersLoading(true);
      const unsubscribe = getFarmersByDealer(user.uid, (newFarmers) => {
        setFarmers(newFarmers);
        setFarmersLoading(false);
      });
      return () => unsubscribe();
    }
  }, [open, user]);
  
  useEffect(() => {
    if (selectedFarmerId) {
      const farmer = farmers.find(f => f.id === selectedFarmerId);
      if (farmer) {
        setContactName(farmer.name);
        if (draftType === 'paymentReminder') {
            setAmount(String(farmer.outstanding > 0 ? farmer.outstanding : ''));
        }
      }
    } else {
        setContactName('');
    }
  }, [selectedFarmerId, farmers, draftType]);

  useEffect(() => {
    // When draft type changes to payment reminder, auto-fill amount if a farmer is already selected
    if (draftType === 'paymentReminder' && selectedFarmerId) {
        const farmer = farmers.find(f => f.id === selectedFarmerId);
        if (farmer && farmer.outstanding > 0) {
            setAmount(String(farmer.outstanding));
        } else {
            setAmount('');
        }
    }
  }, [draftType, selectedFarmerId, farmers]);


  const handleSubmit = async () => {
     if (!isPremium) {
      toast({ variant: 'destructive', title: 'Premium Feature', description: 'Please upgrade to use AI-powered drafts.' });
      return;
    }
    if (!draftType || (!contactName && !selectedFarmerId)) {
      toast({
        variant: 'destructive',
        title: 'Input Required',
        description: 'Please select a draft type and a farmer.',
      });
      return;
    }
    
    const finalContactName = farmers.find(f => f.id === selectedFarmerId)?.name || contactName;

    const input: GenerateWhatsAppDraftInput = {
      userType: 'dealer', // Assuming dealer is using this
      draftType: draftType,
      contactName: finalContactName,
      language: language,
    };

    if (draftType === 'paymentReminder') {
      const parsedAmount = parseFloat(amount);
      if (isNaN(parsedAmount)) {
        toast({ variant: 'destructive', title: 'Invalid Amount', description: 'Please enter a valid amount.' });
        return;
      }
      input.amount = parsedAmount;
    }

    if (draftType === 'diseaseAlert') {
      if (!disease || !symptoms) {
        toast({ variant: 'destructive', title: 'Input Required', description: 'Please enter the disease and symptoms.' });
        return;
      }
      input.disease = disease;
      input.symptoms = symptoms;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await generateWhatsAppDraft(input);
      if (onDraftGenerated) {
        onDraftGenerated(response.draftMessage);
        toast({ title: 'Draft Generated', description: 'The message has been added to the composer.' });
        handleOpenChange(false);
      } else {
        setResult(response);
      }
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to generate draft. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleCopy = () => {
    if (result?.draftMessage) {
      navigator.clipboard.writeText(result.draftMessage);
      toast({ title: 'Copied!', description: 'Message copied to clipboard.' });
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      // Reset state on close
      setResult(null);
      setLoading(false);
      setDraftType('');
      setSelectedFarmerId('');
      setContactName('');
      setAmount('');
      setDisease('');
      setSymptoms('');
      setLanguage('English');
    }
  };

  const isStandalone = !onDraftGenerated;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl flex items-center gap-2">
            <MessageCircle className="w-6 h-6 text-primary" />
            AI-Powered WhatsApp Drafts
          </DialogTitle>
          <DialogDescription>
            Generate a message template for your farmers.
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
                  <Label htmlFor="draftType">Draft Type</Label>
                  <Select onValueChange={(value: any) => setDraftType(value)} value={draftType} disabled={!isPremium}>
                    <SelectTrigger id="draftType">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="paymentReminder">Payment Reminder</SelectItem>
                      <SelectItem value="diseaseAlert">Disease Alert</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                 <div className="space-y-2">
                  <Label htmlFor="contactName">Farmer</Label>
                  <Select onValueChange={(value: any) => setSelectedFarmerId(value)} value={selectedFarmerId} disabled={farmersLoading || !isPremium}>
                    <SelectTrigger id="contactName">
                      <SelectValue placeholder={farmersLoading ? "Loading farmers..." : "Select farmer"} />
                    </SelectTrigger>
                    <SelectContent>
                      {farmers.map(farmer => (
                        <SelectItem key={farmer.id} value={farmer.id}>{farmer.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {draftType === 'paymentReminder' && (
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount Due</Label>
                  <Input id="amount" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="e.g., 5000"  disabled={!isPremium}/>
                </div>
              )}

              {draftType === 'diseaseAlert' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="disease">Disease</Label>
                    <Input id="disease" value={disease} onChange={(e) => setDisease(e.target.value)} placeholder="e.g., Newcastle Disease"  disabled={!isPremium}/>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="symptoms">Symptoms</Label>
                    <Textarea id="symptoms" value={symptoms} onChange={(e) => setSymptoms(e.target.value)} placeholder="e.g., coughing, sneezing, nasal discharge"  disabled={!isPremium}/>
                  </div>
                </div>
              )}
               {!isPremium && (
                <p className="text-sm text-center text-destructive">
                  This is a premium feature. Please upgrade to use AI-powered drafts.
                </p>
              )}
            </div>
          )}

          {loading && (
            <div className="flex items-center justify-center space-x-2 text-muted-foreground">
              <Loader className="animate-spin h-5 w-5" />
              <span>Generating draft...</span>
            </div>
          )}

          {result && isStandalone && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertTitle className="font-headline">Draft Generated</AlertTitle>
              <AlertDescription className="space-y-4 relative">
                 <Button variant="ghost" size="icon" className="absolute top-0 right-0 h-7 w-7" onClick={handleCopy}>
                    <Copy className="h-4 w-4" />
                 </Button>
                 <p className="pt-2 pr-8">{result.draftMessage}</p>
              </AlertDescription>
            </Alert>
          )}
        </div>
        <DialogFooter>
          {result && isStandalone ? (
            <Button type="button" onClick={() => setResult(null)}>
              Generate Another
            </Button>
          ) : (
            <>
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" onClick={handleSubmit} disabled={loading || !isPremium}>
                {loading ? 'Generating...' : 'Generate Draft'}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
