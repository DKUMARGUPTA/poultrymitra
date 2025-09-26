

"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Bird, Users, Shield, MoreVertical, PlusCircle, BookText, TrendingUp, FileDown } from "lucide-react"
import { MainNav } from "@/components/main-nav"
import { UserNav } from "@/components/user-nav"
import {
  Sidebar,
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
} from "@/components/ui/sidebar"
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UserProfile, getAllUsers, updateUserPremiumStatus, updateUserStatus, RatePermission } from '@/services/users.service';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { SuspendUserAlert } from '@/components/suspend-user-alert';
import { DeleteUserAlert } from '@/components/delete-user-alert';
import Link from 'next/link';
import { AddUserModal } from '@/components/add-user-modal';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DealerList } from '@/components/dealer-list';
import { ManageRatePermissionsModal } from '@/components/manage-rate-permissions-modal';
import Papa from 'papaparse';
import { format } from 'date-fns';
import { ThemeToggle } from '@/components/theme-toggle';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import { useFirestore } from '@/firebase/client-provider';


export default function UsersPage() {
  useAdminAuth();
  const { user, loading: authLoading } = useAuth();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
    } else if (db) {
      getAllUsers(db).then(users => {
        setAllUsers(users.filter(u => u.role !== 'admin'));
        setUsersLoading(false);
      });
    }
  }, [user, authLoading, router, db]);

  const handleUserAdded = (newUser: UserProfile) => {
    setAllUsers(prev => [newUser, ...prev]);
  };

  const handlePermissionToggle = async (targetUser: UserProfile, permission: 'isPremium', isChecked: boolean) => {
     // Optimistic update
    setAllUsers(prevUsers => prevUsers.map(u => u.uid === targetUser.uid ? {...u, [permission]: isChecked} : u));

    try {
        if (permission === 'isPremium') {
            await updateUserPremiumStatus(db, targetUser.uid, isChecked);
        }
        
        toast({
            title: "Success",
            description: `${targetUser.name}'s permissions have been updated.`
        });
    } catch (error) {
        // Revert optimistic update on error
        setAllUsers(prevUsers => prevUsers.map(u => u.uid === targetUser.uid ? {...u, [permission]: !isChecked} : u));
        toast({
            variant: "destructive",
            title: "Update Failed",
            description: `Could not update ${targetUser.name}'s status. Please try again.`
        });
    }
  };

  const handleRatePermissionsChange = (uid: string, newPermissions: RatePermission[]) => {
     setAllUsers(prevUsers => prevUsers.map(u => u.uid === uid ? {...u, ratePermissions: newPermissions} : u));
  };

  const handleStatusChange = (targetUser: UserProfile, newStatus: 'active' | 'suspended') => {
    setAllUsers(prevUsers => prevUsers.map(u => u.uid === targetUser.uid ? {...u, status: newStatus} : u));
    toast({
      title: 'User Status Updated',
      description: `${targetUser.name} has been ${newStatus}.`
    });
  }
  
  const handleUserDeleted = (deletedUserId: string) => {
    setAllUsers(prevUsers => prevUsers.filter(u => u.uid !== deletedUserId));
    toast({
      title: 'User Deleted',
      description: 'The user account has been removed.'
    });
  }

  const handleExport = () => {
    setExporting(true);
    try {
        const csvData = allUsers.map(u => ({
            UID: u.uid,
            Name: u.name,
            Email: u.email,
            Role: u.role,
            Status: u.status || 'active',
            IsPremium: u.isPremium ? 'Yes' : 'No',
            PhoneNumber: u.phoneNumber,
            DealerCode: u.dealerCode,
            InvitationCode: u.invitationCode,
            FarmerCode: u.farmerCode,
            ReferralCode: u.referralCode,
        }));
        const csv = Papa.unparse(csvData);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `poultry-mitra-users-${format(new Date(), 'yyyy-MM-dd')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast({ title: 'Export Successful', description: 'User list has been downloaded as a CSV.' });
    } catch (error) {
        console.error("CSV Export failed: ", error);
        toast({ variant: 'destructive', title: 'Export Failed', description: 'Could not export user data.' });
    } finally {
        setExporting(false);
    }
  }

  const isLoading = authLoading || usersLoading || !db;

  if (isLoading) {
    return (
       <div className="flex flex-col h-screen">
        <header className="flex h-14 items-center gap-4 border-b bg-card px-4 lg:h-[60px] lg:px-6"><Skeleton className="h-8 w-32" /><div className="w-full flex-1" /><Skeleton className="h-9 w-9 rounded-full" /></header>
        <div className="flex flex-1">
            <aside className="hidden md:flex flex-col w-64 border-r p-4 gap-4"><Skeleton className="h-8 w-40 mb-4" /><Skeleton className="h-8 w-full" /><Skeleton className="h-8 w-full" /><Skeleton className="h-8 w-full" /></aside>
            <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6"><Skeleton className="h-8 w-48" /><div className="flex-1 rounded-lg border border-dashed shadow-sm p-6"><Skeleton className="h-64 w-full" /></div></main>
        </div>
    </div>
    )
  }

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className="p-4">
          <div className="flex items-center gap-2">
            <Bird className="w-8 h-8 text-primary" /><h1 className="text-2xl font-headline text-primary">Poultry Mitra</h1>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <MainNav />
        </SidebarContent>
        <SidebarFooter>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <div className="flex flex-col">
          <header className="flex h-14 items-center gap-4 border-b bg-card px-4 lg:h-[60px] lg:px-6"><SidebarTrigger className="md:hidden" /><div className="w-full flex-1" /><UserNav /></header>
          <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
            <div className="flex items-center justify-between">
                <div className='flex items-center gap-2'>
                    <Users className="w-6 h-6" />
                    <h1 className="text-lg font-semibold md:text-2xl font-headline">User Management</h1>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={handleExport} disabled={exporting}>
                        <FileDown className="mr-2 h-4 w-4" />{exporting ? 'Exporting...' : 'Export Users'}
                    </Button>
                    <AddUserModal onUserAdded={handleUserAdded}>
                        <Button>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Add User
                        </Button>
                    </AddUserModal>
                </div>
            </div>
            
            <Tabs defaultValue="users">
              <TabsList>
                <TabsTrigger value="users">All Users</TabsTrigger>
                <TabsTrigger value="dealers">Dealers</TabsTrigger>
              </TabsList>
              <TabsContent value="users">
                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline">Platform Users</CardTitle>
                        <CardDescription>View all dealers and farmers, and manage their status and permissions.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {usersLoading ? (
                            <div className="space-y-4">
                                {[...Array(5)].map((_, i) => (
                                    <div key={i} className="flex items-center space-x-4">
                                        <Skeleton className="h-8 w-1/4" />
                                        <Skeleton className="h-8 w-1/4" />
                                        <Skeleton className="h-8 w-1/4" />
                                        <Skeleton className="h-8 w-1/4" />
                                    </div>
                                ))}
                            </div>
                        ) : allUsers.length === 0 ? (
                            <div className="text-center py-12">
                                <p className="text-muted-foreground">No users found.</p>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-center">Premium</TableHead>
                                    <TableHead className="text-center">Post Rates</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {allUsers.map((u) => (
                                    <TableRow key={u.uid} className={u.status === 'suspended' ? 'bg-red-50/50 dark:bg-red-900/10' : ''}>
                                        <TableCell className="font-medium">{u.name}</TableCell>
                                        <TableCell className="text-muted-foreground">{u.email}</TableCell>
                                        <TableCell><Badge variant="outline">{u.role}</Badge></TableCell>
                                        <TableCell>
                                            <Badge variant={u.status === 'suspended' ? 'destructive' : 'secondary'} className={u.status !== 'suspended' ? 'text-green-700 border-green-500/50' : ''}>
                                                {u.status || 'active'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <Crown className={`w-4 h-4 transition-colors ${u.isPremium ? 'text-yellow-500' : 'text-muted-foreground/30'}`} />
                                                <Switch
                                                    checked={!!u.isPremium}
                                                    onCheckedChange={(isChecked) => handlePermissionToggle(u, 'isPremium', isChecked)}
                                                    aria-label="Toggle Premium Access"
                                                    disabled={u.role === 'admin'}
                                                />
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {u.role === 'dealer' && (
                                                <ManageRatePermissionsModal 
                                                  user={u} 
                                                  onPermissionsChange={handleRatePermissionsChange}
                                                >
                                                  <Button variant="outline" size="sm">
                                                    Manage ({u.ratePermissions?.length ?? 0})
                                                  </Button>
                                                </ManageRatePermissionsModal>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                        {user?.uid !== u.uid && u.role !== 'admin' ? (
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent>
                                                    {u.role === 'farmer' && (
                                                        <DropdownMenuItem asChild>
                                                            <Link href={`/farmers/${u.uid}`}>
                                                                <BookText className="mr-2 h-4 w-4"/>
                                                                View Ledger
                                                            </Link>
                                                        </DropdownMenuItem>
                                                    )}
                                                    <SuspendUserAlert user={u} onStatusChange={handleStatusChange}>
                                                        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                                            {u.status === 'suspended' ? 'Reactivate' : 'Suspend'}
                                                        </DropdownMenuItem>
                                                    </SuspendUserAlert>
                                                    <DeleteUserAlert user={u} onUserDeleted={handleUserDeleted}>
                                                        <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive">
                                                            Delete
                                                        </DropdownMenuItem>
                                                    </DeleteUserAlert>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        ) : null}
                                        </TableCell>
                                    </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
              </TabsContent>
               <TabsContent value="dealers">
                <DealerList />
              </TabsContent>
            </Tabs>
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
