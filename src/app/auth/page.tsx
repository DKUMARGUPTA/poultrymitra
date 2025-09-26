// src/app/auth/page.tsx
"use client";

import { useState, useEffect, Suspense }from "react";
import { useRouter, ReadonlyURLSearchParams, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { createUser, getUserProfile } from "@/services/users.service";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ForgotPasswordModal } from "@/components/forgot-password-modal";
import React from 'react';
import Link from "next/link";
import { LogIn, UserPlus } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AnimatedLogo } from "@/components/animated-logo";
import Image from "next/image";
import { db, auth } from '@/lib/firebase';


const LoginFormSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
});
type LoginFormValues = z.infer<typeof LoginFormSchema>;


const SignUpFormSchema = z.object({
    name: z.string().min(1, { message: "Name is required." }),
    email: z.string().email({ message: "Invalid email address." }),
    password: z.string().min(6, { message: "Password must be at least 6 characters." }),
    role: z.enum(['farmer', 'dealer'], { required_error: "You must select a role."}),
    phoneNumber: z.string().min(10, { message: "Phone number must be at least 10 digits."}),
    dealerCode: z.string().optional(),
    referralCode: z.string().optional(),
}).refine(data => {
    if (data.role === 'farmer' && !data.dealerCode) {
        return false;
    }
    return true;
}, {
    message: "A code from your dealer is required to sign up.",
    path: ["dealerCode"],
});
type SignUpFormValues = z.infer<typeof SignUpFormSchema>;


function AuthenticationPageContent({ searchParams }: { searchParams: ReadonlyURLSearchParams }) {
  const router = useRouter();
  const { user, userProfile, loading: authLoading } = useAuth();
  
  const initialTab = searchParams.get('view') === 'signup' ? 'signup' : 'login';
  const initialDealerCode = searchParams.get('dealerCode');

  useEffect(() => {
    if (!authLoading && user) {
        if (userProfile?.role === 'admin') {
            router.push('/admin');
        } else {
            router.push('/dashboard');
        }
    }
  }, [user, userProfile, authLoading, router]);

  if (authLoading || user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
        <div className="w-full max-w-md text-center mb-8">
            <Link href="/" className="flex items-center justify-center mb-4 text-primary">
                <AnimatedLogo className="h-10 w-10 animate-pulse" />
            </Link>
             <h1 className="text-4xl font-bold text-primary font-headline">Poultry Mitra</h1>
             <p className="mt-2 text-muted-foreground">Redirecting to your dashboard...</p>
        </div>
         <div className="w-full max-w-md">
            <Skeleton className="h-48 w-full" />
        </div>
      </div>
    )
  }

  return (
    <div className="w-full lg:grid lg:min-h-[100vh] lg:grid-cols-2 xl:min-h-[100vh]">
      <div className="flex items-center justify-center py-12 px-4">
        <div className="mx-auto grid w-[350px] gap-6">
            <div className="grid gap-2 text-center">
                 <Link href="/" className="flex items-center justify-center mb-4 text-primary">
                    <AnimatedLogo className="h-10 w-10" />
                </Link>
                <h1 className="text-3xl font-bold font-headline">Welcome to Poultry Mitra</h1>
                <p className="text-balance text-muted-foreground">
                    Your all-in-one solution for poultry farm management.
                </p>
            </div>
             <Tabs defaultValue={initialTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="login">Login</TabsTrigger>
                    <TabsTrigger value="signup">Sign Up</TabsTrigger>
                </TabsList>
                <TabsContent value="login">
                    <LoginForm />
                </TabsContent>
                <TabsContent value="signup">
                    <SignUpForm initialDealerCode={initialDealerCode} />
                </TabsContent>
            </Tabs>
        </div>
      </div>
      <div className="hidden bg-muted lg:block">
        <Image
          src="https://picsum.photos/seed/poultry-farm/1280/1080"
          alt="Image of a poultry farm"
          data-ai-hint="poultry farm"
          width="1280"
          height="1080"
          className="h-full w-full object-cover dark:brightness-[0.3]"
        />
      </div>
    </div>
  );
}

function AuthPageWrapper() {
    const searchParams = useSearchParams();
    return <AuthenticationPageContent searchParams={searchParams} />;
}

export default function AuthenticationPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <AuthPageWrapper />
        </Suspense>
    );
}

function LoginForm() {
    const router = useRouter();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);

    const form = useForm<LoginFormValues>({
        resolver: zodResolver(LoginFormSchema),
        defaultValues: { email: "", password: "" },
    });

    const onSubmit = async (data: LoginFormValues) => {
        setLoading(true);
        try {
            const userCredential = await signInWithEmailAndPassword(auth, data.email, data.password);
            const profile = await getUserProfile(userCredential.user.uid);

            if (!profile) {
                await signOut(auth);
                toast({
                    variant: "destructive",
                    title: "Profile Not Found",
                    description: "Your user account exists, but your profile is missing. Please try signing up again or contact support.",
                });
                setLoading(false);
                return;
            }
            
            if (profile.status === 'suspended') {
                 await signOut(auth);
                 toast({
                    variant: "destructive",
                    title: "Account Suspended",
                    description: "Your account is currently suspended. Please contact support.",
                });
                setLoading(false);
                return;
            }

            toast({ title: "Success", description: "Logged in successfully." });
            
            if (profile.role === 'admin') {
                router.push("/admin");
            } else {
                router.push("/dashboard");
            }

        } catch (error: any) {
            console.error(error);
            const errorMessage = error.code === 'auth/invalid-credential' 
                ? 'Invalid email or password.' 
                : error.message;

            toast({
                variant: "destructive",
                title: "Login Failed",
                description: errorMessage,
            });
        } finally {
            setLoading(false);
        }
    };

    return (
         <Card className="border-none shadow-none">
            <CardHeader className="p-0 pb-4">
                <CardTitle className="font-headline text-2xl">Login to your Account</CardTitle>
                <CardDescription>Enter your credentials to access your dashboard.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
                <Form {...form}>
                    <form className="grid gap-4" onSubmit={form.handleSubmit(onSubmit)}>
                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Email</FormLabel>
                                    <FormControl>
                                        <Input placeholder="user@example.com" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="password"
                            render={({ field }) => (
                                <FormItem>
                                    <div className="flex justify-between items-center">
                                        <FormLabel>Password</FormLabel>
                                        <ForgotPasswordModal>
                                            <Button variant="link" type="button" className="text-xs h-auto p-0">Forgot Password?</Button>
                                        </ForgotPasswordModal>
                                    </div>
                                    <FormControl>
                                        <Input type="password" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button className="w-full mt-4" type="submit" disabled={loading}>
                            {loading ? "Signing In..." : <><LogIn className="mr-2"/> Sign In</>}
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}

function SignUpForm({ initialDealerCode }: { initialDealerCode: string | null }) {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);

    const form = useForm<SignUpFormValues>({
        resolver: zodResolver(SignUpFormSchema),
        defaultValues: { 
            name: "", 
            email: "", 
            password: "", 
            role: initialDealerCode ? 'farmer' : undefined, 
            phoneNumber: "", 
            dealerCode: initialDealerCode || "", 
            referralCode: "" 
        },
    });
    
     useEffect(() => {
        if (initialDealerCode) {
            form.setValue('dealerCode', initialDealerCode);
            form.setValue('role', 'farmer');
        }
    }, [initialDealerCode, form]);

    const role = form.watch('role');

    const onSubmit = async (data: SignUpFormValues) => {
        setLoading(true);
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
            await createUser({
                uid: userCredential.user.uid, 
                name: data.name, 
                email: data.email, 
                role: data.role,
                phoneNumber: data.phoneNumber,
                dealerCode: data.dealerCode,
                referredBy: data.referralCode,
            });
            toast({ title: "Success", description: "Account created successfully. Redirecting..." });

        } catch (error: any) {
            let description = 'An unexpected error occurred. Please try again.';
            if (error.code === 'auth/email-already-in-use') {
                description = 'This email address is already in use. Please use a different email or log in.';
            } else if (error.message) {
                description = error.message;
            }

            toast({
                variant: "destructive",
                title: "Sign-up Failed",
                description: description,
            });
        } finally {
            setLoading(false);
        }
    };


    return (
        <Card className="border-none shadow-none">
            <CardHeader className="p-0 pb-4">
                <CardTitle className="font-headline text-2xl">Create a New Account</CardTitle>
                <CardDescription>Get started with Poultry Mitra in minutes.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
                <Form {...form}>
                <form className="grid gap-4" onSubmit={form.handleSubmit(onSubmit)}>
                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Full Name</FormLabel>
                                <FormControl>
                                    <Input placeholder="John Doe" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                    <Input placeholder="user@example.com" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                     <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Password</FormLabel>
                                <FormControl>
                                    <Input type="password" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="phoneNumber"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Phone Number</FormLabel>
                                <FormControl>
                                    <Input placeholder="Your phone number" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                   
                    <FormField
                        control={form.control}
                        name="role"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>I am a...</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!!initialDealerCode}>
                                    <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select your role" />
                                    </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                    <SelectItem value="farmer">Farmer</SelectItem>
                                    <SelectItem value="dealer">Dealer</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    
                    {role === 'farmer' && (
                        <FormField
                            control={form.control}
                            name="dealerCode"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Dealer's Invitation or Farmer Code</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Enter code from your dealer" {...field} disabled={!!initialDealerCode} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    )}

                    <FormField
                        control={form.control}
                        name="referralCode"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Referral Code (Optional)</FormLabel>
                                <FormControl>
                                    <Input placeholder="Enter a referral code" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <Button className="w-full mt-4" type="submit" disabled={loading}>
                        {loading ? "Creating Account..." : <><UserPlus className="mr-2"/>Create Account</>}
                    </Button>
                </form>
                </Form>
            </CardContent>
        </Card>
    );
}
