// src/app/home-page-client.tsx
"use client";

import { ArrowRight, BarChart, BookText, BrainCircuit, Check, DollarSign, Facebook, FlaskConical, Instagram, Linkedin, Twitter } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { LandingPageHeader } from '@/components/landing-page-header';
import { Badge } from '@/components/ui/badge';
import { AnimatedLogo } from '@/components/animated-logo';
import { BreakingNewsTicker } from '@/components/breaking-news-ticker';
import { RecentPosts } from '@/components/recent-posts';
import { SerializablePost } from '../app/page';
import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { Testimonials, SerializableTestimonial } from '@/components/testimonials';
import { useUser } from '@/firebase';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Skeleton } from '@/components/ui/skeleton';


const features = [
    {
        icon: <BarChart />,
        title: "Shed Management",
        description: "Track mortality, feed consumption, FCR, and bird weight for optimal performance.",
    },
    {
        icon: <BookText />,
        title: "Complete Financial Ledgers",
        description: "Manage payables and receivables for farmers and suppliers with automated bookkeeping.",
    },
    {
        icon: <BrainCircuit />,
        title: "AI-Powered Advisory",
        description: "Get smart advice on disease detection, stock planning, and performance analysis.",
    },
];

const faqItems = [
  {
    question: "Poultry Mitra किसके लिए है?",
    answer: "Poultry Mitra भारत में पोल्ट्री किसानों और डीलरों दोनों के लिए बनाया गया है। किसान अपने बैचों, खर्चों और लाभप्रदता को ट्रैक कर सकते हैं, जबकि डीलर अपने किसान नेटवर्क, इन्वेंट्री और बिक्री का प्रबंधन कर सकते हैं।"
  },
  {
    question: "क्या मैं मुफ्त में शुरू कर सकता हूँ?",
    answer: "हाँ, बिल्कुल! हमारा मुफ़्त प्लान आपको मुख्य विशेषताओं के साथ आरंभ करने की अनुमति देता है, जिसमें 1 बैच (किसानों के लिए) या 3 किसानों (डीलरों के लिए) का प्रबंधन शामिल है। आप बिना किसी लागत के हमारे प्लेटफ़ॉर्म का अनुभव कर सकते हैं।"
  },
  {
    question: "AI सुविधाएँ कैसे काम करती हैं?",
    answer: "हमारी AI सुविधाएँ, जैसे रोग का पता लगाना और सलाहकार, आपके द्वारा प्रदान किए गए डेटा का विश्लेषण करने के लिए उन्नत एल्गोरिदम का उपयोग करती हैं। आप लक्षणों का वर्णन करते हैं, और AI संभावित मुद्दों और सुझावों की पहचान करता है, जिससे आपको त्वरित निर्णय लेने में मदद मिलती है।"
  },
  {
    question: "मेरा डेटा कितना सुरक्षित है?",
    answer: "हम आपके डेटा की सुरक्षा को बहुत गंभीरता से लेते हैं। सभी जानकारी को सुरक्षित रूप से संग्रहीत किया जाता है और उद्योग-मानक एन्क्रिप्शन के साथ एन्क्रिप्ट किया जाता है। आपकी व्यावसायिक जानकारी गोपनीय रहती है।"
  }
];

export default function HomePageClient({ initialPosts, initialTestimonials }: { initialPosts: SerializablePost[], initialTestimonials: SerializableTestimonial[]}) {
  const { userProfile } = useUser();
  const dashboardUrl = userProfile?.role === 'admin' ? '/admin' : '/dashboard';
  
  const showFarmerPlan = !userProfile || userProfile.role === 'farmer';
  const showDealerPlan = !userProfile || userProfile.role === 'dealer';

  const numPlans = [showFarmerPlan, showDealerPlan].filter(Boolean).length;
  const gridColsClass = numPlans === 2 ? 'md:grid-cols-3' : 'md:grid-cols-2';
  
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
        <LandingPageHeader />
         <main className="flex-1 pt-16">
        {/* Hero Section */}
        <section className="w-full py-12 md:py-16 lg:py-20 bg-gradient-to-b from-green-50 to-white dark:from-green-900/10 dark:to-background">
            <BreakingNewsTicker />
          <div className="container px-4 md:px-6 text-center">
            <div className="flex flex-col items-center space-y-6">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tighter font-headline">
                The Future of Poultry Farming is Digital
              </h1>
              <p className="max-w-2xl mx-auto text-muted-foreground md:text-xl">
                Digitize your poultry business. From FCR calculation and AI-powered disease prediction to complete financial management - everything in one place.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button asChild size="lg" className="bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl transition-shadow">
                  <Link href={userProfile ? dashboardUrl : "/auth?view=signup"}>Get Started for Free <ArrowRight className="ml-2" /></Link>
                </Button>
                 <Button asChild variant="outline" size="lg" className="shadow-sm hover:shadow-md transition-shadow">
                    <Link href="/#features">Explore Features</Link>
                </Button>
              </div>
            </div>
            <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {features.map((feature) => (
                <div key={feature.title} className="flex items-start gap-4 p-4 rounded-lg hover:bg-card transition-colors">
                  <div className="p-3 rounded-full bg-primary/10 text-primary">{feature.icon}</div>
                  <div>
                    <h3 className="text-lg font-bold">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <Testimonials testimonials={initialTestimonials} />

        {/* Pricing Section */}
        <section id="pricing" className="w-full py-12 md:py-20 bg-muted">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl font-headline">Find the Perfect Plan</h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed">
                  Start for free and scale up as you grow. All our plans are designed to help you succeed.
                </p>
              </div>
            </div>
            <div className={cn(
                "mx-auto grid max-w-6xl items-stretch gap-8 pt-12 sm:grid-cols-1",
                gridColsClass
            )}>
              <Card className="flex flex-col transform hover:-translate-y-2 transition-transform duration-300">
                <CardHeader>
                  <CardTitle className="font-headline text-2xl">Free Plan</CardTitle>
                  <CardDescription>Perfect for getting started and managing smaller operations.</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 space-y-4">
                  <p className="text-4xl font-bold">₹0 <span className="text-sm font-normal text-muted-foreground">/ month</span></p>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> 1 Batch Management (for Farmers)</li>
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> 3 Farmer Connections (for Dealers)</li>
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> Financial Ledgers</li>
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> Inventory and Order Management</li>
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> Free FCR Calculator</li>
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button asChild variant="outline" className="w-full">
                     <Link href="/auth?view=signup">Get Started for Free</Link>
                  </Button>
                </CardFooter>
              </Card>
              {showFarmerPlan && (
                <Card className="flex flex-col border-primary border-2 relative shadow-lg transform hover:-translate-y-2 transition-transform duration-300">
                    <Badge className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2">Farmer</Badge>
                    <CardHeader>
                    <CardTitle className="font-headline text-2xl text-primary">Farmer Premium</CardTitle>
                    <CardDescription>Unlock powerful AI tools and unlimited potential for your farm.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 space-y-4">
                    <p className="text-4xl font-bold">₹125 <span className="text-sm font-normal text-muted-foreground">/ month</span></p>
                    <ul className="space-y-2 text-sm">
                        <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> <span className="font-semibold">Everything in Free, plus:</span></li>
                        <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> Unlimited Batch Management</li>
                        <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> AI-Powered Chat Assistant</li>
                        <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> AI Disease Detection & Advisory</li>
                        <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> Daily Market Rate Access</li>
                        <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> Exclusive "Gold" Theme</li>
                    </ul>
                    </CardContent>
                    <CardFooter>
                    <Button asChild className="w-full">
                        <Link href="/auth?view=signup">Upgrade Now</Link>
                    </Button>
                    </CardFooter>
                </Card>
              )}
               {showDealerPlan && (
                <Card className="flex flex-col border-primary border-2 relative shadow-lg transform hover:-translate-y-2 transition-transform duration-300">
                    <Badge className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2">Dealer</Badge>
                    <CardHeader>
                    <CardTitle className="font-headline text-2xl text-primary">Dealer Premium</CardTitle>
                    <CardDescription>Scale your business with advanced tools and customer management.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 space-y-4">
                    <p className="text-4xl font-bold">₹499 <span className="text-sm font-normal text-muted-foreground">/ month</span></p>
                    <ul className="space-y-2 text-sm">
                        <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> <span className="font-semibold">Everything in Free, plus:</span></li>
                        <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> Unlimited Farmer Connections</li>
                        <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> AI-Powered Chat Assistant</li>
                        <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> AI Stock Advisory & WhatsApp Tools</li>
                        <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> Daily Market Rate Access</li>
                        <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> Rate Posting Permissions</li>
                        <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> Exclusive "Gold" Theme</li>
                    </ul>
                    </CardContent>
                    <CardFooter>
                    <Button asChild className="w-full">
                        <Link href="/auth?view=signup">Upgrade Now</Link>
                    </Button>
                    </CardFooter>
                </Card>
               )}
            </div>
          </div>
        </section>

         <RecentPosts posts={initialPosts} />
         
         {/* FAQ Section */}
        <section id="faq" className="w-full py-12 md:py-20">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl font-headline">Frequently Asked Questions</h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed">
                  Have questions? We have answers. Here are some of the most common questions we get.
                </p>
              </div>
            </div>
            <div className="mx-auto max-w-3xl pt-12">
              <Accordion type="single" collapsible className="w-full">
                {faqItems.map((item, index) => (
                  <AccordionItem value={`item-${index}`} key={index}>
                    <AccordionTrigger className="text-lg font-semibold">{item.question}</AccordionTrigger>
                    <AccordionContent className="text-base text-muted-foreground">
                      {item.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>
        </section>

         {/* Final CTA */}
         <section className="w-full py-12 md:py-16 text-white bg-gradient-to-r from-primary to-green-600">
          <div className="container grid items-center justify-center gap-4 px-4 text-center md:px-6">
            <div className="space-y-3">
              <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight font-headline">Start Your Digital Poultry Journey Today</h2>
              <p className="mx-auto max-w-xl text-white/80">
                Join thousands of farmers and dealers who are building the future of poultry farming.
              </p>
            </div>
            <div className="mt-6">
              <Button asChild size="lg" variant="secondary" className="bg-white text-green-600 hover:bg-gray-100 shadow-lg hover:shadow-xl transition-shadow">
                <Link href={userProfile ? dashboardUrl : "/auth?view=signup"}>
                  {userProfile ? "Go to Your Dashboard" : "Register for Free"}
                </Link>
              </Button>
            </div>
            <p className="text-xs text-white/60 mt-2">No credit card required.</p>
          </div>
        </section>
      </main>
        {/* Footer */}
        <footer className="bg-gray-900 text-white">
            <div className="container px-4 md:px-6 py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
                <div className="col-span-1 md:col-span-2">
                    <div className="flex items-center gap-2 mb-4">
                        <AnimatedLogo className="h-8 w-8" />
                        <span className="text-xl font-headline font-bold">Poultry Mitra</span>
                    </div>
                    <p className="text-sm text-gray-400 max-w-sm">India's #1 Poultry Farm Management and Advisory company, empowering farmers and dealers with digital tools and AI-driven insights.</p>
                </div>
                <div>
                    <h4 className="font-semibold mb-4">Quick Links</h4>
                    <nav className="flex flex-col gap-2 text-sm">
                        <Link href="/#features" className="text-gray-400 hover:text-white">Features</Link>
                        <Link href="/blog" className="text-gray-400 hover:text-white">Blog</Link>
                        <Link href="/#pricing" className="text-gray-400 hover:text-white">Pricing</Link>
                         <Link href="/#faq" className="text-gray-400 hover:text-white">FAQ</Link>
                    </nav>
                </div>
                <div>
                    <h4 className="font-semibold mb-4">Contact & Social</h4>
                    <div className="text-sm text-gray-400 mb-4">
                        <p>+91 9123456789</p>
                        <p>help@poultrymitra.com</p>
                    </div>
                     <div className="flex gap-4">
                        <Link href="#" className="text-gray-400 hover:text-white"><Twitter className="h-5 w-5"/></Link>
                        <Link href="#" className="text-gray-400 hover:text-white"><Facebook className="h-5 w-5"/></Link>
                        <Link href="#" className="text-gray-400 hover:text-white"><Instagram className="h-5 w-5"/></Link>
                        <Link href="#" className="text-gray-400 hover:text-white"><Linkedin className="h-5 w-5"/></Link>
                    </div>
                </div>
            </div>
            <div className="py-6 border-t border-gray-800">
                <p className="text-center text-xs text-gray-500">&copy; {new Date().getFullYear()} Poultry Mitra. All rights reserved.</p>
            </div>
        </footer>
    </div>
  );
}
