// src/components/recent-posts.tsx
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { format } from 'date-fns';
import { ArrowRight } from 'lucide-react';

import type { Post } from '@/services/blog.service';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ShareButton } from '@/components/share-button';
import { useEffect, useState } from 'react';
import { Skeleton } from './ui/skeleton';
import { SerializablePost } from '@/app/page';

export function RecentPosts({ posts }: { posts: SerializablePost[] }) {
  const [hasMounted, setHasMounted] = useState(false);
  useEffect(() => {
    setHasMounted(true);
  }, []);

  const defaultCover = PlaceHolderImages.find(p => p.id === 'blog-cover');

  if (posts.length === 0 && hasMounted) {
    return null; // Don't render the section if there are no posts
  }
  
  const PostCardSkeleton = () => (
    <Card>
      <CardHeader className="p-0">
         <Skeleton className="h-48 w-full" />
      </CardHeader>
       <CardContent className="p-6">
        <Skeleton className="h-6 w-4/5 mb-2" />
        <Skeleton className="h-4 w-full mb-1" />
        <Skeleton className="h-4 w-full mb-1" />
        <Skeleton className="h-4 w-2/3 mb-4" />
        <div className="flex items-center justify-between">
            <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-20" />
            </div>
            <Skeleton className="h-8 w-8" />
        </div>
      </CardContent>
    </Card>
  );

  return (
    <section id="blog" className="w-full py-12 md:py-20 bg-muted">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl font-headline">From Our Blog</h2>
            <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              Get the latest insights, news, and best practices for modern poultry farming.
            </p>
          </div>
        </div>
        <div className="mx-auto grid max-w-5xl items-start gap-8 sm:grid-cols-2 md:gap-12 lg:max-w-none lg:grid-cols-3 pt-12">
            {!hasMounted ? (
                [...Array(3)].map((_, i) => <PostCardSkeleton key={i} />)
            ) : (
                posts.map(post => 
                    <Card key={post.id} className="overflow-hidden h-full flex flex-col group hover:shadow-xl transition-shadow duration-300">
                        <CardHeader className="p-0">
                            <Link href={`/blog/${post.slug}`}>
                                <div className="relative w-full h-48">
                                    <Image
                                        src={post.coverImage || defaultCover?.imageUrl || "https://picsum.photos/seed/blog/600/400"}
                                        alt={post.title}
                                        fill
                                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                                        data-ai-hint={defaultCover?.imageHint || "article cover"}
                                    />
                                </div>
                            </Link>
                        </CardHeader>
                        <CardContent className="p-6 flex-grow flex flex-col">
                            <Link href={`/blog/${post.slug}`}>
                                <h3 className="text-xl font-headline font-bold mb-2 group-hover:text-primary transition-colors line-clamp-2">{post.title}</h3>
                            </Link>
                            <p className="text-sm text-muted-foreground mb-4 line-clamp-3 flex-grow">{post.content.substring(0, 150).replace(/#/g, '')}...</p>
                            <div className="flex items-center justify-between text-xs text-muted-foreground mt-auto">
                                <div className="flex flex-col">
                                    <span>By {post.authorName}</span>
                                    <time dateTime={new Date(post.createdAt).toISOString()}>
                                        {format(new Date(post.createdAt), 'MMM d, yyyy')}
                                    </time>
                                </div>
                                <ShareButton title={post.title} slug={post.slug || ''} />
                            </div>
                        </CardContent>
                    </Card>
                )
            )}
        </div>
        <div className="text-center mt-12">
            <Button asChild variant="outline">
                <Link href="/blog">Read More Articles <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
        </div>
      </div>
    </section>
  );
}
