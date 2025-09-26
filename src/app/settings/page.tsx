
'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import {
  updateUserProfile,
  updateUserPassword,
  deleteCurrentUserAccount,
} from '@/services/users.service';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader, Copy, UserPlus, Key, Link as LinkIcon, Eye, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { Textarea } from '@/components/ui/textarea';
import { moderateContent } from '@/ai/flows/moderate-content';
import { VCard } from '@/components/v-card';
import { Skeleton } from '@/components/ui/skeleton';
import { useFirestore } from '@/firebase/client-provider';

// Schema for updating profile details
const ProfileFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email(),
  phoneNumber: z.string().min(10, 'Phone number must be at least 10 digits'),
  aboutMe: z.string().optional(),
});
type ProfileFormValues = z.infer<typeof ProfileFormSchema>;

// Schema for changing password
const PasswordFormSchema = z
  .object({
    newPassword: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });
type PasswordFormValues = z.infer<typeof PasswordFormSchema>;

// Schema for deleting account
const DeleteAccountSchema = z.object({
  password: z.string().min(1, 'Password is required to delete your account'),
});
type DeleteAccountValues = z.infer<typeof DeleteAccountSchema>;


export default function SettingsPage() {
  const { user, userProfile, loading } = useAuth();
  const router = useRouter();

  if(loading) return (
     <div className="flex flex-col h-screen">
        <header className="flex h-14 items-center gap-4 border-b bg-card px-4 lg:h-[60px] lg:px-6"><Skeleton className="h-8 w-32" /><div className="w-full flex-1" /><Skeleton className="h-9 w-9 rounded-full" /></header>
        <div className="flex flex-1">
            <aside className="hidden md:flex flex-col w-64 border-r p-4 gap-4"><Skeleton className="h-8 w-40 mb-4" /><Skeleton className="h-8 w-full" /><Skeleton className="h-8 w-full" /><Skeleton className="h-8 w-full" /></aside>
            <main className="flex-1 p-6 space-y-6">
              <Skeleton className="h-96 w-full" />
              <Skeleton className="h-64 w-full" />
            </main>
        </div>
    </div>
  )

  return (
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="mx-auto grid w-full max-w-2xl items-center gap-2">
            <div className="flex items-center gap-4">
                 <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4" />
                    <span className="sr-only">Back</span>
                </Button>
                <h1 className="text-3xl font-semibold">Settings</h1>
            </div>
        </div>
        <div className="mx-auto grid w-full max-w-2xl items-start gap-6">
          <SettingsForm />
        </div>
      </main>
  );
}


export function SettingsForm() {
  const { user, userProfile } = useAuth();
  const db = useFirestore();
  const { toast } = useToast();
  const router = useRouter();
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [isDeleteAlertOpen, setDeleteAlertOpen] = useState(false);
  const [origin, setOrigin] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin);
    }
  }, []);

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(ProfileFormSchema),
    defaultValues: {
      name: '',
      email: '',
      phoneNumber: '',
      aboutMe: '',
    },
  });

  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(PasswordFormSchema),
    defaultValues: {
      newPassword: '',
      confirmPassword: '',
    },
  });
  
  const deleteForm = useForm<DeleteAccountValues>({
    resolver: zodResolver(DeleteAccountSchema),
    defaultValues: {
      password: '',
    }
  });


  useEffect(() => {
    if (userProfile) {
      profileForm.reset({
        name: userProfile.name || '',
        email: userProfile.email || '',
        phoneNumber: userProfile.phoneNumber || '',
        aboutMe: userProfile.aboutMe || '',
      });
    }
  }, [userProfile, profileForm]);

  const handleProfileSubmit = async (values: ProfileFormValues) => {
    if (!user) return;
    setProfileLoading(true);
    try {
      // Moderate the 'About Me' content before saving
      if (values.aboutMe && values.aboutMe.trim()) {
        const moderationResult = await moderateContent(values.aboutMe);
        if (!moderationResult.isSafe) {
          throw new Error(moderationResult.reason || 'Your "About Me" content was found to be inappropriate.');
        }
      }

      await updateUserProfile(db, user.uid, {
        name: values.name,
        phoneNumber: values.phoneNumber,
        aboutMe: values.aboutMe,
      });
      toast({ title: 'Success', description: 'Your profile has been updated.' });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error Updating Profile', description: error.message });
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordSubmit = async (values: PasswordFormValues) => {
    setPasswordLoading(true);
    try {
      await updateUserPassword(values.newPassword);
      toast({ title: 'Success', description: 'Your password has been changed.' });
      passwordForm.reset();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to change password. You may need to sign out and sign back in.',
      });
    } finally {
      setPasswordLoading(false);
    }
  };
  
  const handleDeleteAccount = async (values: DeleteAccountValues) => {
    setDeleteLoading(true);
    try {
      await deleteCurrentUserAccount(db, values.password);
      toast({ title: 'Account Deleted', description: 'Your account has been permanently deleted.' });
      router.push('/');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Deletion Failed',
        description: error.message,
      });
    } finally {
        setDeleteLoading(false);
        setDeleteAlertOpen(false);
    }
  };
  
  const handleCopyCode = (code: string | undefined, type: string) => {
    if (code) {
        navigator.clipboard.writeText(code);
        toast({ title: "Copied!", description: `Your ${type} has been copied to the clipboard.`});
    }
  }

  if (!userProfile) return null;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className='font-headline'>Profile Information</CardTitle>
          <CardDescription>Update your personal details.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...profileForm}>
            <form onSubmit={profileForm.handleSubmit(handleProfileSubmit)} className="space-y-4">
              <FormField
                control={profileForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={profileForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input {...field} disabled />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={profileForm.control}
                name="phoneNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={profileForm.control}
                name="aboutMe"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>About Me</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Tell everyone a little bit about yourself..." {...field} />
                    </FormControl>
                     <FormDescription>This will be displayed on your public profile page.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={profileLoading}>
                {profileLoading && <Loader className="mr-2 animate-spin" />}
                Save Changes
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
      
      {userProfile?.username && (
        <Card>
          <CardHeader>
            <CardTitle className='font-headline flex items-center gap-2'><LinkIcon /> Your Digital vCard</CardTitle>
            <CardDescription>This is your public-facing digital visiting card. Share it with anyone!</CardDescription>
          </CardHeader>
          <CardContent>
             <div className="flex items-center gap-2 p-3 mt-2 bg-muted rounded-md text-sm">
                <Link href={`/${userProfile.username}`} className="flex-1 text-primary truncate hover:underline" target="_blank">
                    <span className="flex items-center gap-2"><Eye/> {origin}/{userProfile.username}</span>
                </Link>
                <Button variant="outline" size="icon" onClick={() => handleCopyCode(`${origin}/${userProfile.username}`, 'vCard link')}>
                    <Copy className="w-5 h-5"/>
                </Button>
            </div>
             <VCard user={userProfile} />
          </CardContent>
        </Card>
      )}

      {userProfile?.role === 'dealer' && userProfile.invitationCode && (
      <Card>
        <CardHeader>
          <CardTitle className='font-headline flex items-center gap-2'><UserPlus/>Your Invitation Code</CardTitle>
          <CardDescription>Share this code with farmers so they can connect with you.</CardDescription>
        </CardHeader>
        <CardContent>
           <div className="flex items-center gap-2 p-3 mt-2 bg-muted rounded-md">
              <p className="text-2xl font-bold font-mono text-primary tracking-widest flex-1">{userProfile.invitationCode}</p>
              <Button variant="outline" size="icon" onClick={() => handleCopyCode(userProfile?.invitationCode, 'invitation code')}>
                  <Copy className="w-5 h-5"/>
              </Button>
          </div>
        </CardContent>
      </Card>
      )}

      {userProfile?.role === 'farmer' && userProfile.farmerCode && (
      <Card>
        <CardHeader>
          <CardTitle className='font-headline flex items-center gap-2'><Key/>Your Farmer Code</CardTitle>
          <CardDescription>Share this code with a dealer to connect your profile, or use it to sign up on a new device.</CardDescription>
        </CardHeader>
        <CardContent>
           <div className="flex items-center gap-2 p-3 mt-2 bg-muted rounded-md">
              <p className="text-2xl font-bold font-mono text-primary tracking-widest flex-1">{userProfile.farmerCode}</p>
              <Button variant="outline" size="icon" onClick={() => handleCopyCode(userProfile?.farmerCode, 'farmer code')}>
                  <Copy className="w-5 h-5"/>
              </Button>
          </div>
        </CardContent>
      </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className='font-headline'>Change Password</CardTitle>
          <CardDescription>Choose a new, strong password.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...passwordForm}>
            <form onSubmit={passwordForm.handleSubmit(handlePasswordSubmit)} className="space-y-4">
              <FormField
                control={passwordForm.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Password</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={passwordForm.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm New Password</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={passwordLoading}>
                {passwordLoading && <Loader className="mr-2 animate-spin" />}
                Change Password
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
      
      {userProfile?.referralCode && (
        <Card>
          <CardHeader>
            <CardTitle className='font-headline'>Referral Program</CardTitle>
            <CardDescription>Share your code with others. When someone signs up using your code, you'll earn rewards!</CardDescription>
          </CardHeader>
          <CardContent>
            <Label>Your Unique Referral Code</Label>
            <div className="flex items-center gap-2 p-3 mt-2 bg-muted rounded-md">
                <p className="text-2xl font-bold font-mono text-primary tracking-widest flex-1">{userProfile.referralCode}</p>
                <Button variant="outline" size="icon" onClick={() => handleCopyCode(userProfile?.referralCode, 'referral code')}>
                    <Copy className="w-5 h-5"/>
                </Button>
            </div>
          </CardContent>
        </Card>
      )}
       <Card className="border-destructive">
        <CardHeader>
          <CardTitle className='font-headline text-destructive'>Delete Account</CardTitle>
          <CardDescription>Permanently delete your account and all associated data.</CardDescription>
        </CardHeader>
        <CardContent>
           <AlertDialog open={isDeleteAlertOpen} onOpenChange={setDeleteAlertOpen}>
            <AlertDialogTrigger asChild>
                <Button variant="destructive">Delete My Account</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete your account. To confirm, please enter your password.
                </AlertDialogDescription>
                </AlertDialogHeader>
                <Form {...deleteForm}>
                    <form id="delete-form" onSubmit={deleteForm.handleSubmit(handleDeleteAccount)} className="space-y-4">
                        <FormField
                            control={deleteForm.control}
                            name="password"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Password</FormLabel>
                                <FormControl>
                                <Input type="password" {...field} autoFocus />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                    </form>
                </Form>
                <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction type="submit" form="delete-form" asChild>
                    <Button variant="destructive" disabled={deleteLoading}>
                        {deleteLoading ? 'Deleting...' : 'Yes, delete my account'}
                    </Button>
                </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
            </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
}
