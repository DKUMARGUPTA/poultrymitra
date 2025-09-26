
'use server';
/**
 * @fileOverview An AI agent that extracts market rate data from an image.
 *
 * - extractRatesFromImage - Extracts structured market rate data from an image.
 * - ExtractRatesFromImageInput - The input type for the flow.
 * - ExtractRatesFromImageOutput - The return type for the flow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { BirdSizes } from '@/services/market-rates.service';

const RateSchema = z.object({
    date: z.string().describe("The date of the rate in YYYY-MM-DD format. Infer from the image or use today's date if not present."),
    state: z.string().describe("The Indian state for the rate."),
    district: z.string().describe("The district or city for the rate."),
    size: z.enum(BirdSizes).describe("The size of the bird (Small, Medium, or Big)."),
    rate: z.number().describe("The price per kg for that size."),
});

const ExtractRatesFromImageInputSchema = z.object({
  imageUrl: z
    .string()
    .url()
    .describe(
      "A public URL of a photo of a market rate board."
    ),
  currentDate: z.string().describe("Today's date in YYYY-MM-DD format, to be used if the date is not in the image.")
});
export type ExtractRatesFromImageInput = z.infer<typeof ExtractRatesFromImageInputSchema>;

const ExtractRatesFromImageOutputSchema = z.object({
  rates: z.array(RateSchema),
});
export type ExtractRatesFromImageOutput = z.infer<typeof ExtractRatesFromImageOutputSchema>;

export async function extractRatesFromImage(input: ExtractRatesFromImageInput): Promise<ExtractRatesFromImageOutput> {
  return extractRatesFromImageFlow(input);
}

const prompt = ai.definePrompt({
  name: 'extractRatesFromImagePrompt',
  input: { schema: ExtractRatesFromImageInputSchema },
  output: { schema: ExtractRatesFromImageOutputSchema },
  prompt: `You are an expert at reading poultry market rate boards from India. Your task is to extract all rate information from the provided image.

Look for the date, state, and district (or city). If the date is not present in the image, use the provided current date: {{{currentDate}}}.
For each location, identify the rates for different bird sizes (Small, Medium, Big).

Return the data as a structured array of rate objects.

Image to analyze: {{media url=imageUrl}}`,
});

const extractRatesFromImageFlow = ai.defineFlow(
  {
    name: 'extractRatesFromImageFlow',
    inputSchema: ExtractRatesFromImageInputSchema,
    outputSchema: ExtractRatesFromImageOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
