'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader, UserPlus, Link2, Copy } from 'lucide-react';
import { createFarmer, FarmerSchema, FarmerInput, Farmer } from '@/services/farmers.service';
import { connectFarmerToDealer } from '@/services/users.service';
import { useAuth } from '@/hooks/use-auth';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from './ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { doc, getDoc } from 'firebase/firestore';
import { getFirestore } from 'firebase/firestore';
import { app } from '@/lib/firebase';

// Schema for creating a new farmer
const AddFarmerFormSchema = FarmerSchema.pick({ name: true, location: true, batchSize: true });
type AddFarmerFormValues = z.infer<typeof AddFarmerFormSchema>;

// Schema for connecting an existing farmer
const ConnectFarmerSchema = z.object({
  farmerCode: z.string().min(1, { message: "Farmer Code is required." }),
});
type ConnectFarmerValues = z.infer<typeof ConnectFarmerSchema>;

interface AddConnectFarmerModalProps {
  children: React.ReactNode;
  onFarmerAction: (farmer: Farmer) => void;
  onNewFarmerClick?: () => boolean;
}

export function AddConnectFarmerModal({ children, onFarmerAction, onNewFarmerClick }: AddConnectFarmerModalProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('create');
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);

  const addFarmerForm = useForm<AddFarmerFormValues>({
    resolver: zodResolver(AddFarmerFormSchema),
    defaultValues: { name: '', location: '', batchSize: 100 },
  });

  const connectFarmerForm = useForm<ConnectFarmerValues>({
    resolver: zodResolver(ConnectFarmerSchema),
    defaultValues: { farmerCode: '' },
  });

  const handleCreateSubmit = async (values: AddFarmerFormValues) => {
    if (!user) {
      toast({ variant: 'destructive', title: 'Authentication Error', description: 'You must be logged in.' });
      return;
    }

    setLoading(true);

    try {
      const db = getFirestore(app);
      const farmerInput: Partial<FarmerInput> = {
        ...values,
        dealerId: user.uid,
        outstanding: 0,
      };
      const farmerId = await createFarmer(farmerInput, true); // Create a placeholder farmer
      const createdFarmerDoc = await getDoc(doc(db, 'farmers', farmerId));
      const createdFarmer = { id: createdFarmerDoc.id, ...createdFarmerDoc.data() } as Farmer;

      setGeneratedCode(createdFarmer.farmerCode || null);
      setActiveTab('created'); // Switch to the new tab
      onFarmerAction(createdFarmer); // Update the list in the background

    } catch (error: any) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to add farmer.' });
      setLoading(false);
    }
    // Don't set loading to false here, as we are switching tabs
  };

  const handleConnectSubmit = async (values: ConnectFarmerValues) => {
     if (!user) {
      toast({ variant: 'destructive', title: 'Authentication Error', description: 'You must be logged in.' });
      return;
    }

    setLoading(true);
    try {
      const connectedFarmer = await connectFarmerToDealer(values.farmerCode, user.uid);
      toast({ title: 'Farmer Connected', description: `${connectedFarmer.name} has been successfully added to your network.` });
      onFarmerAction(connectedFarmer);
      handleOpenChange(false);
    } catch (error: any) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Connection Failed', description: error.message || 'Please check the code and try again.' });
    } finally {
      setLoading(false);
    }
  };
  
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen && onNewFarmerClick) {
        if (!onNewFarmerClick()) {
            return;
        }
    }
    setOpen(isOpen);
    if (!isOpen) {
      addFarmerForm.reset();
      connectFarmerForm.reset();
      setLoading(false);
      setActiveTab('create');
      setGeneratedCode(null);
    }
  };

  const copyToClipboard = () => {
    if (generatedCode) {
      navigator.clipboard.writeText(generatedCode);
      toast({title: "Copied!", description: "Farmer code copied to clipboard."})
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl">Add or Connect a Farmer</DialogTitle>
          <DialogDescription>Create a new profile for a farmer not on the app, or connect with one who is.</DialogDescription>
        </DialogHeader>
        <Tabs value={activeTab} onValueChange={(val) => {if (val !== 'created') setActiveTab(val)}} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="create">Create New</TabsTrigger>
                <TabsTrigger value="connect">Connect Existing</TabsTrigger>
            </TabsList>
            <TabsContent value="create">
                <Form {...addFarmerForm}>
                <form onSubmit={addFarmerForm.handleSubmit(handleCreateSubmit)} className="space-y-4 pt-4" id="add-farmer-form">
                    <FormDescription>
                        This creates a new farmer profile in your network. A unique code will be generated for the farmer to use when they sign up on the app.
                    </FormDescription>
                    <FormField control={addFarmerForm.control} name="name" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Farmer Name</FormLabel>
                            <FormControl><Input placeholder="e.g., Ram Singh" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                    <FormField control={addFarmerForm.control} name="location" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Location</FormLabel>
                            <FormControl><Input placeholder="e.g., Pune" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                    <FormField control={addFarmerForm.control} name="batchSize" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Typical Batch Size</FormLabel>
                            <FormControl><Input type="number" placeholder="e.g., 500" {...field} onChange={e => field.onChange(parseInt(e.target.value))} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                     <div className="flex justify-end gap-2 pt-4">
                        <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>Cancel</Button>
                        <Button type="submit" form="add-farmer-form" disabled={loading}>
                            {loading ? <><Loader className="animate-spin mr-2" /> Creating...</> : <><UserPlus className="mr-2" /> Create Farmer Profile</>}
                        </Button>
                     </div>
                </form>
                </Form>
            </TabsContent>
            <TabsContent value="connect">
                 <Form {...connectFarmerForm}>
                    <form onSubmit={connectFarmerForm.handleSubmit(handleConnectSubmit)} className="space-y-4 pt-4" id="connect-farmer-form">
                         <FormField control={connectFarmerForm.control} name="farmerCode" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Farmer's Unique Code</FormLabel>
                                <FormControl><Input placeholder="Enter farmer's connection code" {...field} /></FormControl>
                                <FormDescription>Ask the farmer for their unique "Farmer Code" from their settings page.</FormDescription>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <div className="flex justify-end gap-2 pt-4">
                            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>Cancel</Button>
                            <Button type="submit" form="connect-farmer-form" disabled={loading}>
                                {loading ? <><Loader className="animate-spin mr-2" /> Connecting...</> : <><Link2 className="mr-2" /> Connect</>}
                            </Button>
                        </div>
                    </form>
                </Form>
            </TabsContent>
             <TabsContent value="created">
                <div className="text-center py-4 space-y-4">
                    <h3 className="font-bold text-lg">Farmer Profile Created!</h3>
                    <p className="text-muted-foreground">Share this code with the farmer. When they sign up for the app, they can enter this code to connect to this profile and see their data.</p>
                    <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
                        <p className="text-2xl font-bold font-mono text-primary tracking-widest flex-1">{generatedCode}</p>
                        <Button variant="outline" size="icon" onClick={copyToClipboard}>
                            <Copy className="w-5 h-5"/>
                        </Button>
                    </div>
                    <Button onClick={() => handleOpenChange(false)}>Done</Button>
                </div>
            </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
