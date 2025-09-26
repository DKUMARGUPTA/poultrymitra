
'use server';
/**
 * @fileOverview An AI agent that extracts market rate data from a block of text.
 *
 * - extractRatesFromText - Extracts structured market rate data from text.
 * - ExtractRatesFromTextInput - The input type for the flow.
 * - ExtractRatesFromTextOutput - The return type for the flow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { BirdSizes } from '@/services/market-rates.service';

const RateSchema = z.object({
    date: z.string().describe("The date of the rate in YYYY-MM-DD format. Infer from the text or use today's date if not present."),
    state: z.string().describe("The Indian state for the rate."),
    district: z.string().describe("The district or city for the rate."),
    size: z.enum(BirdSizes).describe("The size of the bird (Small, Medium, or Big)."),
    rate: z.number().describe("The price per kg for that size."),
});

const ExtractRatesFromTextInputSchema = z.object({
  text: z.string().describe("A block of text containing poultry market rates, likely copied from a website or a messaging app."),
  currentDate: z.string().describe("Today's date in YYYY-MM-DD format, to be used if the date is not in the text.")
});
export type ExtractRatesFromTextInput = z.infer<typeof ExtractRatesFromTextInputSchema>;

const ExtractRatesFromTextOutputSchema = z.object({
  rates: z.array(RateSchema),
});
export type ExtractRatesFromTextOutput = z.infer<typeof ExtractRatesFromTextOutputSchema>;

export async function extractRatesFromText(input: ExtractRatesFromTextInput): Promise<ExtractRatesFromTextOutput> {
  return extractRatesFromTextFlow(input);
}

const prompt = ai.definePrompt({
  name: 'extractRatesFromTextPrompt',
  input: { schema: ExtractRatesFromTextInputSchema },
  output: { schema: ExtractRatesFromTextOutputSchema },
  prompt: `You are an expert at parsing poultry market rate information from unstructured text from India. Your task is to extract all rate information from the provided text.

Look for the date, state, and district (or city). If the date is not present in the text, use the provided current date: {{{currentDate}}}.
For each location, identify the rates for different bird sizes (Small, Medium, Big).

Return the data as a structured array of rate objects.

Text to analyze:
---
{{{text}}}
---`,
});

const extractRatesFromTextFlow = ai.defineFlow(
  {
    name: 'extractRatesFromTextFlow',
    inputSchema: ExtractRatesFromTextInputSchema,
    outputSchema: ExtractRatesFromTextOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
