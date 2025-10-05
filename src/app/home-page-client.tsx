// src/app/home-page-client.tsx
"use client";

import { ArrowRight, BarChart, BookText, Bot, BrainCircuit, Check, DollarSign, List, ShieldCheck, Star, Target, Users, Warehouse, TrendingUp, Search, LineChart, PieChart, FlaskConical } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { LandingPageHeader } from '@/components/landing-page-header';
import { Badge } from '@/components/ui/badge';
import { AiFeatureCard } from '@/components/ai/ai-feature-card';
import { AnimatedLogo } from '@/components/animated-logo';
import { BreakingNewsTicker } from '@/components/breaking-news-ticker';
import { RecentPosts } from '@/components/recent-posts';
import { SerializablePost } from '../app/page';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { Testimonials } from '@/components/testimonials';
import { useUser } from '@/firebase';


const features = [
    {
        icon: <TrendingUp />,
        title: "Shed Management",
        description: "Track mortality, feed consumption, FCR, and bird weight.",
        longDescription: "Our detailed shed management tools allow you to log daily statistics for each of your batches. Monitor key performance indicators like Feed Conversion Ratio (FCR), mortality rates, and daily weight gain. This data helps you make informed decisions to improve profitability and bird health.",
        imageHint: "dashboard chart"
    },
    {
        icon: <Warehouse />,
        title: "Inventory & Orders",
        description: "Manage stock and process orders from farmers seamlessly.",
        longDescription: "Dealers can maintain a complete inventory of feed, medicines, and vaccines. Set sales prices and manage stock levels. Farmers can request orders directly through the app, which dealers can then accept and fulfill, automatically updating inventory and financial ledgers.",
        imageHint: "warehouse inventory"
    },
    {
        icon: <BookText />,
        title: "Complete Financial Ledgers",
        description: "Manage payables and receivables for farmers and suppliers.",
        longDescription: "Eliminate the need for manual bookkeeping. Poultry Mitra provides a complete financial ledger for every farmer in your network. All sales, payments, and credits are automatically recorded, giving you a real-time view of outstanding balances.",
        imageHint: "accounting ledger"
    },
    {
        icon: <BarChart />,
        title: "Detailed Reporting",
        description: "Get deep insights into your profitability with graphs and charts.",
        longDescription: "Visualize your farm's or dealership's performance with easy-to-understand charts and graphs. Track your profitability over time, analyze cost breakdowns, and identify trends to make data-driven decisions for your business.",
        imageHint: "analytics graphs"
    },
    {
        icon: <Users />,
        title: "Customer Management",
        description: "Dealers can manage their network of farmers effortlessly.",
        longDescription: "As a dealer, you can build and manage your entire network of farmers. View their ledgers, create orders on their behalf, and track their performance all from one central dashboard. Use our invitation system to easily expand your network.",
        imageHint: "team network"
    },
    {
        icon: <FlaskConical />,
        title: "AI Disease Detection",
        description: "Describe symptoms and get an instant AI-powered analysis of potential diseases.",
        longDescription: "Protect your flock with our cutting-edge AI Disease Detection tool. Simply describe the symptoms you are observing in your birds, and our AI will provide an instant analysis of potential diseases and suggest immediate actions, helping you prevent widespread illness and reduce losses.",
        imageHint: "science laboratory"
    }
];

const benefits = [
    {
        value: "40%",
        title: "Increase Profit",
        description: "Optimize feed and reduce mortality to boost your bottom line."
    },
    {
        value: "25%",
        title: "Reduce Costs",
        description: "Better inventory management and FCR tracking leads to less waste."
    },
    {
        value: "92%",
        title: "Save Time",
        description: "Automate bookkeeping and data entry, freeing up your valuable time."
    },
    {
        value: "10x",
        title: "Better Decisions",
        description: "Use data-driven insights to make informed choices for your business."
    }
];


export default function HomePageClient({ initialPosts }: { initialPosts: SerializablePost[]}) {
  const { user, userProfile } = useUser();

  const dashboardUrl = userProfile?.role === 'admin' ? '/admin' : '/dashboard';
  const [hasMounted, setHasMounted] = React.useState(false);

  React.useEffect(() => {
    setHasMounted(true);
  }, []);

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
            {!user && <BreakingNewsTicker />}
          <div className="container grid md:grid-cols-2 gap-8 items-center px-4 md:px-6">
            <div className="flex flex-col items-start space-y-6 text-left">
               <div className="inline-block rounded-full bg-green-100 dark:bg-green-900/50 px-4 py-1 text-sm font-medium text-green-700 dark:text-green-300">
                Trusted by 10,000+ Farmers & Dealers
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tighter font-headline">
                The Future of Poultry Farming is Digital
              </h1>
              <p className="max-w-xl text-muted-foreground md:text-xl">
                Digitize your poultry business. From FCR calculation and AI-powered disease prediction to complete financial management - everything in one place.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button asChild size="lg" className="bg-green-600 hover:bg-green-700 text-white">
                  <Link href={user ? dashboardUrl : "/auth?view=signup"}>Get Started <ArrowRight className="ml-2" /></Link>
                </Button>
                 <Button asChild variant="outline" size="lg">
                    <Link href="/tools">Free FCR Calculator</Link>
                </Button>
              </div>
            </div>
            <div className="space-y-4">
                <Card>
                  <CardContent className="p-6">
                    <ul className="space-y-4 text-lg">
                      <li className="flex items-center gap-3">
                        <Check className="h-6 w-6 text-green-500" />
                        <span>Track FCR, Mortality, and Growth</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <Check className="h-6 w-6 text-green-500" />
                        <span>Manage Financial Ledgers Effortlessly</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <Check className="h-6 w-6 text-green-500" />
                        <span>Get AI-Powered Disease Detection</span>
                      </li>
                       <li className="flex items-center gap-3">
                        <Check className="h-6 w-6 text-green-500" />
                        <span>Full Inventory and Order Management</span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>
            </div>
          </div>
        </section>
        
        {/* How it works */}
        <section className="w-full py-12 md:py-20">
          <div className="container px-4 md:px-6">
             <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
                <div className="space-y-2">
                    <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl font-headline">Get Started in 3 Easy Steps</h2>
                    <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed">
                        Join the digital revolution in poultry management in just a few minutes.
                    </p>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card className="text-center">
                <CardHeader>
                  <div className="mx-auto bg-green-100 text-green-600 rounded-full w-12 h-12 flex items-center justify-center font-bold text-xl">1</div>
                  <CardTitle className="font-headline pt-2">Register Your Account</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Create a free account as a Farmer or Dealer to get instant access to the platform.</p>
                </CardContent>
              </Card>
              <Card className="text-center">
                <CardHeader>
                  <div className="mx-auto bg-green-100 text-green-600 rounded-full w-12 h-12 flex items-center justify-center font-bold text-xl">2</div>
                  <CardTitle className="font-headline pt-2">Create a Batch or Connect</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Farmers can create a batch to start tracking. Dealers can add farmers to their network.</p>
                </CardContent>
              </Card>
              <Card className="text-center">
                <CardHeader>
                  <div className="mx-auto bg-green-100 text-green-600 rounded-full w-12 h-12 flex items-center justify-center font-bold text-xl">3</div>
                  <CardTitle className="font-headline pt-2">Start Managing</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Log daily entries, manage finances, and use AI tools to boost your profitability.</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* AI Features Section */}
        <section className="w-full py-12 md:py-20 bg-gradient-to-r from-green-600 to-green-800 text-white">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl font-headline">Unlock the Power of AI</h2>
                <p className="max-w-[900px] text-green-100 md:text-xl/relaxed">
                  Our premium plans give you access to a suite of artificial intelligence tools designed to give you a competitive edge.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <AiFeatureCard 
                icon={<Search />}
                title="AI Disease Detection"
                description="Describe your bird's symptoms and get an instant AI-powered analysis of potential diseases and suggested actions."
                buttonText="Premium Feature"
                isLocked
                className="bg-white/10 border-white/20 hover:bg-white/20 text-white"
              />
               <AiFeatureCard 
                icon={<Bot />}
                title="AI Chat Assistant"
                description="Ask questions in plain language about your farm's performance, finances, and batches, and get instant answers."
                buttonText="Premium Feature"
                isLocked
                 className="bg-white/10 border-white/20 hover:bg-white/20 text-white"
              />
               <AiFeatureCard 
                icon={<BrainCircuit />}
                title="Smart Advisory"
                description="Receive AI-driven advice for stock planning and payment tracking."
                buttonText="Premium Feature"
                isLocked
                 className="bg-white/10 border-white/20 hover:bg-white/20 text-white"
              />
            </div>
          </div>
        </section>
        
        {/* Benefits Section */}
         <section className="w-full py-12 md:py-20 bg-gradient-to-r from-primary to-green-600 text-white">
            <div className="container px-4 md:px-6 text-center">
                 <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl font-headline mb-12">Benefits of Poultry Mitra</h2>
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {benefits.map((benefit, index) => (
                        <Card key={index} className="bg-white/10 border-white/20 text-white flex flex-col items-center text-center p-6">
                            <CardTitle className="text-5xl font-bold text-accent">{benefit.value}</CardTitle>
                            <CardDescription className="text-lg font-semibold mt-2 text-white">{benefit.title}</CardDescription>
                            <p className="text-sm text-green-100 mt-1">{benefit.description}</p>
                        </Card>
                    ))}
                 </div>
            </div>
        </section>

        {/* Why Choose Section */}
        {hasMounted && (
            <section id="features" className="w-full py-12 md:py-16">
            <div className="container px-4 md:px-6">
                <div className="flex flex-col items-center justify-center space-y-4 text-center">
                <div className="space-y-2">
                    <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl font-headline">One Platform for Your Entire Business</h2>
                    <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                    From farm management to financial tracking, Poultry Mitra brings all your operations under one roof.
                    </p>
                </div>
                </div>
                <div className="mx-auto grid max-w-5xl items-start gap-8 sm:grid-cols-2 md:gap-12 lg:max-w-none lg:grid-cols-3 pt-12">
                    {features.map((feature, index) => (
                        <Dialog key={index}>
                            <DialogTrigger asChild>
                                <Card className="cursor-pointer hover:shadow-lg hover:border-primary/50 transition-all">
                                    <CardContent className="p-6 flex items-center gap-4">
                                        <div className="p-3 rounded-full bg-primary/10 text-primary">{feature.icon}</div>
                                        <div>
                                            <h3 className="text-lg font-bold">{feature.title}</h3>
                                            <p className="text-sm text-muted-foreground">{feature.description}</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-md">
                                <DialogHeader>
                                    <DialogTitle className="font-headline text-2xl flex items-center gap-2">{feature.icon}{feature.title}</DialogTitle>
                                </DialogHeader>
                                <div className="py-4">
                                    <div className="relative w-full h-40 rounded-md bg-muted mb-4 overflow-hidden">
                                        <Image
                                            src={`https://picsum.photos/seed/${feature.imageHint.replace(' ', '-')}/600/400`}
                                            alt={feature.title}
                                            fill
                                            className="object-cover"
                                            data-ai-hint={feature.imageHint}
                                        />
                                    </div>
                                    <p className="text-muted-foreground">{feature.longDescription}</p>
                                </div>
                            </DialogContent>
                        </Dialog>
                    ))}
                </div>
            </div>
            </section>
        )}
        

        {/* Pricing Section */}
        <section id="pricing" className="w-full py-12 md:py-20 bg-muted">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl font-headline">Find the Perfect Plan</h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Start for free and scale up as you grow. All our plans are designed to help you succeed.
                </p>
              </div>
            </div>
            <div className={cn(
                "mx-auto grid max-w-6xl items-stretch gap-8 pt-12 sm:grid-cols-1",
                gridColsClass
            )}>
              <Card className="flex flex-col">
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
                <Card className="flex flex-col border-primary border-2 relative">
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
                <Card className="flex flex-col border-primary border-2 relative">
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

        <Testimonials />

         <RecentPosts posts={initialPosts} />

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
              <Button asChild size="lg" variant="secondary" className="bg-white text-green-600 hover:bg-gray-100">
                <Link href={user ? dashboardUrl : "/auth?view=signup"}>
                  {user ? "Go to Your Dashboard" : "Register Free"}
                </Link>
              </Button>
            </div>
            <p className="text-xs text-white/60 mt-2">No credit card required.</p>
          </div>
        </section>
      </main>
        {/* Footer */}
        <footer className="bg-gray-900 text-white">
            <div className="container px-4 md:px-6 py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
                <div>
                    <div className="flex items-center gap-2 mb-4">
                        <AnimatedLogo className="h-8 w-8" />
                        <span className="text-xl font-headline font-bold">Poultry Mitra</span>
                    </div>
                    <p className="text-sm text-gray-400">India's #1 Poultry Farm Management and Advisory company.</p>
                </div>
                <div>
                    <h4 className="font-semibold mb-4">Quick Links</h4>
                    <nav className="flex flex-col gap-2 text-sm">
                        <Link href="/#features" className="text-gray-400 hover:text-white">Features</Link>
                        <Link href="/blog" className="text-gray-400 hover:text-white">Blog</Link>
                        <Link href="/#faq" className="text-gray-400 hover:text-white">FAQ</Link>
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
