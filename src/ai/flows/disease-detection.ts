
// src/ai/flows/disease-detection.ts
'use server';
/**
 * @fileOverview A disease detection AI agent.
 *
 * - diseaseDetection - A function that handles the disease detection process.
 * - DiseaseDetectionInput - The input type for the diseaseDetection function.
 * - DiseaseDetectionOutput - The return type for the diseaseDetection function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DiseaseDetectionInputSchema = z.object({
  ageInDays: z.number().int().positive().describe('The age of the affected bird in days.'),
  symptomsDuration: z.string().min(1).describe('How long the symptoms have been observed (e.g., "2 days", "since morning").'),
  symptoms: z.string().describe('The symptoms observed in the poultry.'),
  language: z.enum(['English', 'Hindi']).describe('The desired language for the response.'),
});
export type DiseaseDetectionInput = z.infer<typeof DiseaseDetectionInputSchema>;

const DiseaseDetectionOutputSchema = z.object({
  possibleIssues: z.string().describe('Possible diseases or issues based on the symptoms.'),
  suggestions: z.string().describe('Suggestions for treatment or further investigation.'),
});
export type DiseaseDetectionOutput = z.infer<typeof DiseaseDetectionOutputSchema>;

export async function diseaseDetection(input: DiseaseDetectionInput): Promise<DiseaseDetectionOutput> {
  return diseaseDetectionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'diseaseDetectionPrompt',
  input: {schema: DiseaseDetectionInputSchema},
  output: {schema: DiseaseDetectionOutputSchema},
  prompt: `You are an expert veterinarian specializing in poultry diseases.

You will use the information provided to diagnose possible issues and suggest treatments.

Your response MUST be in the following language: {{{language}}}.

Bird's Age: {{{ageInDays}}} days
Symptom Duration: {{{symptomsDuration}}}
Symptoms: {{{symptoms}}}
`,
});

const diseaseDetectionFlow = ai.defineFlow(
  {
    name: 'diseaseDetectionFlow',
    inputSchema: DiseaseDetectionInputSchema,
    outputSchema: DiseaseDetectionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
