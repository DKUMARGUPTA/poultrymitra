
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { AnimatedLogo } from '@/components/animated-logo'
 
export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 text-center">
        <AnimatedLogo className="w-16 h-16 text-primary mb-4" />
      <h2 className="text-3xl font-bold font-headline mb-2">Page Not Found</h2>
      <p className="text-muted-foreground mb-6">Could not find the requested resource.</p>
      <Button asChild>
        <Link href="/dashboard">Return to Dashboard</Link>
      </Button>
    </div>
  )
}
