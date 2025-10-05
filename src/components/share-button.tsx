'use client';

import { Share2 } from 'lucide-react';
import { Button } from './ui/button';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useState } from 'react';

interface ShareButtonProps {
  title: string;
  slug: string;
}

export function ShareButton({ title, slug }: ShareButtonProps) {
  const { toast } = useToast();
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);
  
  if (!hasMounted) {
    return null;
  }
  
  const url = `${window.location.origin}/blog/${slug}`;

  const handleShare = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault(); // Stop the event from propagating to the parent Link/Card
    e.stopPropagation();

    const shareData = {
      title: title,
      text: `Check out this article on Poultry Mitra: ${title}`,
      url: url,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      // Fallback for browsers that don't support the Web Share API
      navigator.clipboard.writeText(url);
      toast({
        title: 'URL Copied',
        description: 'The article link has been copied to your clipboard.',
      });
    }
  };

  return (
    <Button variant="ghost" size="icon" onClick={handleShare}>
      <Share2 className="h-4 w-4" />
      <span className="sr-only">Share post</span>
    </Button>
  );
}
