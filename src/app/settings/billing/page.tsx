
// src/app/settings/billing/page.tsx
"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bird, CheckCircle, CreditCard, Crown, Loader, QrCode, TicketPercent, X } from 'lucide-react';
import { MainNav } from '@/components/main-nav';
import { UserNav } from '@/components/user-nav';
import {
  Sidebar,
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
  SidebarHeader,
  SidebarContent,
} from '@/components/ui/sidebar';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { createPaymentVerificationRequest } from '@/services/billing.service';
import QRCode from 'qrcode.react';
import { getOfferByCode, SubscriptionOffer } from '@/services/offers.service';
import { getSubscriptionSettings, SubscriptionSettings } from '@/services/settings.service';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { getUserProfile, UserProfile } from '@/services/users.service';


export default function BillingPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const [referenceNumber, setReferenceNumber] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [requestSubmitted, setRequestSubmitted] = useState(false);
  
  const [promoCode, setPromoCode] = useState('');
  const [appliedOffer, setAppliedOffer] = useState<SubscriptionOffer | null>(null);
  const [checkingOffer, setCheckingOffer] = useState(false);

  const [settings, setSettings] = useState<SubscriptionSettings | null>(null);
  const [settingsLoading, setSettingsLoading] = useState(true);

   useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const profile = await getUserProfile(currentUser.uid);
        setUserProfile(profile);
      } else {
        router.push('/auth');
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    async function fetchSettings() {
      setSettingsLoading(true);
      const subSettings = await getSubscriptionSettings();
      setSettings(subSettings);
      setSettingsLoading(false);
    }
    fetchSettings();
  }, []);

  if (loading || !user || !userProfile) {
     return (
       <div className="flex flex-col h-screen">
        <header className="flex h-14 items-center gap-4 border-b bg-card px-4 lg:h-[60px] lg:px-6"><Skeleton className="h-8 w-32" /><div className="w-full flex-1" /><Skeleton className="h-9 w-9 rounded-full" /></header>
        <div className="flex flex-1"><main className="flex-1 p-6"><Skeleton className="h-96 w-full" /></main></div>
       </div>
    )
  }

  const plan = userProfile?.role === 'dealer' 
    ? { name: 'Dealer Premium', price: settings?.dealerPlanPrice ?? 499 }
    : { name: 'Farmer Premium', price: settings?.farmerPlanPrice ?? 125 };
  
  const finalPrice = appliedOffer
    ? plan.price * (1 - appliedOffer.discountPercentage / 100)
    : plan.price;

  const qrCodeValue = settings 
    ? `upi://pay?pa=${settings.upiId}&pn=${encodeURIComponent(settings.upiName)}&am=${finalPrice.toFixed(2)}&cu=INR&tn=Premium Subscription`
    : '';

  const handleApplyPromoCode = async () => {
    if (!promoCode) return;
    setCheckingOffer(true);
    try {
        const offer = await getOfferByCode(promoCode);
        if (offer) {
            setAppliedOffer(offer);
            toast({ title: "Offer Applied!", description: `You get ${offer.discountPercentage}% off!`});
        } else {
            setAppliedOffer(null);
            toast({ variant: "destructive", title: "Invalid Code", description: "This promotional code is not valid or has expired."});
        }
    } catch (error: any) {
        toast({ variant: "destructive", title: "Error", description: error.message });
    } finally {
        setCheckingOffer(false);
    }
  }

  const handleSubmitVerification = async () => {
    if (!user || !userProfile) {
        toast({ variant: "destructive", title: "Error", description: "You must be logged in."});
        return;
    }
    if (!referenceNumber.trim()) {
        toast({ variant: "destructive", title: "Error", description: "Please enter your UTR / Reference Number."});
        return;
    }
    setSubmitting(true);
    try {
        await createPaymentVerificationRequest({
            userId: user.uid,
            userName: userProfile.name,
            userEmail: userProfile.email,
            amount: plan.price,
            planType: plan.name,
            referenceNumber: referenceNumber,
            promoCode: appliedOffer?.code || null,
            discountedAmount: finalPrice,
        });
        setRequestSubmitted(true);
        toast({ title: "Request Submitted", description: "Your payment is being verified. Your plan will be updated within 24 hours."});
    } catch(error: any) {
        toast({ variant: "destructive", title: "Submission Failed", description: error.message });
    } finally {
        setSubmitting(false);
    }
  }


  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className="p-4">
          <div className="flex items-center gap-2"><Bird className="w-8 h-8 text-primary" /><h1 className="text-2xl font-headline text-primary">Poultry Mitra</h1></div>
        </SidebarHeader>
        <SidebarContent><MainNav userProfile={userProfile} /></SidebarContent>
      </Sidebar>
      <SidebarInset>
        <div className="flex flex-col">
          <header className="flex h-14 items-center gap-4 border-b bg-card px-4 lg:h-[60px] lg:px-6">
            <SidebarTrigger className="md:hidden" /><div className="w-full flex-1" /><UserNav user={user} userProfile={userProfile} />
          </header>
          <main className="flex-1 p-6">
            <div className="flex items-center gap-2 mb-6">
              <CreditCard className="w-6 h-6" /><h1 className="text-lg font-semibold md:text-2xl font-headline">Billing & Subscription</h1>
            </div>
            {userProfile.isPremium ? (
              <Card>
                <CardHeader>
                    <CardTitle className="font-headline text-2xl flex items-center gap-2"><Crown className="text-yellow-500"/>You are on the Premium Plan</CardTitle>
                    <CardDescription>You have access to all features. Thank you for your support!</CardDescription>
                </CardHeader>
                 <CardContent>
                    <p className="text-sm text-muted-foreground">Your subscription is currently active. For any billing questions, please contact support.</p>
                </CardContent>
              </Card>
            ) : requestSubmitted ? (
                 <Card>
                    <CardHeader className="items-center text-center">
                        <CheckCircle className="w-16 h-16 text-green-500" />
                        <CardTitle className="font-headline text-2xl">Verification Pending</CardTitle>
                        <CardDescription>Your payment request has been submitted. It will be reviewed by our team within 24 hours. You will receive a notification once your plan is active.</CardDescription>
                    </CardHeader>
                </Card>
            ) : (
              <div className="grid lg:grid-cols-2 gap-8 items-start">
                  <Card>
                      <CardHeader>
                        <CardTitle className="font-headline">Step 1: Make Payment</CardTitle>
                        <CardDescription>Pay for your <span className="font-semibold text-foreground">{plan.name}</span> plan.</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                          <div className="space-y-2">
                                <Label>Have a promo code?</Label>
                                <div className="flex gap-2">
                                <Input placeholder="Enter code" value={promoCode} onChange={e => setPromoCode(e.target.value.toUpperCase())} disabled={!!appliedOffer} />
                                {appliedOffer ? (
                                    <Button variant="ghost" size="icon" onClick={() => { setAppliedOffer(null); setPromoCode('')}}><X className="w-4 h-4 text-muted-foreground"/></Button>
                                ) : (
                                    <Button onClick={handleApplyPromoCode} disabled={checkingOffer || !promoCode}>
                                        {checkingOffer ? <Loader className="animate-spin h-4 w-4" /> : 'Apply'}
                                    </Button>
                                )}
                                </div>
                          </div>
                           <div className="p-4 rounded-lg bg-muted border text-center space-y-4">
                               <p className="text-sm text-muted-foreground">Scan QR or use UPI ID to pay:</p>
                               <p className="text-2xl font-bold text-primary">₹{finalPrice.toFixed(2)}
                                {appliedOffer && (
                                    <span className="text-base text-muted-foreground line-through ml-2">₹{plan.price}</span>
                                )}
                                </p>
                               {appliedOffer && (
                                   <p className="text-sm font-semibold text-green-600">({appliedOffer.discountPercentage}% OFF Applied)</p>
                               )}

                               <div className="flex justify-center p-2 bg-white rounded-md">
                                  <QRCode value={qrCodeValue} size={160} />
                               </div>
                               <div>
                                  <p className="font-semibold">{settings?.upiName}</p>
                                  <p className="font-mono text-sm bg-background p-2 rounded-md">{settings?.upiId}</p>
                               </div>
                           </div>
                      </CardContent>
                  </Card>
                  <Card>
                      <CardHeader>
                        <CardTitle className="font-headline">Step 2: Submit Verification</CardTitle>
                        <CardDescription>After paying, enter the transaction reference number below to activate your plan.</CardDescription>
                      </CardHeader>
                       <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="utr">UTR / Reference Number</Label>
                                <Input id="utr" placeholder="Enter your 12-digit number" value={referenceNumber} onChange={e => setReferenceNumber(e.target.value)} />
                            </div>
                            <Button className="w-full" onClick={handleSubmitVerification} disabled={submitting || !referenceNumber.trim()}>
                                {submitting ? <><Loader className="animate-spin mr-2"/>Submitting...</> : 'Submit for Verification'}
                            </Button>
                       </CardContent>
                  </Card>
              </div>
            )}
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
