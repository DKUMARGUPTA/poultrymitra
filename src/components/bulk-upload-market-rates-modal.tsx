
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
import { useToast } from '@/hooks/use-toast';
import { Loader, Upload, FileQuestion, Image as ImageIcon, ClipboardPaste, Link as LinkIcon } from 'lucide-react';
import { createMarketRatesInBatch } from '@/services/market-rates.service';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { extractRatesFromImage } from '@/ai/flows/extract-rates-from-image';
import { extractRatesFromText } from '@/ai/flows/extract-rates-from-text';
import { extractRatesFromUrl } from '@/ai/flows/extract-rates-from-url';
import Image from 'next/image';
import { format } from 'date-fns';
import { Textarea } from './ui/textarea';
import { Input } from './ui/input';
import { useUser, useFirebase } from '@/firebase';

interface BulkUploadMarketRatesModalProps {
  children: React.ReactNode;
  onRatesAdded: () => void;
}

export function BulkUploadMarketRatesModal({ children, onRatesAdded }: BulkUploadMarketRatesModalProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [pastedText, setPastedText] = useState('');
  const [url, setUrl] = useState('');
  const [activeTab, setActiveTab] = useState('image');
  const { toast } = useToast();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const { userProfile } = useUser();
  const { db } = useFirebase();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      if (selectedFile.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviewUrl(reader.result as string);
        };
        reader.readAsDataURL(selectedFile);
      } else {
        setPreviewUrl(null);
      }
    } else {
      setFile(null);
      setPreviewUrl(null);
    }
  };

  const handleUpload = () => {
    if (activeTab === 'image') {
      handleImageUpload();
    } else if (activeTab === 'text') {
      handleTextUpload();
    } else if (activeTab === 'url') {
      handleUrlUpload();
    }
  };
  
  const handleUrlUpload = async () => {
    if (!url.trim()) {
      toast({ variant: 'destructive', title: 'No URL provided' });
      return;
    }
    if (!db || !userProfile) {
        toast({ variant: 'destructive', title: 'User not found' });
        return;
    }
    setLoading(true);
    try {
      const result = await extractRatesFromUrl({
        url: url,
        currentDate: format(new Date(), 'yyyy-MM-dd'),
      });

      if (!result.rates || result.rates.length === 0) {
        throw new Error("AI could not detect any rates at the provided URL.");
      }
      
      await createMarketRatesInBatch(db, result.rates, userProfile?.role as 'admin' | 'dealer', userProfile?.uid);

      toast({ title: 'Upload Successful', description: `${result.rates.length} rates extracted and added from the URL.` });
      onRatesAdded();
      handleOpenChange(false);
    } catch (error: any) {
      console.error("URL upload error:", error);
      toast({ variant: 'destructive', title: 'URL Processing Failed', description: error.message || 'Could not extract rates from the URL.' });
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async () => {
    if (!file) {
      toast({ variant: 'destructive', title: 'No file selected' });
      return;
    }
    if (!db || !userProfile) {
        toast({ variant: 'destructive', title: 'User not found' });
        return;
    }
    setLoading(true);

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      const imageDataUri = reader.result as string;
      try {
        const result = await extractRatesFromImage({
          imageUrl: imageDataUri,
          currentDate: format(new Date(), 'yyyy-MM-dd'),
        });

        if (!result.rates || result.rates.length === 0) {
          throw new Error("AI could not detect any rates in the image.");
        }

        await createMarketRatesInBatch(db, result.rates, userProfile?.role as 'admin' | 'dealer', userProfile?.uid);

        toast({ title: 'Upload Successful', description: `${result.rates.length} rates extracted and added from the image.` });
        onRatesAdded();
        handleOpenChange(false);
      } catch (error: any) {
        console.error("Image upload error:", error);
        toast({ variant: 'destructive', title: 'Image Processing Failed', description: error.message || 'Could not extract rates from the image.' });
      } finally {
        setLoading(false);
      }
    };
    reader.onerror = () => {
      setLoading(false);
      toast({ variant: 'destructive', title: 'File Read Error', description: 'Could not read the selected image file.' });
    };
  };

  const handleTextUpload = async () => {
    if (!pastedText.trim()) {
      toast({ variant: 'destructive', title: 'No text provided' });
      return;
    }
     if (!db || !userProfile) {
        toast({ variant: 'destructive', title: 'User not found' });
        return;
    }
    setLoading(true);
    try {
      const result = await extractRatesFromText({
        text: pastedText,
        currentDate: format(new Date(), 'yyyy-MM-dd'),
      });

      if (!result.rates || result.rates.length === 0) {
        throw new Error("AI could not detect any rates in the provided text.");
      }

      await createMarketRatesInBatch(db, result.rates, userProfile?.role as 'admin' | 'dealer', userProfile?.uid);

      toast({ title: 'Upload Successful', description: `${result.rates.length} rates extracted and added from the text.` });
      onRatesAdded();
      handleOpenChange(false);
    } catch (error: any) {
      console.error("Text upload error:", error);
      toast({ variant: 'destructive', title: 'Text Processing Failed', description: error.message || 'Could not extract rates from the text.' });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setFile(null);
      setPastedText('');
      setUrl('');
      setLoading(false);
      setPreviewUrl(null);
      setActiveTab('image');
    }
  };

  const canUpload = activeTab === 'text' ? pastedText.trim() !== '' : activeTab === 'url' ? url.trim() !== '' : !!file;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl flex items-center gap-2">
            <Upload className="w-6 h-6 text-primary" />
            Bulk Upload Market Rates
          </DialogTitle>
          <DialogDescription>
            Upload an image, paste text, or provide a URL to add multiple rates at once using AI.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="image"><ImageIcon className="mr-2 h-4 w-4" />Image</TabsTrigger>
                <TabsTrigger value="text"><ClipboardPaste className="mr-2 h-4 w-4" />Text</TabsTrigger>
                <TabsTrigger value="url"><LinkIcon className="mr-2 h-4 w-4" />URL</TabsTrigger>
            </TabsList>
            <TabsContent value="image">
                 <div className="space-y-4 py-4">
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 rounded-lg">
                        <div className="flex items-start gap-2">
                             <ImageIcon className="w-5 h-5 mt-1" />
                             <div>
                                <h4 className="font-semibold">Image Upload Instructions (AI)</h4>
                                <p className="text-xs">Upload a clear photo of a market rate board. The AI will attempt to read and import the data for you.</p>
                             </div>
                        </div>
                    </div>
                    {previewUrl && (
                        <div className="relative w-full h-40 rounded-md border bg-muted overflow-hidden">
                            <Image src={previewUrl} alt="Image preview" fill className="object-contain" />
                        </div>
                    )}
                 </div>
            </TabsContent>
            <TabsContent value="text">
                <div className="space-y-4 py-4">
                     <div className="p-4 bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300 rounded-lg">
                        <div className="flex items-start gap-2">
                             <ClipboardPaste className="w-5 h-5 mt-1" />
                             <div>
                                <h4 className="font-semibold">Paste Text Instructions (AI)</h4>
                                <p className="text-xs">Paste text from any source (like WhatsApp) containing market rates. The AI will do its best to understand it.</p>
                             </div>
                        </div>
                    </div>
                    <Textarea 
                        placeholder="Paste market rate text here..." 
                        className="min-h-[150px]"
                        value={pastedText}
                        onChange={(e) => setPastedText(e.target.value)}
                    />
                </div>
            </TabsContent>
             <TabsContent value="url">
                <div className="space-y-4 py-4">
                     <div className="p-4 bg-purple-50 dark:bg-purple-900/20 text-purple-800 dark:text-purple-300 rounded-lg">
                        <div className="flex items-start gap-2">
                             <LinkIcon className="w-5 h-5 mt-1" />
                             <div>
                                <h4 className="font-semibold">Extract from URL (AI)</h4>
                                <p className="text-xs">Paste a link to a public webpage (e.g., a news article or Facebook post) containing market rates. The AI will visit the page and extract the data.</p>
                             </div>
                        </div>
                    </div>
                    <Input 
                        placeholder="https://www.example.com/market-rates" 
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                    />
                </div>
            </TabsContent>
        </Tabs>
        
        { (activeTab === 'image') && (
            <div className="space-y-2">
                <label htmlFor="file-upload" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Image File
                </label>
                <input
                    id="file-upload"
                    key={activeTab} // Force re-render on tab change to update `accept`
                    type="file"
                    accept='image/png, image/jpeg'
                    onChange={handleFileChange}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                />
            </div>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" onClick={handleUpload} disabled={loading || !canUpload}>
            {loading ? <><Loader className="animate-spin mr-2" /> Uploading...</> : 'Upload and Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
