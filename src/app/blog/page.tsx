// src/app/blog/page.tsx
import { getPostsAsync, Post } from '@/services/blog.service';
import { LandingPageHeader } from '@/components/landing-page-header';
import { AnimatedLogo } from '@/components/animated-logo';
import Link from 'next/link';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import Image from 'next/image';
import { format } from 'date-fns';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { SidebarProvider } from '@/components/ui/sidebar';
import { getFirestore } from 'firebase/firestore';
import { app } from '@/lib/firebase';

async function BlogIndexPage() {
  const db = getFirestore(app);
  const posts = await getPostsAsync(db, false); // Only fetch published posts
  const defaultCover = PlaceHolderImages.find(p => p.id === 'blog-cover');

  return (
    <SidebarProvider>
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <LandingPageHeader />
      <main className="flex-1 pt-24">
        <div className="container mx-auto px-4 py-12">
            <header className="text-center mb-12">
                <h1 className="text-4xl md:text-5xl font-bold tracking-tighter font-headline">The Poultry Mitra Blog</h1>
                <p className="max-w-2xl mx-auto text-muted-foreground md:text-xl mt-4">
                    Insights, news, and best practices for modern poultry farming.
                </p>
            </header>
            
            {posts.length === 0 ? (
                <div className="text-center py-20">
                    <h2 className="text-2xl font-bold">No articles yet!</h2>
                    <p className="text-muted-foreground">Our blog is coming soon. Please check back later.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {posts.map(post => (
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
                                <h2 className="text-xl font-headline font-bold mb-2 group-hover:text-primary transition-colors line-clamp-2">{post.title}</h2>
                                <p className="text-sm text-muted-foreground mb-4 line-clamp-3 flex-grow">
                                  {post.content.substring(0, 150).replace(/#/g, '')}...
                                  <Link href={`/blog/${post.slug}`} className="text-primary font-semibold hover:underline">Read More</Link>
                                </p>
                                <div className="flex items-center justify-between text-xs text-muted-foreground mt-auto">
                                    <span>By {post.authorName}</span>
                                    <time dateTime={post.createdAt.toDate().toISOString()}>
                                        {format(new Date(post.createdAt.toDate()), 'MMM d, yyyy')}
                                    </time>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
      </main>
      <footer className="bg-gray-900 text-white">
        <div className="container px-4 md:px-6 py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
                <div className="flex items-center gap-2 mb-4">
                    <AnimatedLogo className="h-8 w-8 text-green-400" />
                    <span className="text-xl font-headline font-bold">Poultry Mitra</span>
                </div>
                <p className="text-sm text-gray-400">India's #1 Poultry Farm Management and Advisory company.</p>
            </div>
            <div>
                <h4 className="font-semibold mb-4">Quick Links</h4>
                <nav className="flex flex-col gap-2 text-sm">
                    <Link href="/#features" className="text-gray-400 hover:text-white">Features</Link>
                    <Link href="/blog" className="text-gray-400 hover:text-white">Blog</Link>
                </nav>
            </div>
             <div>
                <h4 className="font-semibold mb-4">Support</h4>
                <nav className="flex flex-col gap-2 text-sm">
                    <Link href="#" className="text-gray-400 hover:text-white">Help</Link>
                    <Link href="#" className="text-gray-400 hover:text-white">Privacy Policy</Link>
                </nav>
            </div>
            <div>
                <h4 className="font-semibold mb-4">Contact</h4>
                <div className="text-sm text-gray-400">
                    <p>+91 9123456789</p>
                    <p>help@poultrymitra.com</p>
                </div>
            </div>
        </div>
        <div className="py-6 border-t border-gray-800">
             <p className="text-center text-xs text-gray-500">&copy; 2024 Poultry Mitra. All rights reserved.</p>
        </div>
      </footer>
    </div>
    </SidebarProvider>
  );
}

export default BlogIndexPage;
