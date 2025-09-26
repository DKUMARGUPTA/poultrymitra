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
  createdAt: string; // Changed from Timestamp to string
  metaTitle?: string;
  metaDescription?: string;
}

export default async function Page() {
  // We can fetch posts on the server now
  const recentPosts = await getPostsAsync(false, 3);
  
  const serializablePosts: SerializablePost[] = recentPosts.map(post => ({
    ...post,
    id: post.id,
    authorName: post.authorName || 'Anonymous',
    slug: post.slug || '',
    content: post.content || '',
    authorId: post.authorId,
    isPublished: post.isPublished,
    createdAt: (post.createdAt as Timestamp).toDate().toISOString(),
  }));

  return (
      <HomePageClient initialPosts={serializablePosts} />
  )
}
