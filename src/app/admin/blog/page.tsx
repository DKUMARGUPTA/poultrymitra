
"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Bird, PencilRuler, PlusCircle, Edit, Trash2, Eye, ExternalLink } from "lucide-react"
import { MainNav } from "@/components/main-nav"
import { UserNav } from "@/components/user-nav"
import {
  Sidebar,
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
  SidebarHeader,
  SidebarContent,
} from "@/components/ui/sidebar"
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';
import { getPosts, deletePost, Post } from '@/services/blog.service';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useToast } from '@/hooks/use-toast';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { ThemeToggle } from '@/components/theme-toggle';
import { useFirebase } from '@/firebase/provider';

export default function AdminBlogPage() {
  const { user, loading: authLoading } = useAuth();
  const { db } = useFirebase();
  const router = useRouter();
  const { toast } = useToast();
  const [posts, setPosts] = useState<Post[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const defaultCover = PlaceHolderImages.find(p => p.id === 'blog-cover');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
    } else if (db) {
        const unsubscribe = getPosts(db, (allPosts) => {
            setPosts(allPosts);
            setPostsLoading(false);
        }, true); // Fetch all posts, including drafts

        return () => unsubscribe();
    }
  }, [user, authLoading, router, db]);

  const handleDeletePost = async (postId: string) => {
    try {
        await deletePost(db, postId);
        toast({ title: "Post Deleted", description: "The blog post has been successfully removed." });
        // The listener will automatically update the state, no need to manually filter
    } catch (error: any) {
        toast({ variant: "destructive", title: "Deletion Failed", description: error.message });
    }
  }

  if (authLoading || !user) {
    return (
       <div className="flex flex-col h-screen">
        <header className="flex h-14 items-center gap-4 border-b bg-card px-4 lg:h-[60px] lg:px-6"><Skeleton className="h-8 w-32" /><div className="w-full flex-1" /><Skeleton className="h-9 w-9 rounded-full" /></header>
        <div className="flex flex-1">
            <aside className="hidden md:flex flex-col w-64 border-r p-4 gap-4"><Skeleton className="h-8 w-40 mb-4" /><Skeleton className="h-8 w-full" /><Skeleton className="h-8 w-full" /><Skeleton className="h-8 w-full" /></aside>
            <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6"><Skeleton className="h-8 w-48" /><div className="flex-1 rounded-lg border border-dashed shadow-sm p-6"><Skeleton className="h-64 w-full" /></div></main>
        </div>
    </div>
    )
  }

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className="p-4"><div className="flex items-center gap-2"><Bird className="w-8 h-8 text-primary" /><h1 className="text-2xl font-headline text-primary">Poultry Mitra</h1></div></SidebarHeader>
        <SidebarContent><MainNav /></SidebarContent>
      </Sidebar>
      <SidebarInset>
        <div className="flex flex-col">
          <header className="flex h-14 items-center gap-4 border-b bg-card px-4 lg:h-[60px] lg:px-6"><SidebarTrigger className="md:hidden" /><div className="w-full flex-1" /><UserNav /></header>
          <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
            <div className="flex items-center justify-between">
                <h1 className="text-lg font-semibold md:text-2xl font-headline flex items-center gap-2"><PencilRuler />Blog Management</h1>
                 <Button asChild><Link href="/admin/blog/editor/new"><PlusCircle className="mr-2 h-4 w-4" />New Post</Link></Button>
            </div>
             
             {postsLoading ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {[...Array(6)].map((_,i) => 
                      <Card key={i}>
                        <CardHeader><Skeleton className="h-40 w-full" /></CardHeader>
                        <CardContent><Skeleton className="h-5 w-4/5" /><Skeleton className="h-4 w-3/5 mt-2" /></CardContent>
                        <CardFooter><Skeleton className="h-8 w-full" /></CardFooter>
                      </Card>
                    )}
                </div>
            ) : posts.length === 0 ? (
                <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm min-h-[400px]">
                    <div className="flex flex-col items-center gap-1 text-center">
                        <h3 className="text-2xl font-bold tracking-tight">No Posts Yet</h3>
                        <p className="text-sm text-muted-foreground">Start by creating your first blog post.</p>
                        <Button className="mt-4" asChild><Link href="/admin/blog/editor/new"><PlusCircle className="mr-2 h-4 w-4" />Create Post</Link></Button>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {posts.map(post => (
                       <Card key={post.id} className="flex flex-col">
                            <CardHeader className="p-0">
                                 <Link href={`/admin/blog/editor/${post.id}`}>
                                    <div className="relative w-full h-40">
                                        <Image
                                            src={post.coverImage || defaultCover?.imageUrl || "https://picsum.photos/seed/blog/600/400"}
                                            alt={post.title}
                                            fill
                                            className="object-cover rounded-t-lg"
                                            data-ai-hint={defaultCover?.imageHint || "article cover"}
                                        />
                                        <div className="absolute top-2 right-2">
                                            <Badge variant={post.isPublished ? "default" : "secondary"}>{post.isPublished ? "Published" : "Draft"}</Badge>
                                        </div>
                                    </div>
                                </Link>
                            </CardHeader>
                            <CardContent className="p-4 flex-grow">
                                <CardTitle className="font-headline text-lg mb-2 leading-tight line-clamp-2">{post.title}</CardTitle>
                                <CardDescription className="text-xs">
                                    By {post.authorName} on {format(post.createdAt.toDate(), 'PPP')}
                                </CardDescription>
                            </CardContent>
                            <CardFooter className="p-4 pt-0">
                               <div className="flex w-full justify-between items-center gap-2">
                                    <Button size="sm" variant="outline" asChild>
                                        <Link href={`/admin/blog/editor/${post.id}`}>
                                            <Edit className="mr-2 h-4 w-4" /> Edit
                                        </Link>
                                    </Button>
                                     {post.isPublished && (
                                        <Button size="sm" variant="ghost" asChild>
                                            <Link href={`/blog/${post.slug}`} target="_blank">
                                                <ExternalLink className="mr-2 h-4 w-4" /> View
                                            </Link>
                                        </Button>
                                    )}
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button size="icon" variant="ghost"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                <AlertDialogDescription>This action will permanently delete the post titled "{post.title}".</AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction asChild>
                                                    <Button onClick={() => handleDeletePost(post.id)} variant="destructive">Delete</Button>
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                               </div>
                            </CardFooter>
                       </Card>
                    ))}
                </div>
            )}
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
