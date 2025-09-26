
// src/app/blog/daily-feed-mortality-tracking-guide/page.tsx
import { LandingPageHeader } from '@/components/landing-page-header';
import { AnimatedLogo } from '@/components/animated-logo';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';
import ReactMarkdown from 'react-markdown';
import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next'
import { ShareButton } from '@/components/share-button';

export const metadata: Metadata = {
  title: 'पोल्ट्री फार्म में डेली फीड और मॉर्टालिटी की एंट्री कैसे करें? | Poultry Mitra',
  description: 'FCR, प्रॉफिट और नुकसान का सही हिसाब रखने के लिए पोल्ट्री फार्म में डेली फीड और मॉर्टालिटी की एंट्री करने का आसान तरीका जानें। Poultry Mitra के साथ अपने फार्म को मैनेज करें।',
  openGraph: {
    title: 'पोल्ट्री फार्म में डेली फीड और मॉर्टालिटी की एंट्री कैसे करें?',
    description: 'FCR और प्रॉफिट का सही हिसाब रखने के लिए दैनिक डेटा एंट्री का पूरा गाइड।',
    images: ['https://source.unsplash.com/random/1200x630/?poultry,farm,data'],
  },
}

const postContent = `
# पोल्ट्री फार्म में डेली फीड और मॉर्टालिटी की एंट्री कैसे करें: एक पूरा गाइड

पोल्ट्री फार्म में मुनाफ़ा कमाना सिर्फ़ अच्छी देखभाल पर ही नहीं, बल्कि सही डेटा पर भी निर्भर करता है। हर दिन फ़ीड (Feed) और मॉर्टालिटी (Mortality) की एंट्री करना बहुत ज़रूरी है ताकि आपको अपने बैच का परफॉर्मेंस, FCR (Feed Conversion Ratio), और लाभ-हानि का सटीक हिसाब मिल सके। 'Poultry Mitra' आपको इस प्रक्रिया में मदद करने के लिए ही बनाया गया है।

## 🐓 डेली एंट्री क्यों ज़रूरी है?

*   **प्रदर्शन का विश्लेषण**: आपको पता चलता है कि आपका बैच उम्मीद के मुताबिक बढ़ रहा है या नहीं।
*   **लागत नियंत्रण**: फ़ीड की खपत पर नज़र रखकर आप लागत को नियंत्रित कर सकते हैं।
*   **बीमारी की पहचान**: मॉर्टालिटी में अचानक वृद्धि किसी बीमारी का संकेत हो सकती है, जिससे आप समय पर कार्रवाई कर सकते हैं।
*   **मुनाफ़े का सटीक अनुमान**: सही डेटा के बिना आप कभी नहीं जान पाएंगे कि आपका व्यवसाय वास्तव में कितना लाभदायक है।

## 1. आपको कौन-सा डेटा रिकॉर्ड करना चाहिए?

हर दिन के लिए आपको ये पॉइंट्स नोट करने चाहिए:

*   **तारीख (Date)**: जिस दिन का रिकॉर्ड है।
*   **बैच नंबर (Batch No.)**: यदि आपके पास कई बैच हैं।
*   **दिन की शुरुआत में पक्षियों की गिनती (Opening Birds)**: पिछले दिन के बचे हुए पक्षी।
*   **मॉर्टालिटी (Mortality)**: उस दिन कितने पक्षी मरे।
*   **बचे हुए पक्षी (Closing Birds)**: दिन के अंत में कुल पक्षी।
*   **दिया गया फ़ीड (Feed Given)**: किलो या बैग में।
*   **दवा/विटामिन**: यदि कोई दवा दी गई है तो उसका नाम।
*   **विशेष टिप्पणी (Remark)**: कोई भी खास बात, जैसे पक्षियों का व्यवहार या मौसम का असर।

## 2. फ़ीड एंट्री कैसे करें?

हर दिन जितना फ़ीड (दाना) पक्षियों को दिया गया है, उसे किलो (KG) या बैग (Bag) में लिखें।

**उदाहरण:**
> Day 5 - Feed Given = 25 KG

अगर आपके फार्म में अलग-अलग शेड हैं, तो आप शेड के हिसाब से भी एंट्री कर सकते हैं ताकि आपको हर शेड का अलग-अलग प्रदर्शन पता चल सके।

## 3. मॉर्टालिटी एंट्री कैसे करें?

हर दिन जितने भी चूज़े या मुर्गे मरे हैं, उनकी संख्या लिखें।

**उदाहरण:**
> Day 5 - Mortality = 3 Birds

इसके साथ ही, यदि संभव हो तो मरने का कारण (जैसे- बीमारी, दबकर मरना, पानी की कमी) भी लिखें। यह आपको भविष्य में होने वाले नुकसान से बचने में मदद करेगा।

## 4. प्रमुख गणना (Calculation) कैसे होती है?

\`Closing Birds = Opening Birds - Mortality\`

\`Total Feed Consumed = हर दिन दिए गए Feed का कुल योग\`

### FCR (Feed Conversion Ratio) कैसे निकालें?

FCR यह बताता है कि 1 किलो वजन बढ़ाने के लिए पक्षी ने कितना किलो फ़ीड खाया। FCR जितना कम हो, उतना अच्छा माना जाता है।

**FCR का फॉर्मूला:**
> FCR = कुल खाया गया फ़ीड (KG) / कुल जीवित पक्षियों का कुल वजन (KG)

## 5. रिकॉर्ड कहाँ रखें?

आपके पास तीन मुख्य विकल्प हैं:

1.  **रजिस्टर / कॉपी**: छोटे फार्म के लिए यह सबसे आसान और सस्ता तरीका है।
2.  **Excel Sheet / Google Sheet**: इसमें आप फॉर्मूला लगाकर FCR और लाभ जैसी चीजें स्वचालित रूप से कैलकुलेट कर सकते हैं।
3.  **मोबाइल / वेब ऐप (जैसे Poultry Mitra)**: यह सबसे आधुनिक और सटीक तरीका है। इसमें आपको सिर्फ़ दैनिक एंट्री डालनी होती है, और बाक़ी सभी रिपोर्ट (जैसे FCR, लागत, लाभ) अपने आप तैयार हो जाती हैं।

### एक डेली टेबल का उदाहरण:

| तारीख | बैच नं. | ओपनिंग पक्षी | मॉर्टालिटी | क्लोजिंग पक्षी | फ़ीड दिया (KG) | दवा/विटामिन | टिप्पणी |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| 22-09-25 | B-101 | 1000 | 5 | 995 | 50 | Coccivac | Normal |
| 23-09-25 | B-101 | 995 | 3 | 992 | 52 | Multivitamin | Slight loose motion |

## निष्कर्ष

नियमित रूप से डेटा रिकॉर्ड करना एक सफल पोल्ट्री फार्मर की निशानी है। **Poultry Mitra** जैसे टूल इस काम को बेहद आसान बना देते हैं, जिससे आप डेटा एंट्री की चिंता छोड़कर अपने फार्म को बढ़ाने पर ध्यान केंद्रित कर सकते हैं।

`;

export default function BlogPostPage() {
  const post = {
    title: 'पोल्ट्री फार्म में डेली फीड और मॉर्टालिटी की एंट्री कैसे करें? एक पूरा गाइड',
    slug: 'daily-feed-mortality-tracking-guide',
    authorName: 'Poultry Mitra Team',
    authorId: 'admin',
    createdAt: new Date('2024-09-23T10:00:00Z'),
    coverImage: 'https://source.unsplash.com/random/1200x800/?poultry,farm,data',
    content: postContent,
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <LandingPageHeader />
      <main className="flex-1 pt-24">
        <article className="container max-w-3xl mx-auto py-8 md:py-12 px-4">
            <header className="mb-8 text-center">
                <h1 className="text-3xl md:text-5xl font-bold tracking-tighter font-headline mb-4">{post.title}</h1>
                <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-muted-foreground">
                    <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                            <AvatarImage src={`https://picsum.photos/seed/${post.authorId}/40/40`} alt={post.authorName} />
                            <AvatarFallback>{post.authorName.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span>{post.authorName}</span>
                    </div>
                    <span>•</span>
                    <time dateTime={post.createdAt.toISOString()}>
                        {format(post.createdAt, 'PPP')}
                    </time>
                </div>
                <div className="mt-6 flex justify-center">
                    <ShareButton title={post.title} slug={post.slug} />
                </div>
            </header>

            <div className="relative w-full h-64 md:h-96 rounded-lg overflow-hidden mb-8 shadow-lg">
                <Image
                    src={post.coverImage}
                    alt={post.title}
                    fill
                    className="object-cover"
                    priority
                    data-ai-hint="poultry farm data"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
            </div>
            
            <div className="prose dark:prose-invert lg:prose-xl mx-auto w-full max-w-none">
                <ReactMarkdown>{post.content}</ReactMarkdown>
            </div>
        </article>
      </main>
      <footer className="bg-gray-900 text-white">
        <div className="container px-4 md:px-6 py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
                <div className="flex items-center gap-2 mb-4">
                    <AnimatedLogo className="h-8 w-8 text-green-400" />
                    <span className="text-xl font-headline font-bold">Poultry Mitra</span>
                </div>
                <p className="text-sm text-gray-400">India's #1 Poultry Farm Management and Advisory company.</p>
            </div>
            <div>
                <h4 className="font-semibold mb-4">Quick Links</h4>
                <nav className="flex flex-col gap-2 text-sm">
                    <Link href="/#features" className="text-gray-400 hover:text-white">Features</Link>
                    <Link href="/blog" className="text-gray-400 hover:text-white">Blog</Link>
                </nav>
            </div>
             <div>
                <h4 className="font-semibold mb-4">Support</h4>
                <nav className="flex flex-col gap-2 text-sm">
                    <Link href="#" className="text-gray-400 hover:text-white">Help</Link>
                    <Link href="#" className="text-gray-400 hover:text-white">Privacy Policy</Link>
                </nav>
            </div>
            <div>
                <h4 className="font-semibold mb-4">Contact</h4>
                <div className="text-sm text-gray-400">
                    <p>+91 9123456789</p>
                    <p>help@poultrymitra.com</p>
                </div>
            </div>
        </div>
        <div className="py-6 border-t border-gray-800">
             <p className="text-center text-xs text-gray-500">&copy; 2024 Poultry Mitra. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
