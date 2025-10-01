import {genkit, GenkitPlugin} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

const plugins: GenkitPlugin[] = [];

if (process.env.GEMINI_API_KEY) {
    plugins.push(googleAI({apiKey: process.env.GEMINI_API_KEY}));
} else {
    console.warn("GEMINI_API_KEY is not set. AI features will be disabled.");
}

export const ai = genkit({
  plugins,
  model: 'googleai/gemini-2.5-flash',
});
