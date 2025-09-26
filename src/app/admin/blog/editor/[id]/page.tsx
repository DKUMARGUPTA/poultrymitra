
// src/app/admin/blog/editor/[id]/page.tsx
"use client";

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/hooks/use-auth';
import { Bird, PencilRuler, Save, Loader, Eye, Trash2, Sparkles, Settings2, Search, Languages } from "lucide-react"
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
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { getPost, createPost, updatePost, Post, PostSchema, deletePost } from '@/services/blog.service';
import Link from 'next/link';
import Image from 'next/image';
import { GenerateBlogPostModal } from '@/components/generate-blog-post-modal';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { translateContent } from '@/ai/flows/translate-content';
import { GenerateBlogPostOutput } from '@/ai/flows/generate-blog-post';
import { useFirestore } from '@/firebase/client-provider';


const EditorFormSchema = PostSchema.pick({
    title: true,
    content: true,
    coverImage: true,
    isPublished: true,
    slug: true,
    metaTitle: true,
    metaDescription: true,
});
type EditorFormValues = z.infer<typeof EditorFormSchema>;

const createSlug = (title: string) => {
  if (!title) return '';
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
};

interface BlogEditorPageProps {
  params: {
    id: string;
  };
}

export default function BlogEditorPage({ params }: BlogEditorPageProps) {
  const { user, loading: authLoading } = useAuth();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const [post, setPost] = useState<Post | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [origin, setOrigin] = useState('');
  
  const postId = params.id;
  const isNewPost = postId === 'new';
  const slugManuallyEdited = useRef(false);

  const form = useForm<EditorFormValues>({
    resolver: zodResolver(EditorFormSchema),
    defaultValues: {
      title: '',
      content: '',
      coverImage: '',
      isPublished: false,
      slug: '',
      metaTitle: '',
      metaDescription: '',
    },
  });
  
  const isPublished = form.watch('isPublished');
  const coverImageUrl = form.watch('coverImage');
  const titleValue = form.watch('title');
  const slugValue = form.watch('slug');
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin);
    }
  }, []);

  useEffect(() => {
    if (!slugManuallyEdited.current) {
      form.setValue('slug', createSlug(titleValue), { shouldValidate: true });
    }
  }, [titleValue, form]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
    } else if (user && user.uid && db) {
        if (!isNewPost) {
            getPost(db, postId).then(fetchedPost => {
                if(fetchedPost) {
                    setPost(fetchedPost);
                    form.reset({
                        title: fetchedPost.title,
                        content: fetchedPost.content,
                        coverImage: fetchedPost.coverImage,
                        isPublished: fetchedPost.isPublished,
                        slug: fetchedPost.slug || '',
                        metaTitle: fetchedPost.metaTitle || '',
                        metaDescription: fetchedPost.metaDescription || '',
                    });
                    if (fetchedPost.slug) {
                        slugManuallyEdited.current = true;
                    }
                }
                setPageLoading(false);
            });
        } else {
            setPageLoading(false);
        }
    }
  }, [user, authLoading, router, postId, isNewPost, form, db]);
  
  const handleAiGenerate = (data: GenerateBlogPostOutput) => {
    form.setValue('title', data.title);
    form.setValue('content', data.content);
    form.setValue('slug', data.slug);
    form.setValue('metaTitle', data.metaTitle);
    form.setValue('metaDescription', data.metaDescription);
    form.setValue('coverImage', `https://source.unsplash.com/600x400/?${encodeURIComponent(data.coverImageHint)}`);
    slugManuallyEdited.current = true;
    toast({
      title: 'Content Generated!',
      description: 'The AI has generated the blog post and SEO fields for you. Please review and save.',
    });
  };

  const handleTranslate = async () => {
    const content = form.getValues('content');
    if (!content.trim()) {
        toast({ variant: 'destructive', title: 'Nothing to translate', description: 'Please write some content first.' });
        return;
    }
    setIsTranslating(true);
    try {
        // A simple heuristic to detect current language.
        const isEnglish = /[a-zA-Z]/.test(content.substring(0, 200));
        const targetLanguage = isEnglish ? 'Hindi' : 'English';

        const result = await translateContent({ content, targetLanguage });

        form.setValue('content', result.translatedContent);
        toast({ title: 'Translation Complete!', description: `Content has been translated to ${targetLanguage}.`});

    } catch (e: any) {
        toast({ variant: 'destructive', title: 'Translation Failed', description: e.message });
    } finally {
        setIsTranslating(false);
    }
  }

  const onSubmit = async (values: EditorFormValues) => {
    if (!user || !db) return;
    setIsSaving(true);
    try {
        if (isNewPost) {
            const newPostId = await createPost(db, { ...values, authorId: user.uid });
            toast({ title: 'Post Created', description: 'Your new blog post has been saved.' });
            router.push(`/admin/blog/editor/${newPostId}`);
        } else {
            await updatePost(db, postId, values);
            toast({ title: 'Post Updated', description: 'Your changes have been saved.' });
        }
    } catch(e: any) {
         toast({ variant: 'destructive', title: 'Error Saving Post', description: e.message });
    } finally {
        setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if(isNewPost || !db) return;
    setIsDeleting(true);
    try {
        await deletePost(db, postId);
        toast({ title: "Post Deleted", description: "The blog post has been successfully removed." });
        router.push('/admin/blog');
    } catch (error: any) {
        toast({ variant: "destructive", title: "Deletion Failed", description: error.message });
    } finally {
        setIsDeleting(false);
    }
  }

  if (pageLoading || authLoading) {
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
          <main className="flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                    <div className="flex items-center justify-between mb-6">
                        <h1 className="text-lg font-semibold md:text-2xl font-headline flex items-center gap-2">
                            <PencilRuler />
                            {isNewPost ? 'New Blog Post' : 'Edit Blog Post'}
                        </h1>
                        <div className="flex items-center gap-2">
                            <Button type="button" variant="outline" onClick={handleTranslate} disabled={isTranslating}>
                                {isTranslating ? <Loader className="mr-2 h-4 w-4 animate-spin" /> : <Languages className="mr-2 h-4 w-4" />}
                                Translate
                            </Button>
                            <GenerateBlogPostModal onGenerate={handleAiGenerate}>
                              <Button type="button" variant="outline"><Sparkles className="mr-2 h-4 w-4" />AI Generate</Button>
                            </GenerateBlogPostModal>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                        {/* Main Content Column */}
                        <div className="xl:col-span-3">
                             <Card>
                                <CardContent className="p-6 grid gap-6">
                                    <FormField
                                        control={form.control}
                                        name="title"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="sr-only">Post Title</FormLabel>
                                                <FormControl><Input placeholder="Post Title" {...field} className="text-2xl h-14 font-headline border-none shadow-none focus-visible:ring-0" /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="content"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="sr-only">Content</FormLabel>
                                                <FormControl><Textarea placeholder="Write your post content here... (Markdown supported)" {...field} rows={25} className="border-none shadow-none focus-visible:ring-0" /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </CardContent>
                             </Card>
                        </div>
                        {/* Settings Column */}
                        <div className="xl:col-span-1 space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-lg"><Save />Publish</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {!isNewPost && post?.slug && (
                                        <Button variant="outline" asChild className="w-full mb-2">
                                            <Link href={`/blog/${post.slug}`} target="_blank"><Eye className="mr-2 h-4 w-4" />Preview</Link>
                                        </Button>
                                    )}
                                    <Button type="submit" disabled={isSaving} className="w-full">
                                        {isSaving ? <><Loader className="mr-2 h-4 w-4 animate-spin" />Saving...</> : <><Save className="mr-2 h-4 w-4" />{isPublished ? 'Update' : 'Save Draft'}</>}
                                    </Button>
                                </CardContent>
                                {!isNewPost && (
                                    <CardFooter>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="link" className="text-destructive p-0 h-auto" disabled={isDeleting}>
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                    {isDeleting ? 'Deleting...' : 'Delete Post'}
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    This action cannot be undone. This will permanently delete this post.
                                                </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction onClick={handleDelete} variant="destructive">
                                                    Delete
                                                </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </CardFooter>
                                )}
                            </Card>

                             <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-lg"><Settings2 />Settings</CardTitle>
                                </CardHeader>
                                <CardContent className="grid gap-6">
                                     <FormField
                                        control={form.control}
                                        name="isPublished"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                                                <FormLabel>Publish</FormLabel>
                                                <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="coverImage"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Cover Image URL</FormLabel>
                                                <FormControl><Textarea placeholder="https://... or data:image/png;base64,..." {...field} value={field.value ?? ''} rows={4} /></FormControl>
                                                {coverImageUrl && (
                                                    <div className="mt-4 relative aspect-video w-full rounded-md border bg-muted overflow-hidden">
                                                        <Image
                                                            src={coverImageUrl}
                                                            alt="Cover image preview"
                                                            fill
                                                            className="object-cover"
                                                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                                        />
                                                    </div>
                                                )}
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </CardContent>
                            </Card>
                            
                             <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-lg"><Search />SEO</CardTitle>
                                </CardHeader>
                                <CardContent className="grid gap-6">
                                     <FormField
                                        control={form.control}
                                        name="slug"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Slug</FormLabel>
                                                <FormControl>
                                                    <Input
                                                    placeholder="post-title-goes-here"
                                                    {...field}
                                                    onChange={(e) => {
                                                        slugManuallyEdited.current = true;
                                                        field.onChange(createSlug(e.target.value));
                                                    }}
                                                    />
                                                </FormControl>
                                                {origin && slugValue && (
                                                    <p className="text-xs text-muted-foreground truncate">
                                                    URL: {origin}/blog/{slugValue}
                                                    </p>
                                                )}
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                     <FormField
                                        control={form.control}
                                        name="metaTitle"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Meta Title</FormLabel>
                                                <FormControl><Input placeholder="SEO-friendly title for search engines" {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                     <FormField
                                        control={form.control}
                                        name="metaDescription"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Meta Description</FormLabel>
                                                <FormControl><Textarea placeholder="Short description for search results." {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </CardContent>
                            </Card>

                             <Card>
                                 <CardHeader>
                                     <CardTitle className="text-lg">Info</CardTitle>
                                 </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground">This content editor supports <Link href="https://www.markdownguide.org/basic-syntax/" target="_blank" className="text-primary underline">Markdown</Link> for formatting.</p>
                                </CardContent>
                             </Card>
                        </div>
                    </div>
                </form>
            </Form>
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
