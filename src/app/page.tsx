
// src/app/page.tsx
import HomePageClient from './home-page-client';
import { getPostsAsync, SerializablePost } from '@/services/blog.service';
import { getFirestore } from 'firebase/firestore';
import { app } from '@/lib/firebase';

export default async function Page() {
  const db = getFirestore(app);
  // We can fetch posts on the server now
  const recentPosts = await getPostsAsync(db, false, 3);
  
  const serializablePosts: SerializablePost[] = recentPosts.map(post => ({
    ...post,
    createdAt: post.createdAt.toDate().toISOString(),
  }));

  return (
      <HomePageClient initialPosts={serializablePosts} />
  )
}
