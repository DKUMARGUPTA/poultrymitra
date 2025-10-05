// src/app/admin/users/page.tsx
'use client';

import { UsersTable } from "@/components/users-table";

export default function UsersPage() {
  return (
    <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
      <UsersTable />
    </main>
  );
}
