
'use server';

/**
 * @fileOverview An AI agent for dealer advisory on stock planning and payment tracking.
 *
 * - dealerAiAdvisory - A function that provides AI-driven advice for dealers.
 * - DealerAiAdvisoryInput - The input type for the dealerAiAdvisory function.
 * - DealerAiAdvisoryOutput - The return type for the dealerAiAdvisory function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { getInventoryItems } from '@/services/inventory.service';
import { getTransactionsForUser } from '@/services/transactions.service';

const DealerAiAdvisoryInputSchema = z.object({
  dealerId: z.string().describe('The ID of the dealer requesting the advisory.'),
  businessSummary: z
    .string()
    .describe('A summary of the dealer business operations.'),
  marketTrends: z.string().describe('Current market trends in the poultry industry.'),
  language: z.enum(['English', 'Hindi']).describe('The desired language for the response.'),
});
export type DealerAiAdvisoryInput = z.infer<typeof DealerAiAdvisoryInputSchema>;

const DealerAiAdvisoryOutputSchema = z.object({
  stockPlanningAdvice: z.string().describe('AI-driven advice for stock planning.'),
  paymentTrackingAdvice: z.string().describe('AI-driven advice for payment tracking.'),
});
export type DealerAiAdvisoryOutput = z.infer<typeof DealerAiAdvisoryOutputSchema>;

export async function dealerAiAdvisory(input: DealerAiAdvisoryInput): Promise<DealerAiAdvisoryOutput> {
  try {
    return await dealerAiAdvisoryFlow(input);
  } catch (e: any) {
    if (e.message && e.message.includes('429')) {
      throw new Error(
        'You have exceeded the API rate limit. Please wait a moment and try again.'
      );
    }
    throw e;
  }
}

// Define a new internal prompt context schema
const InternalPromptContextSchema = z.object({
  businessSummary: z.string(),
  currentInventory: z.string(),
  paymentTrackingData: z.string(),
  marketTrends: z.string(),
  language: z.enum(['English', 'Hindi']),
});

const prompt = ai.definePrompt({
  name: 'dealerAiAdvisoryPrompt',
  input: {schema: InternalPromptContextSchema},
  output: {schema: DealerAiAdvisoryOutputSchema},
  prompt: `You are an AI assistant providing advisory services to poultry dealers.

  Your response MUST be in the following language: {{{language}}}.

  Based on the provided business summary, current inventory, payment tracking data, and market trends, provide advice on stock planning and payment tracking.

  Business Summary: {{{businessSummary}}}
  Current Inventory: {{{currentInventory}}}
  Payment Tracking Data: {{{paymentTrackingData}}}
  Market Trends: {{{marketTrends}}}

  Provide actionable insights for both stock planning and payment tracking, which will be set in the stockPlanningAdvice and paymentTrackingAdvice output fields. The output should be concise, and well-formatted.
  `,
});

const dealerAiAdvisoryFlow = ai.defineFlow(
  {
    name: 'dealerAiAdvisoryFlow',
    inputSchema: DealerAiAdvisoryInputSchema,
    outputSchema: DealerAiAdvisoryOutputSchema,
  },
  async input => {
    // This is a simplified, one-shot fetch.
    const inventoryItems = await getInventoryItems(input.dealerId);
    const inventory = inventoryItems.map(i => `${i.name}: ${i.quantity} ${i.unit}`).join(', ');

    const trans = await getTransactionsForUser(input.dealerId, true);
    const pending = trans.filter(t => t.status === 'Pending');
    const totalPending = pending.reduce((sum, t) => sum + t.amount, 0);
    const transactions = `Total pending payments: ₹${totalPending.toLocaleString()} from ${pending.length} transactions.`;

    const internalContext: z.infer<typeof InternalPromptContextSchema> = {
        businessSummary: input.businessSummary,
        currentInventory: inventory || "No inventory data found.",
        paymentTrackingData: transactions || "No transaction data found.",
        marketTrends: input.marketTrends,
        language: input.language
    };

    const {output} = await prompt(internalContext);
    return output!;
  }
);
