// src/components/testimonials.tsx
'use client';

import { useEffect, useState } from 'react';
import Autoplay from "embla-carousel-autoplay";
import { Star } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Testimonial } from '@/services/testimonials.service';
import { Skeleton } from './ui/skeleton';

export function Testimonials({ testimonials }: { testimonials: Testimonial[] }) {
  const [loading, setLoading] = useState(false);

  // If testimonials are passed as props, we assume they are loaded.
  // The loading state is more for if we were to fetch them client-side.
  useEffect(() => {
    if (!testimonials || testimonials.length === 0) {
      setLoading(true); // Show skeleton if no data is passed initially
    } else {
      setLoading(false);
    }
  }, [testimonials]);


  const TestimonialSkeleton = () => (
    <Card>
      <CardContent className="p-6 space-y-4">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-full" />
        <div className="flex items-center gap-4 pt-2">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
            </div>
        </div>
      </CardContent>
    </Card>
  );


  return (
    <section id="testimonials" className="w-full py-12 md:py-20">
      <div className="container px-4 md:px-6">
        <div className="space-y-3 text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight font-headline">
            Loved by Farmers & Dealers Alike
          </h2>
          <p className="max-w-[600px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed mx-auto">
            See what our users are saying about how Poultry Mitra has transformed their business.
          </p>
        </div>
        
        {loading ? (
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
                <TestimonialSkeleton />
                <TestimonialSkeleton />
                <TestimonialSkeleton />
             </div>
        ) : (
            <Carousel
            className="w-full max-w-6xl mx-auto"
            plugins={[Autoplay({ delay: 5000 })]}
            opts={{ loop: true, align: 'start' }}
            >
            <CarouselContent className="-ml-4">
                {testimonials.map((testimonial) => (
                <CarouselItem key={testimonial.id} className="md:basis-1/2 lg:basis-1/3 pl-4">
                    <div className="p-1 h-full">
                    <Card className="h-full flex flex-col justify-between">
                        <CardContent className="p-6 flex flex-col flex-grow">
                            <div className="flex items-center gap-0.5 mb-4 text-accent">
                                {Array.from({ length: 5 }).map((_, i) => (
                                <Star
                                    key={i}
                                    className="w-5 h-5"
                                    fill={i < testimonial.rating ? 'currentColor' : 'none'}
                                />
                                ))}
                            </div>
                            <blockquote className="text-base font-semibold leading-snug flex-grow">
                                "{testimonial.content}"
                            </blockquote>
                            <div className="flex items-center gap-4 mt-6 pt-4 border-t">
                                <Avatar>
                                    <AvatarImage src={testimonial.avatarUrl} alt={testimonial.name} data-ai-hint="person portrait" />
                                    <AvatarFallback>{testimonial.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-semibold">{testimonial.name}</p>
                                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    </div>
                </CarouselItem>
                ))}
            </CarouselContent>
            </Carousel>
        )}
      </div>
    </section>
  );
}
