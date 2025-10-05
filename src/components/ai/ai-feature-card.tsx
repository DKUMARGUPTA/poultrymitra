
import { Lock, Sparkles } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import React from 'react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useUser } from '@/firebase';

interface AiFeatureCardProps extends React.HTMLAttributes<HTMLDivElement> {
  icon: React.ReactNode;
  title: string;
  description: string;
  buttonText?: string;
  isLocked?: boolean;
}

export function AiFeatureCard({ icon, title, description, buttonText, isLocked = false, ...props }: AiFeatureCardProps) {
  const { user, loading } = useUser();
  const isInteractive = !!props.onClick;
  const descriptionClasses = props.className?.includes('text-white') ? 'text-green-100' : 'text-muted-foreground';

  const content = (
    <Card 
      className={cn(
        "relative overflow-hidden h-full flex flex-col hover:shadow-lg transition-shadow duration-300",
        isInteractive && !isLocked && "cursor-pointer"
      )}
      {...props}
    >
      {isLocked && (
        <Badge variant="secondary" className="absolute top-2 right-2 border-primary/20">
          <Lock className="w-3 h-3 mr-1" />
          Premium
        </Badge>
      )}
      <CardHeader>
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-full bg-primary/10 text-primary">
            {icon}
          </div>
          <CardTitle className="font-headline text-xl">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col justify-between">
        <CardDescription className={descriptionClasses}>{description}</CardDescription>
        <Button 
          variant={isLocked ? 'secondary' : 'default'} 
          className="w-full mt-4" 
          disabled={isLocked && !isInteractive}
          onClick={isInteractive ? (e) => e.stopPropagation() : undefined} 
        >
          <Sparkles className="w-4 h-4 mr-2" />
          {buttonText || 'Use Feature'}
        </Button>
      </CardContent>
    </Card>
  );

  if (isLocked) {
    const upgradeUrl = user ? '/settings/billing' : '/auth?view=signup';
    return <Link href={upgradeUrl} className="h-full block">{content}</Link>;
  }

  return content;
}
