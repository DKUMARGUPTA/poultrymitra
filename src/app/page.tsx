// src/app/page.tsx
import HomePageClient from './home-page-client';
import { getPostsAsync } from '@/services/blog.service';
import { Timestamp } from 'firebase/firestore';

export interface SerializablePost {
  id: string;
  title: string;
  slug: string;
  content: string;
  authorId: string;
  authorName: string;
  coverImage?: string;
  isPublished: boolean;
  createdAt: string; 
  metaTitle?: string;
  metaDescription?: string;
}

export default async function Page() {
  const recentPosts = await getPostsAsync(false, 3);
  
  const serializablePosts: SerializablePost[] = recentPosts.map(post => {
    const createdAt = post.createdAt instanceof Timestamp ? post.createdAt.toDate() : new Date(post.createdAt);
    return {
      ...post,
      id: post.id,
      authorName: post.authorName || 'Anonymous',
      slug: post.slug || '',
      content: post.content || '',
      authorId: post.authorId,
      isPublished: post.isPublished,
      createdAt: createdAt.toISOString(),
    }
  });

  return (
      <HomePageClient initialPosts={serializablePosts} />
  )
}
