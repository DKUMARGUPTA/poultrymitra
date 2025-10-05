// src/services/blog.service.ts
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  getDoc,
  doc,
  serverTimestamp,
  orderBy,
  limit,
  Timestamp,
  updateDoc,
  deleteDoc,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { z } from 'zod';
import { getUserProfile } from './users.service';
import { db } from '@/lib/firebase';

const createSlug = (title: string) => {
  if (!title) return '';
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // remove non-alphanumeric characters
    .replace(/\s+/g, '-') // replace spaces with hyphens
    .replace(/-+/g, '-'); // remove consecutive hyphens
};

export const PostSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters.'),
  slug: z.string().optional(),
  content: z.string().min(20, 'Content must be at least 20 characters.'),
  authorId: z.string(),
  authorName: z.string().optional(),
  coverImage: z.string().url().or(z.literal('')).optional(),
  isPublished: z.boolean().default(false),
  createdAt: z.any(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
});

export type Post = z.infer<typeof PostSchema> & { id: string, createdAt: Timestamp };
export type PostInput = z.infer<typeof PostSchema>;

// Define a serializable post type for the client
export type SerializablePost = Omit<Post, 'createdAt'> & {
  createdAt: string;
};

export const createPost = async (postData: Omit<PostInput, 'createdAt' | 'authorName'>): Promise<string> => {
  const userProfile = await getUserProfile(postData.authorId);
  if (!userProfile) throw new Error("Author profile not found.");

  const slug = postData.slug ? createSlug(postData.slug) : createSlug(postData.title);

  const docRef = await addDoc(collection(db, 'posts'), {
    ...postData,
    slug,
    authorName: userProfile.name,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
};

export const updatePost = async (postId: string, postData: Partial<Omit<PostInput, 'createdAt' | 'authorId' | 'authorName'>>) => {
  const postRef = doc(db, 'posts', postId);
  const updateData: any = { ...postData };
  
  if (postData.slug) {
    updateData.slug = createSlug(postData.slug);
  } else if (postData.title && !postData.slug) { // Only auto-update slug if it's not being set manually
    updateData.slug = createSlug(postData.title);
  }


  await updateDoc(postRef, updateData);
};

export const getPost = async (db: any, postId: string): Promise<Post | null> => {
  const docRef = doc(db, 'posts', postId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as Post;
  }
  return null;
};

export const getPostBySlug = async (slug: string): Promise<Post | null> => {
  const q = query(collection(db, 'posts'), where('slug', '==', slug), limit(1));
  const snapshot = await getDocs(q);
  if (snapshot.empty) {
    return null;
  }
  const docSnap = snapshot.docs[0];
  return { id: docSnap.id, ...docSnap.data() } as Post;
};

/**
 * Fetches all posts, including drafts.
 */
export const getAllPosts = async (): Promise<Post[]> => {
    const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post));
};


/**
 * Fetches posts once for server-side rendering.
 */
export const getPostsAsync = async (includeDrafts = false, postLimit?: number): Promise<Post[]> => {
    let q;
    if (includeDrafts) {
        q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
    } else {
        q = query(collection(db, 'posts'), where('isPublished', '==', true), orderBy('createdAt', 'desc'));
    }

    if (postLimit) {
        q = query(q, limit(postLimit));
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post));
};

export const getPostsByAuthor = async (authorId: string, postLimit?: number): Promise<Post[]> => {
    let q = query(
        collection(db, 'posts'), 
        where('authorId', '==', authorId), 
        where('isPublished', '==', true),
        orderBy('createdAt', 'desc')
    );

    if (postLimit) {
        q = query(q, limit(postLimit));
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post));
};


export const deletePost = async (db: any, postId: string): Promise<void> => {
    const postRef = doc(db, 'posts', postId);
    await deleteDoc(postRef);
};
