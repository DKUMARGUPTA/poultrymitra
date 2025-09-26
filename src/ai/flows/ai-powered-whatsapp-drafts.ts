
'use server';

/**
 * @fileOverview AI-powered WhatsApp draft generation for payment reminders and disease alerts.
 *
 * This file defines a Genkit flow that generates WhatsApp drafts for premium users (farmers and dealers).
 * It includes functions for generating drafts for payment reminders and disease alerts.
 *
 * - generateWhatsAppDraft - A function that generates a WhatsApp draft message.
 * - GenerateWhatsAppDraftInput - The input type for the generateWhatsAppDraft function.
 * - GenerateWhatsAppDraftOutput - The return type for the generateWhatsAppDraft function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateWhatsAppDraftInputSchema = z.object({
  userType: z.enum(['farmer', 'dealer']).describe('The type of user requesting the draft.'),
  draftType: z.enum(['paymentReminder', 'diseaseAlert']).describe('The type of draft to generate.'),
  contactName: z.string().describe('The name of the contact to send the message to.'),
  language: z.enum(['English', 'Hindi']).describe('The desired language for the response.'),
  amount: z.number().optional().describe('The amount due in the payment reminder (if applicable).'),
  disease: z.string().optional().describe('The name of the disease detected (if applicable).'),
  symptoms: z.string().optional().describe('The symptoms observed (if applicable).'),
});
export type GenerateWhatsAppDraftInput = z.infer<typeof GenerateWhatsAppDraftInputSchema>;

const GenerateWhatsAppDraftOutputSchema = z.object({
  draftMessage: z.string().describe('The generated WhatsApp draft message.'),
});
export type GenerateWhatsAppDraftOutput = z.infer<typeof GenerateWhatsAppDraftOutputSchema>;

export async function generateWhatsAppDraft(input: GenerateWhatsAppDraftInput): Promise<GenerateWhatsAppDraftOutput> {
  return generateWhatsAppDraftFlow(input);
}

const generateWhatsAppDraftPrompt = ai.definePrompt({
  name: 'generateWhatsAppDraftPrompt',
  input: {
    schema: GenerateWhatsAppDraftInputSchema,
  },
  output: {
    schema: GenerateWhatsAppDraftOutputSchema,
  },
  prompt: `You are a helpful assistant that generates WhatsApp draft messages for farmers and dealers.

  Your response MUST be in the following language: {{{language}}}.

  The user is a {{userType}} and wants to generate a draft message of type {{draftType}} for their contact {{contactName}}.

  {{#if amount}}
  Generate a payment reminder message for the amount of {{amount}}.
  {{/if}}

  {{#if disease}}
  Generate a disease alert message for the disease {{disease}}. The observed symptoms are: {{symptoms}}.
  {{/if}}

  The draft message should be concise and professional.

  Here is the generated draft message:
  `,
});

const generateWhatsAppDraftFlow = ai.defineFlow(
  {
    name: 'generateWhatsAppDraftFlow',
    inputSchema: GenerateWhatsAppDraftInputSchema,
    outputSchema: GenerateWhatsAppDraftOutputSchema,
  },
  async input => {
    const {output} = await generateWhatsAppDraftPrompt(input);
    return output!;
  }
);
