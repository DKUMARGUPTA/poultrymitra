'use client' // Error components must be Client Components
 
import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AnimatedLogo } from '@/components/animated-logo'
 
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error)
  }, [error])
 
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 text-center">
      <AnimatedLogo className="w-16 h-16 text-destructive mb-4" />
      <h2 className="text-3xl font-bold font-headline mb-2">Something went wrong!</h2>
      <p className="text-muted-foreground mb-6">An unexpected error occurred. Please try again.</p>
      <Button onClick={() => reset()}>
        Try again
      </Button>
    </div>
  )
}
