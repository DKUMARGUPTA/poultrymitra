// src/app/transactions/page.tsx
import { Bird, Briefcase } from "lucide-react";
import { MainNav } from "@/components/main-nav";
import { UserNav } from "@/components/user-nav";
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getAllTransactionsAsync } from "@/services/transactions.service";
import { TransactionTable } from "@/components/transaction-table";

// This page is now a Server Component
export default async function TransactionsPage() {
  // Fetch initial data on the server
  const initialTransactions = await getAllTransactionsAsync();

  return (
    <>
      <Sidebar>
        <SidebarHeader className="p-4">
          <div className="flex items-center gap-2">
            <Bird className="w-8 h-8 text-primary" />
            <h1 className="text-2xl font-headline text-primary">Poultry Mitra</h1>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <MainNav />
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <div className="flex flex-col">
          <header className="flex h-14 items-center gap-4 border-b bg-card px-4 lg:h-[60px] lg:px-6">
            <SidebarTrigger className="md:hidden" />
            <div className="w-full flex-1" />
            <UserNav />
          </header>
          <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
            <div className="flex items-center justify-between">
              <h1 className="text-lg font-semibold md:text-2xl font-headline flex items-center gap-2">
                <Briefcase />
                All Transactions
              </h1>
            </div>
            <Card>
              <CardHeader>
                <CardTitle className="font-headline">
                  Global Transaction Log
                </CardTitle>
                <CardDescription>
                  View all recent transactions across all users.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TransactionTable initialTransactions={initialTransactions} />
              </CardContent>
            </Card>
          </main>
        </div>
      </SidebarInset>
    </>
  );
}
