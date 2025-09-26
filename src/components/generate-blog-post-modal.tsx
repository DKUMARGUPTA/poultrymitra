
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
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { generateBlogPost, GenerateBlogPostOutput } from '@/ai/flows/generate-blog-post';
import { Loader, Sparkles } from 'lucide-react';

interface GenerateBlogPostModalProps {
  children: React.ReactNode;
  onGenerate: (data: GenerateBlogPostOutput) => void;
}

export function GenerateBlogPostModal({ children, onGenerate }: GenerateBlogPostModalProps) {
  const [open, setOpen] = useState(false);
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!topic.trim()) {
      toast({
        variant: 'destructive',
        title: 'Topic Required',
        description: 'Please enter a topic for the blog post.',
      });
      return;
    }

    setLoading(true);

    try {
      const response = await generateBlogPost({ topic });
      onGenerate(response);
      setOpen(false); // Close the modal on success
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to generate blog post. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setTopic('');
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" />
            Generate Blog Post with AI
          </DialogTitle>
          <DialogDescription>
            Enter a topic, and the AI will write a complete blog post for you.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="topic">Blog Post Topic</Label>
            <Input
              id="topic"
              placeholder="e.g., 'Tips for reducing broiler mortality'"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              autoFocus
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" onClick={handleSubmit} disabled={loading}>
            {loading ? (
              <>
                <Loader className="animate-spin mr-2" /> Generating...
              </>
            ) : (
              'Generate Content'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
