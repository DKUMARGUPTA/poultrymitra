
'use server';
/**
 * @fileOverview An AI agent for content moderation.
 *
 * - moderateContent - A function that checks if a piece of text is appropriate.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

export async function moderateContent(text: string): Promise<{ isSafe: boolean; reason?: string }> {
  const safetyResponse = await ai.moderate({
    prompt: text,
    // Using a more sensitive threshold for user-generated public content
    safetySettings: [
        {
            category: 'HARM_CATEGORY_HATE_SPEECH',
            threshold: 'BLOCK_LOW_AND_ABOVE',
        },
        {
            category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE',
        },
        {
            category: 'HARM_CATEGORY_HARASSMENT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE',
        },
        {
            category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
            threshold: 'BLOCK_LOW_AND_ABOVE',
        },
    ]
  });

  const blockedRatings = safetyResponse.ratings.filter(r => r.blocked);

  if (blockedRatings.length > 0) {
    const reasons = blockedRatings.map(r => r.category.replace('HARM_CATEGORY_', '').replace(/_/g, ' ')).join(', ');
    return {
      isSafe: false,
      reason: `Content violates our policy on: ${reasons.toLowerCase()}.`,
    };
  }

  return { isSafe: true };
}
