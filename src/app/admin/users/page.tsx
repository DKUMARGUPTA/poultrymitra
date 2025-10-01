// src/app/admin/users/page.tsx
'use client';

import { Users, PlusCircle } from "lucide-react";
import { UserProfile, getAllUsers } from "@/services/users.service";
import { UsersTable } from "@/components/users-table";
import { AddUserModal } from "@/components/add-user-modal";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";


export default function UsersPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
        router.push('/auth');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    async function fetchUsers() {
        setLoading(true);
        const allUsers = await getAllUsers();
        // Filter out admin users from being displayed in the table
        setUsers(allUsers.filter(u => u.role !== 'admin'));
        setLoading(false);
    }
    fetchUsers();
  }, []);

  const handleUserAdded = (newUser: UserProfile) => {
    setUsers(prev => [newUser, ...prev]);
  }


  if (authLoading || !user) {
    return (
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-96 w-full" />
        </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
      <div className="flex items-center justify-between">
        <div className='flex items-center gap-2'>
          <Users className="w-6 h-6" />
          <h1 className="text-lg font-semibold md:text-2xl font-headline">User Management</h1>
        </div>
         <AddUserModal onUserAdded={handleUserAdded}>
            <Button>
                <PlusCircle className="mr-2 h-4 w-4" /> New User
            </Button>
        </AddUserModal>
      </div>
      {loading ? <Skeleton className="h-96 w-full" /> : <UsersTable initialUsers={users} />}
    </main>
  );
}
