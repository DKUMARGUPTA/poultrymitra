// src/app/users/page.tsx
"use client";

import { useEffect, useState } from "react";
import { Users, PlusCircle } from "lucide-react";
import { UserProfile, getAllUsers } from "@/services/users.service";
import { UsersTable } from "@/components/users-table";
import { AddUserModal } from "@/components/add-user-modal";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

export default function UsersPage() {
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        getAllUsers().then(allUsers => {
            setUsers(allUsers.filter(u => u.role !== 'admin'));
            setLoading(false);
        });
    }, []);

    const handleUserAdded = (newUser: UserProfile) => {
      setUsers(prev => [newUser, ...prev]);
    }

    if (loading) {
      return (
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
          <div className="flex items-center justify-between">
            <Skeleton className="h-8 w-48" />
            <div className="flex gap-2">
              <Skeleton className="h-10 w-24" />
            </div>
          </div>
          <Skeleton className="h-96 w-full" />
        </main>
      )
    }

    return (
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
            <div className="flex items-center justify-between">
                <div className='flex items-center gap-2'>
                    <Users className="w-6 h-6" />
                    <h1 className="text-lg font-semibold md:text-2xl font-headline">User Management</h1>
                </div>
                <div className="flex gap-2">
                   <AddUserModal onUserAdded={handleUserAdded}>
                        <Button>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Add User
                        </Button>
                    </AddUserModal>
                </div>
            </div>
            <UsersTable initialUsers={users} />
        </main>
    );
}
