// src/app/blog/[slug]/page.tsx
import { getPostBySlug, getPostsAsync } from '@/services/blog.service';
import { notFound } from 'next/navigation';
import { LandingPageHeader } from '@/components/landing-page-header';
import { AnimatedLogo } from '@/components/animated-logo';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';
import ReactMarkdown from 'react-markdown';
import Image from 'next/image';
import Link from 'next/link';
import type { Metadata, ResolvingMetadata } from 'next'
import { ShareButton } from '@/components/share-button';
import { SidebarProvider } from '@/components/ui/sidebar';
import { getFirestore } from 'firebase/firestore';
import { app } from '@/lib/firebase';

interface BlogPostPageProps {
  params: {
    slug: string;
  };
}

export async function generateMetadata(
  { params }: BlogPostPageProps,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const db = getFirestore(app);
  const post = await getPostBySlug(db, params.slug);

  if (!post) {
    return {
      title: 'Post Not Found | Poultry Mitra',
      description: "The blog post you're looking for doesn't exist.",
    }
  }

  const previousImages = (await parent).openGraph?.images || []

  return {
    title: post.metaTitle || post.title,
    description: post.metaDescription || post.content.substring(0, 150),
    openGraph: {
      title: post.metaTitle || post.title,
      description: post.metaDescription || post.content.substring(0, 150),
      images: post.coverImage ? [post.coverImage, ...previousImages] : previousImages,
    },
  }
}

// This function tells Next.js which slugs to pre-render at build time.
export async function generateStaticParams() {
  const db = getFirestore(app);
  const posts = await getPostsAsync(db, false); // Get only published posts
  return posts.map((post) => ({
    slug: post.slug,
  }));
}


export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const db = getFirestore(app);
  const post = await getPostBySlug(db, params.slug);

  if (!post || !post.isPublished) {
    notFound();
  }

  return (
    <SidebarProvider>
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <LandingPageHeader />
      <main className="flex-1 pt-24">
        <article className="container max-w-3xl mx-auto py-8 md:py-12 px-4">
            <header className="mb-8 text-center">
                <h1 className="text-3xl md:text-5xl font-bold tracking-tighter font-headline mb-4">{post.title}</h1>
                <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-muted-foreground">
                    <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                            <AvatarImage src={`https://picsum.photos/seed/${post.authorId}/40/40`} alt={post.authorName} />
                            <AvatarFallback>{post.authorName.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span>{post.authorName}</span>
                    </div>
                    <span>•</span>
                    <time dateTime={post.createdAt.toDate().toISOString()}>
                        {format(post.createdAt.toDate(), 'PPP')}
                    </time>
                </div>
                <div className="mt-6 flex justify-center">
                    <ShareButton title={post.title} slug={post.slug} />
                </div>
            </header>

             {post.coverImage && (
                <div className="relative w-full h-64 md:h-96 rounded-lg overflow-hidden mb-8 shadow-lg">
                    <Image
                        src={post.coverImage}
                        alt={post.title}
                        fill
                        className="object-cover"
                        priority
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                </div>
            )}

            <div className="prose dark:prose-invert lg:prose-xl mx-auto w-full max-w-none">
                <ReactMarkdown>{post.content}</ReactMarkdown>
            </div>
        </article>
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
