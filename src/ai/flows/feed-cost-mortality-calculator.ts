
// file: src/ai/flows/feed-cost-mortality-calculator.ts
'use server';

/**
 * @fileOverview Calculates feed cost and mortality rate for farmers.
 *
 * - calculateFeedCostAndMortality - A function that calculates the feed cost and mortality rate.
 * - CalculateFeedCostAndMortalityInput - The input type for the calculateFeedCostAndMortality function.
 * - CalculateFeedCostAndMortalityOutput - The return type for the calculateFeedCostAndMortality function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CalculateFeedCostAndMortalityInputSchema = z.object({
  initialChickCount: z
    .number()
    .describe('The initial number of chicks in the batch.'),
  finalChickCount: z
    .number()
    .describe('The number of chicks remaining at the end of the period.'),
  feedCostPerBag: z
    .number()
    .describe('The cost of one bag of feed in local currency.'),
  bagsOfFeedUsed: z
    .number()
    .describe('The total number of bags of feed used during the period.'),
  averageChickWeight: z
    .number()
    .describe('The average weight of a chick at the end of the period (in kg).'),
});
export type CalculateFeedCostAndMortalityInput = z.infer<
  typeof CalculateFeedCostAndMortalityInputSchema
>;

const CalculateFeedCostAndMortalityOutputSchema = z.object({
  mortalityRate: z
    .number()
    .describe('The mortality rate, expressed as a percentage.'),
  totalFeedCost: z
    .number()
    .describe('The total cost of feed used during the period.'),
  feedConversionRatio: z
    .number()
    .describe(
      'The feed conversion ratio (FCR), representing kg of feed per kg of weight gain.'
    ),
  costPerKgOfChicken: z
    .number()
    .describe('The feed cost per kg of chicken produced.'),
});
export type CalculateFeedCostAndMortalityOutput = z.infer<
  typeof CalculateFeedCostAndMortalityOutputSchema
>;

export async function calculateFeedCostAndMortality(
  input: CalculateFeedCostAndMortalityInput
): Promise<CalculateFeedCostAndMortalityOutput> {
  return calculateFeedCostAndMortalityFlow(input);
}

const calculateFeedCostAndMortalityFlow = ai.defineFlow(
  {
    name: 'calculateFeedCostAndMortalityFlow',
    inputSchema: CalculateFeedCostAndMortalityInputSchema,
    outputSchema: CalculateFeedCostAndMortalityOutputSchema,
  },
  async input => {
    // Perform calculations directly. No need for an LLM prompt for this.
    const mortalityRate =
      input.initialChickCount > 0
        ? ((input.initialChickCount - input.finalChickCount) / input.initialChickCount) * 100
        : 0;

    const totalFeedCost = input.feedCostPerBag * input.bagsOfFeedUsed;
    const totalWeightGain = input.finalChickCount * input.averageChickWeight;
    const totalFeedUsedInKg = input.bagsOfFeedUsed * 50; // Assuming each bag is 50kg

    const feedConversionRatio =
      totalWeightGain > 0 ? totalFeedUsedInKg / totalWeightGain : 0;
      
    const costPerKgOfChicken =
      totalWeightGain > 0 ? totalFeedCost / totalWeightGain : 0;

    // Return the calculated values in the expected output format
    return {
      mortalityRate,
      totalFeedCost,
      feedConversionRatio,
      costPerKgOfChicken,
    };
  }
);
