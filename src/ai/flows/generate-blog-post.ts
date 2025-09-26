
'use server';
/**
 * @fileOverview An AI agent for generating blog posts.
 *
 * - generateBlogPost - A function that generates a blog post from a topic.
 * - GenerateBlogPostInput - The input type for the generateBlogPost function.
 * - GenerateBlogPostOutput - The return type for the generateBlogPost function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateBlogPostInputSchema = z.object({
  topic: z.string().describe('The topic of the blog post to generate.'),
});
export type GenerateBlogPostInput = z.infer<typeof GenerateBlogPostInputSchema>;

const GenerateBlogPostOutputSchema = z.object({
  title: z.string().describe('The catchy, SEO-friendly title of the blog post.'),
  content: z
    .string()
    .describe(
      'The full content of the blog post in Markdown format. It should be well-structured with headings, lists, and bold text.'
    ),
  coverImageHint: z
    .string()
    .describe(
      'Two keywords that describe a suitable cover image for the blog post. For example: "chickens farm".'
    ),
  slug: z
    .string()
    .describe(
      'A URL-friendly slug for the blog post (e.g., "tips-for-reducing-broiler-mortality").'
    ),
  metaTitle: z
    .string()
    .describe(
      'A concise and SEO-optimized title for search engine results (under 60 characters).'
    ),
  metaDescription: z
    .string()
    .describe(
      'A compelling summary for search engine results (under 160 characters).'
    ),
});
export type GenerateBlogPostOutput = z.infer<
  typeof GenerateBlogPostOutputSchema
>;

export async function generateBlogPost(
  input: GenerateBlogPostInput
): Promise<GenerateBlogPostOutput> {
  return generateBlogPostFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateBlogPostPrompt',
  input: {schema: GenerateBlogPostInputSchema},
  output: {schema: GenerateBlogPostOutputSchema},
  prompt: `You are an expert content writer and SEO specialist for "Poultry Mitra," an Indian poultry farm management app.

Your task is to write a helpful, engaging, and SEO-optimized blog post on the following topic: {{{topic}}}.

The blog post should be written in Markdown format. It must be well-structured with a clear title, headings, subheadings, and bullet points or numbered lists where appropriate.

The tone should be informative, encouraging, and tailored to an audience of Indian poultry farmers and dealers.

IMPORTANT: Start the article with a "Table of Contents" section that contains a bulleted list of links to the main H2 and H3 headings in the article. For example:
- [Why Poultry Farming is Profitable](#why-poultry-farming-is-profitable)
- [Government Schemes](#government-schemes)

After writing the content, you MUST generate the following SEO metadata:
1.  **slug**: A URL-friendly version of the title.
2.  **metaTitle**: A concise title for search engines, under 60 characters.
3.  **metaDescription**: A compelling summary for search results, under 160 characters.
4.  **coverImageHint**: A two-word hint for a suitable cover image for this blog post.`,
});

const generateBlogPostFlow = ai.defineFlow(
  {
    name: 'generateBlogPostFlow',
    inputSchema: GenerateBlogPostInputSchema,
    outputSchema: GenerateBlogPostOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (!output) {
      throw new Error("Failed to generate blog post text.");
    }
    return output;
  }
);
