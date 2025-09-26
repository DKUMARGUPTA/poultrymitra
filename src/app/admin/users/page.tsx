// src/app/admin/users/page.tsx
import { Users, PlusCircle } from "lucide-react";
import { UserProfile, getAllUsers } from "@/services/users.service";
import { UsersTable } from "@/components/users-table";
import { AddUserModal } from "@/components/add-user-modal";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default async function UsersPage() {
  const allUsers = await getAllUsers();
  // Filter out admin users from being displayed in the table
  const users = allUsers.filter(u => u.role !== 'admin');

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
      <div className="flex items-center justify-between">
        <div className='flex items-center gap-2'>
          <Users className="w-6 h-6" />
          <h1 className="text-lg font-semibold md:text-2xl font-headline">User Management</h1>
        </div>
      </div>
      <UsersTable initialUsers={users} />
    </main>
  );
}
