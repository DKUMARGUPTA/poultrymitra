// src/services/testimonials.service.ts
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  Timestamp
} from 'firebase/firestore';
import { z } from 'zod';
import { getClientFirestore } from '@/lib/firebase';

export const TestimonialSchema = z.object({
  name: z.string(),
  role: z.string(),
  avatarUrl: z.string().url().optional(),
  content: z.string(),
  rating: z.number().min(1).max(5),
  createdAt: z.any(),
});

export type Testimonial = z.infer<typeof TestimonialSchema> & { id: string };
export type SerializableTestimonial = Omit<Testimonial, 'createdAt'> & { createdAt: string };


export const getTestimonials = async (count: number = 5): Promise<Testimonial[]> => {
  try {
    const db = getClientFirestore();
    const q = query(
      collection(db, 'testimonials'),
      orderBy('createdAt', 'desc'),
      limit(count)
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      throw new Error("No testimonials found in database.");
    }
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Testimonial));
  } catch (error: any) {
    console.warn("Testimonials fetch failed, returning default data:", error.message);
    // Return some default testimonials if the collection is empty or there's an error
    return [
      {
        id: '1',
        name: 'Ramesh Patel',
        role: 'Farmer, Maharashtra',
        content:
          "The disease detection tool helped me identify an issue early and saved my flock. It's an incredible feature.",
        rating: 5,
        createdAt: new Timestamp(Math.floor(Date.now() / 1000), 0),
        avatarUrl: 'https://picsum.photos/seed/ramesh/100'
      },
      {
        id: '2',
        name: 'Sunita Sharma',
        role: 'Farmer, Punjab',
        content:
          "Managing my farm finances has never been easier. The ledger is simple and the AI advisory is surprisingly accurate.",
        rating: 5,
        createdAt: new Timestamp(Math.floor(Date.now() / 1000), 0),
        avatarUrl: 'https://picsum.photos/seed/sunita/100'
      },
      {
        id: '3',
        name: 'Anil Kumar',
        role: 'Dealer, Haryana',
        content:
          'The AI stock advisory helps me manage my inventory perfectly. I always know what to order and when.',
        rating: 5,
        createdAt: new Timestamp(Math.floor(Date.now() / 1000), 0),
        avatarUrl: 'https://picsum.photos/seed/anil/100'
      },
    ];
  }
};
