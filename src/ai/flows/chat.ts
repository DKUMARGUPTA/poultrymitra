
'use server';
/**
 * @fileOverview An AI chat agent that can answer questions about a user's farm data.
 * This agent uses tools to fetch real-time information from the database.
 *
 * - chat - The main chat function that orchestrates the AI's response.
 */
import { ai } from '@/ai/genkit';
import {
  getFarmerDashboardStats,
  getDealerDashboardStats,
} from '@/services/dashboard.service';
import { getBatchesByFarmer, Batch } from '@/services/batches.service';
import { getDailyEntriesForBatch } from '@/services/daily-entries.service';
import { getFarmer, getFarmersByDealer, Farmer } from '@/services/farmers.service';
import {
  getTransactionsForUser,
  Transaction,
} from '@/services/transactions.service';
import { getUserProfile } from '@/services/users.service';
import { getChatHistory } from '@/services/chat.service';
import { z } from 'genkit';
import { Message, Part } from 'genkit';

// Common context for all tools
const ToolContextSchema = z.object({
    userId: z.string().describe("The ID of the user asking the question."),
});

// ##################
// # DEALER TOOLS
// ##################
const getDealerSummary = ai.defineTool(
  {
    name: 'getDealerSummary',
    description:
      "Provides a high-level summary of the dealer's business performance, including total farmers, outstanding balances, and current stock value. Use for general questions about the dealer's overall business health.",
    inputSchema: ToolContextSchema,
    outputSchema: z.string().describe('A summary of the dealer\'s business performance.'),
  },
  async ({ userId }) => {
    const stats = await getDealerDashboardStats(userId);
    return `Dealer Summary: You have ${stats.totalFarmers} farmers, with a total outstanding balance of ₹${stats.pendingPayments}. Your current estimated stock value is ₹${stats.stockValue}.`;
  }
);

const getFarmersWithOutstandingBalances = ai.defineTool(
  {
    name: 'getFarmersWithOutstandingBalances',
    description:
      "For dealers, lists the farmers who owe them money. Use when the dealer asks 'who owes me money?', 'list outstanding balances', or similar questions.",
    inputSchema: ToolContextSchema,
    outputSchema: z.string(),
  },
  async ({ userId }) => {
      const farmers: Farmer[] = await getFarmersByDealer(userId);
      const owingFarmers = farmers.filter((f) => f.outstanding > 0);
      if (owingFarmers.length === 0)
        return 'All farmers have cleared their balances.';
      return `Farmers with outstanding balances: ${owingFarmers.map((f) => `${f.name} (₹${f.outstanding})`).join(', ')}.`;
  }
);


// ##################
// # FARMER TOOLS
// ##################

const getFarmerSummary = ai.defineTool(
  {
    name: 'getFarmerSummary',
    description:
      "Provides a high-level summary of the farmer's farm performance, including active batches, mortality rates, and their outstanding balance with their dealer. Use this for general questions about the farmer's performance.",
    inputSchema: ToolContextSchema,
    outputSchema: z.string().describe('A summary of the farmer\'s farm performance.'),
  },
  async ({ userId }) => {
    const stats = await getFarmerDashboardStats(userId);
    return `Farmer Summary: You have ${stats.activeBatches} active batches. Your average mortality rate is ${stats.avgMortalityRate.toFixed(2)}%, and your outstanding balance with your dealer is ₹${stats.outstandingBalance}.`;
  }
);


const getFarmerBatchDetails = ai.defineTool(
  {
    name: 'getFarmerBatchDetails',
    description:
      'Fetches detailed information about a specific poultry batch for a farmer, such as its name, start date, bird count, mortality, and feed consumption. Use this when the farmer asks about a specific batch.',
    inputSchema: z.object({
        userId: z.string().describe("The ID of the farmer."),
        batchName: z.string().optional().describe('The name of the batch to look for. e.g., "latest batch", "batch #12". If not provided, assumes the latest batch.'),
    }),
    outputSchema: z.string().describe('A detailed summary of the batch, or a message indicating it was not found.'),
  },
  async ({ userId, batchName }) => {
      const batches: Batch[] = await getBatchesByFarmer(userId);

      if (batches.length === 0) {
        return 'No batches found for this farmer.';
      }

      // Simple logic to find the "latest" batch if no name is given.
      // In a real app, you might match by name more intelligently.
      const batch = batches[0];

      const entries = await getDailyEntriesForBatch(batch.id);

      const totalMortality = entries.reduce((sum, entry) => sum + entry.mortality, 0);
      const totalFeed = entries.reduce((sum, entry) => sum + entry.feedConsumedInKg, 0);
      const currentBirdCount = batch.initialBirdCount - totalMortality;

      return `Details for batch "${batch.name}": Started on ${batch.startDate}, initial count was ${batch.initialBirdCount}. Current bird count is ${currentBirdCount}. Total mortality: ${totalMortality}. Total feed consumed: ${totalFeed} kg.`;
  }
);

const getFarmerOutstandingBalance = ai.defineTool(
  {
    name: 'getFarmerOutstandingBalance',
    description:
      "Shows a farmer their own outstanding balance with their dealer. Use when asked 'what is my balance?', 'how much do I owe?', or similar questions.",
    inputSchema: ToolContextSchema,
    outputSchema: z.string(),
  },
  async ({ userId }) => {
      const farmer = await getFarmer(userId);
      return `Your current outstanding balance with your dealer is ₹${farmer?.outstanding || 0}.`;
  }
);


// ##################
// # GENERIC TOOLS
// ##################
const listRecentTransactions = ai.defineTool(
  {
    name: 'listRecentTransactions',
    description:
      'Lists the most recent financial transactions for the user. Use when asked about "last few transactions", "recent payments", or "latest sales".',
    inputSchema: z.object({
      userId: z.string().describe('The ID of the user.'),
      limit: z.number().optional().default(5).describe('Number of transactions to return.'),
    }),
    outputSchema: z.string(),
  },
  async ({ userId, limit }) => {
    const transactions = await getTransactionsForUser(userId);
    if (transactions.length === 0) return 'No transactions found.';

    return `Here are your last ${Math.min(limit!, transactions.length)} transactions: ${transactions.slice(0, limit).map((t) => `${t.description} (₹${t.amount})`).join('; ')}.`;
  }
);


export async function chat(params: {
  message: string;
  userId: string;
}): Promise<string> {
  const user = await getUserProfile(params.userId);
  const userRole = user?.role || 'user';

  let systemPrompt = "You are a helpful AI assistant for 'Poultry Mitra', an Indian poultry farm management app. Your role is to answer questions based on the user's data by using the provided tools. Be friendly, concise, and helpful. Format your responses in clear, readable markdown.";
  let tools = [listRecentTransactions];

  if (userRole === 'dealer') {
    systemPrompt += " The user is a dealer. Use dealer-specific tools to answer questions about their network of farmers and their overall business.";
    tools.push(getDealerSummary, getFarmersWithOutstandingBalances);
  } else if (userRole === 'farmer') {
    systemPrompt += " The user is a farmer. Use farmer-specific tools to answer questions about their batches and their balance with their dealer.";
    tools.push(getFarmerSummary, getFarmerBatchDetails, getFarmerOutstandingBalance);
  }

  const model = ai.model('googleai/gemini-2.5-flash', {
    tools: tools,
    system: systemPrompt,
  });

  const { message, userId } = params;

  // Fetch chat history from Firestore
  const history: Message[] = await getChatHistory(userId);

  const { text } = await ai.generate({
    model: model,
    prompt: message,
    history: history,
    // Pass the user ID to the tools' context
    context: { userId },
  });
  return text;
}
