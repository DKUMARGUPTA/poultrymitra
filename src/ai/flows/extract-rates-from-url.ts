
'use server';
/**
 * @fileOverview An AI agent that extracts market rate data from a given URL.
 * It can read text and also analyze images found on the webpage.
 *
 * - extractRatesFromUrl - Extracts structured market rate data by fetching content from a URL.
 * - getWebsiteContentAndImages - A Genkit tool for fetching text and image URLs from a webpage.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import fetch from 'node-fetch';
import { BirdSizes } from '@/services/market-rates.service';

const RateSchema = z.object({
    date: z.string().describe("The date of the rate in YYYY-MM-DD format. Infer from the text or use today's date if not present."),
    state: z.string().describe("The Indian state for the rate."),
    district: z.string().describe("The district or city for the rate."),
    size: z.enum(BirdSizes).describe("The size of the bird (Small, Medium, or Big)."),
    rate: z.number().describe("The price per kg for that size."),
});

const ExtractRatesFromUrlInputSchema = z.object({
  url: z.string().url().describe('The URL to extract market rates from.'),
  currentDate: z.string().describe("Today's date in YYYY-MM-DD format, to be used if the date is not in the text.")
});
export type ExtractRatesFromUrlInput = z.infer<typeof ExtractRatesFromUrlInputSchema>;

const ExtractRatesFromUrlOutputSchema = z.object({
  rates: z.array(RateSchema),
});
export type ExtractRatesFromUrlOutput = z.infer<typeof ExtractRatesFromUrlOutputSchema>;

const WebContentSchema = z.object({
    textContent: z.string().describe("The extracted text from the webpage."),
    imageUrls: z.array(z.string().url()).describe("A list of image URLs found on the page."),
});

// Tool to get website content and image URLs
const getWebsiteContentAndImages = ai.defineTool(
  {
    name: 'getWebsiteContentAndImages',
    description: 'Fetches the text content and all image URLs from a given webpage URL. Useful for reading articles or analyzing images on a page.',
    inputSchema: z.object({ url: z.string().url().describe('The URL of the webpage to fetch.') }),
    outputSchema: WebContentSchema,
  },
  async (input) => {
    try {
        const response = await fetch(input.url);
        if (!response.ok) {
            return { textContent: `Error: Could not fetch content from ${input.url}. Status: ${response.statusText}`, imageUrls: [] };
        }
        const html = await response.text();
        
        // Simple regex to strip HTML tags for text content
        const textContent = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

        // Regex to find image URLs
        const imageUrls = Array.from(html.matchAll(/<img[^>]+src="([^">]+)"/g))
                            .map(match => match[1])
                            .filter(url => url.startsWith('http')); // Filter for absolute URLs

        return { textContent, imageUrls };
    } catch (error: any) {
        return { textContent: `Error fetching URL: ${error.message}`, imageUrls: [] };
    }
  }
);

export async function extractRatesFromUrl(input: ExtractRatesFromUrlInput): Promise<ExtractRatesFromUrlOutput> {
  return extractRatesFromUrlFlow(input);
}

const extractRatesFromUrlFlow = ai.defineFlow(
  {
    name: 'extractRatesFromUrlFlow',
    inputSchema: ExtractRatesFromUrlInputSchema,
    outputSchema: ExtractRatesFromUrlOutputSchema,
  },
  async (input) => {
    const prompt = `You are an expert at parsing poultry market rate information from India.
    Your task is to extract all rate information from the content of the provided URL: ${input.url}.

    Use the 'getWebsiteContentAndImages' tool to fetch the content of the webpage.
    
    First, analyze the 'textContent' from the tool's output. Try to find the market rates directly in the text.
    
    If you cannot find any rates in the text, analyze the 'imageUrls' list. Look for image URLs that seem relevant to market rates (e.g., filenames containing 'rate', 'board', 'chart'). 
    If you find a likely image, analyze the image content to find the rates. You can analyze an image using the syntax: {{media url="<image_url>"}}.

    Look for the date, state, and district (or city). If the date is not present, use the provided current date: ${input.currentDate}.
    For each location, identify the rates for different bird sizes (Small, Medium, Big).

    Return the data as a structured array of rate objects. If you cannot find any rates in the text or the images, return an empty array.`;

    const { output } = await ai.generate({
      model: 'googleai/gemini-2.5-flash',
      tools: [getWebsiteContentAndImages],
      prompt: prompt,
      output: { schema: ExtractRatesFromUrlOutputSchema },
    });

    return output!;
  }
);
