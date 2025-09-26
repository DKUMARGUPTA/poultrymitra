// src/app/users/page.tsx
import { Bird, Users, PlusCircle, FileDown } from "lucide-react";
import { MainNav } from "@/components/main-nav";
import { UserNav } from "@/components/user-nav";
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { getAllUsers } from "@/services/users.service";
import { UsersTable } from "@/components/users-table";
import { ExportUsersButton } from "@/components/export-users-button";
import { AddUserModal } from "@/components/add-user-modal";


export default async function UsersPage() {
    const users = await getAllUsers();
    const initialUsers = users.filter(u => u.role !== 'admin');

    return (
        <>
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
                           <ExportUsersButton users={initialUsers} />
                           <AddUserModal>
                                <div className="p-2 border rounded-md">
                                    <PlusCircle className="mr-2 h-4 w-4" />
                                    Add User
                                </div>
                            </AddUserModal>
                        </div>
                    </div>
                    <UsersTable initialUsers={initialUsers} />
                </main>
                </div>
            </SidebarInset>
        </>
    );
}
