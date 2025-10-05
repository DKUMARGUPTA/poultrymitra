// src/app/admin/settings/api-keys/actions.ts
'use server';

import { promises as fs } from 'fs';
import { revalidatePath } from 'next/cache';
import { ai } from '@/ai/genkit';
import { listModels } from 'genkit';

export type ApiKeyStatus = 'Valid' | 'Invalid' | 'Not Set';

async function getApiKeyStatus(): Promise<ApiKeyStatus> {
    try {
        const models = await listModels();
        if (Object.keys(models).length > 0) {
            return 'Valid';
        }
        return 'Invalid';
    } catch (e: any) {
        console.error("API Key Test Failed:", e.message);
        return 'Invalid';
    }
}

export async function testApiKey(): Promise<ApiKeyStatus> {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
        return 'Not Set';
    }
    // Re-initialize genkit within the server action to pick up the latest env var
    ai.configure({
        plugins: [
            require('@genkit-ai/googleai').googleAI({ apiKey: key }),
        ],
    });

    return getApiKeyStatus();
}

export async function updateApiKey(newApiKey: string): Promise<{ success: boolean; message: string }> {
    try {
        if (!newApiKey.trim()) {
            return { success: false, message: "API Key cannot be empty." };
        }

        const envPath = `${process.cwd()}/.env`;
        let envContent = '';
        try {
            envContent = await fs.readFile(envPath, 'utf-8');
        } catch (e: any) {
            if (e.code !== 'ENOENT') throw e;
        }

        const key = 'GEMINI_API_KEY';
        const regex = new RegExp(`^${key}=.*$`, 'm');

        if (envContent.match(regex)) {
            envContent = envContent.replace(regex, `${key}=${newApiKey}`);
        } else {
            envContent += `\n${key}=${newApiKey}`;
        }

        await fs.writeFile(envPath, envContent);

        revalidatePath('/admin/settings/api-keys');

        return { success: true, message: 'Gemini API Key has been updated.' };

    } catch (error: any) {
        console.error("Failed to update .env file", error);
        return { success: false, message: 'Failed to update API Key.' };
    }
}
