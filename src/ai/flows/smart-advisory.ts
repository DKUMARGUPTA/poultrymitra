'use server';

/**
 * @fileOverview AI-powered smart advisory for farmers on batch health and growth rate.
 *
 * - getSmartAdvisory - A function that generates smart advisories for farmers.
 * - SmartAdvisoryInput - The input type for the getSmartAdvisory function.
 * - SmartAdvisoryOutput - The return type for the getSmartAdvisory function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SmartAdvisoryInputSchema = z.object({
  batchHealth: z.string().describe('The current health status of the batch.'),
  growthRate: z.string().describe('The current growth rate of the batch.'),
  language: z.enum(['English', 'Hindi']).describe('The desired language for the response.'),
  historicalData: z
    .string()
    .optional()
    .describe('Historical data of the batch for trend analysis.'),
});
export type SmartAdvisoryInput = z.infer<typeof SmartAdvisoryInputSchema>;

const SmartAdvisoryOutputSchema = z.object({
  advisory: z.string().describe('The generated smart advisory for the farmer.'),
  confidenceScore: z
    .number()
    .optional()
    .describe('Confidence score of the advisory.'),
});
export type SmartAdvisoryOutput = z.infer<typeof SmartAdvisoryOutputSchema>;

export async function getSmartAdvisory(input: SmartAdvisoryInput): Promise<SmartAdvisoryOutput> {
  return smartAdvisoryFlow(input);
}

const smartAdvisoryPrompt = ai.definePrompt({
  name: 'smartAdvisoryPrompt',
  input: {schema: SmartAdvisoryInputSchema},
  output: {schema: SmartAdvisoryOutputSchema},
  prompt: `You are an AI assistant providing smart advisories to farmers regarding their batch health and growth rate.

  Your response MUST be in the following language: {{{language}}}.

  Based on the following information, generate a concise and actionable advisory.

  Batch Health: {{{batchHealth}}}
  Growth Rate: {{{growthRate}}}
  Historical Data: {{{historicalData}}}

  Advisory:`,
});

const smartAdvisoryFlow = ai.defineFlow(
  {
    name: 'smartAdvisoryFlow',
    inputSchema: SmartAdvisoryInputSchema,
    outputSchema: SmartAdvisoryOutputSchema,
  },
  async input => {
    const {output} = await smartAdvisoryPrompt(input);
    return output!;
  }
);
