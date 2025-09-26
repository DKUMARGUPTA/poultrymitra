
'use server';
/**
 * @fileOverview An AI agent for translating content.
 *
 * - translateContent - A function that translates content to a target language.
 * - TranslateContentInput - The input type for the translateContent function.
 * - TranslateContentOutput - The return type for the translateContent function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TranslateContentInputSchema = z.object({
  content: z.string().describe('The content to be translated, likely in Markdown format.'),
  targetLanguage: z.enum(['English', 'Hindi']).describe('The language to translate the content into.'),
});
export type TranslateContentInput = z.infer<typeof TranslateContentInputSchema>;

const TranslateContentOutputSchema = z.object({
  translatedContent: z.string().describe('The translated content, maintaining the original Markdown structure.'),
});
export type TranslateContentOutput = z.infer<typeof TranslateContentOutputSchema>;

export async function translateContent(input: TranslateContentInput): Promise<TranslateContentOutput> {
  return translateContentFlow(input);
}

const prompt = ai.definePrompt({
  name: 'translateContentPrompt',
  input: {schema: TranslateContentInputSchema},
  output: {schema: TranslateContentOutputSchema},
  prompt: `You are an expert translator specializing in technical and agricultural content for an Indian audience. Your task is to translate the following content into {{targetLanguage}}.

IMPORTANT:
- Maintain the original Markdown formatting (headings, lists, bold text, etc.).
- Ensure the translation is natural and accurate for the target language.
- Do not add any extra commentary or text outside of the translated content itself.

Content to translate:
---
{{{content}}}
---
`,
});

const translateContentFlow = ai.defineFlow(
  {
    name: 'translateContentFlow',
    inputSchema: TranslateContentInputSchema,
    outputSchema: TranslateContentOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
