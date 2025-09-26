
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


export function UsersTable({ initialUsers }: { initialUsers: UserProfile[] }) {
  const { toast } = useToast();
  const [users, setUsers] = useState<UserProfile[]>(initialUsers);

  useEffect(() => {
    // This allows the table to be updated when a new user is added via the modal
    setUsers(initialUsers);
  }, [initialUsers]);

  const handleUserAdded = (newUser: UserProfile) => {
    setUsers(prev => [newUser, ...prev].sort((a,b) => a.name.localeCompare(b.name)));
  };

  const handlePermissionToggle = async (targetUser: UserProfile, permission: 'isPremium', isChecked: boolean) => {
     // Optimistic update
    setUsers(prevUsers => prevUsers.map(u => u.uid === targetUser.uid ? {...u, [permission]: isChecked} : u));

    try {
        if (permission === 'isPremium') {
            await updateUserPremiumStatus(targetUser.uid, isChecked);
        }
        
        toast({
            title: "Success",
            description: `${targetUser.name}'s permissions have been updated.`
        });
    } catch (error) {
        // Revert optimistic update on error
        setUsers(prevUsers => prevUsers.map(u => u.uid === targetUser.uid ? {...u, [permission]: !isChecked} : u));
        toast({
            variant: "destructive",
            title: "Update Failed",
            description: `Could not update ${targetUser.name}'s status. Please try again.`
        });
    }
  };

  const handleRatePermissionsChange = (uid: string, newPermissions: RatePermission[]) => {
     setUsers(prevUsers => prevUsers.map(u => u.uid === uid ? {...u, ratePermissions: newPermissions} : u));
  };

  const handleStatusChange = (targetUser: UserProfile, newStatus: 'active' | 'suspended') => {
    setUsers(prevUsers => prevUsers.map(u => u.uid === targetUser.uid ? {...u, status: newStatus} : u));
    toast({
      title: 'User Status Updated',
      description: `${targetUser.name} has been ${newStatus}.`
    });
  }
  
  const handleUserDeleted = (deletedUserId: string) => {
    setUsers(prevUsers => prevUsers.filter(u => u.uid !== deletedUserId));
    toast({
      title: 'User Deleted',
      description: 'The user account has been removed.'
    });
  }

  return (
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
                    {users.length === 0 ? (
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
                                {users.map((u) => (
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
                                    {u.role !== 'admin' ? (
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
  )
}
