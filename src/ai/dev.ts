
import { config } from 'dotenv';
config();

// Prevent these from being included in production builds
if (process.env.NODE_ENV === 'development') {
    require('@/ai/flows/disease-detection.ts');
    require('@/ai/flows/dealer-ai-advisory.ts');
    require('@/ai/flows/feed-cost-mortality-calculator.ts');
    require('@/ai/flows/smart-advisory.ts');
    require('@/ai/flows/ai-powered-whatsapp-drafts.ts');
    require('@/ai/flows/generate-blog-post.ts');
    require('@/ai/flows/translate-content.ts');
    require('@/ai/flows/chat.ts');
    require('@/ai/flows/tts.ts');
    require('@/ai/flows/extract-rates-from-image.ts');
    require('@/ai/flows/extract-rates-from-text.ts');
    require('@/ai/flows/extract-rates-from-url.ts');
    require('@/ai/flows/moderate-content.ts');
}
