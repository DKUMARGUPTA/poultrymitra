// src/app/admin/transactions/page.tsx
import { Briefcase } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TransactionHistory } from "@/components/transaction-history";

export default async function TransactionsPage() {
  return (
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
          <TransactionHistory scope="all" />
        </CardContent>
      </Card>
    </main>
  );
}
