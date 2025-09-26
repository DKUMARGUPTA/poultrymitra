// src/app/settings/layout.tsx
"use client";

import { SidebarProvider, Sidebar, SidebarHeader, SidebarContent, SidebarInset } from "@/components/ui/sidebar";
import { MainNav } from "@/components/main-nav";
import { UserNav } from "@/components/user-nav";
import { Bird } from "lucide-react";
import React from 'react';


export default function SettingsLayout({ children }: { children: React.ReactNode }) {
    
    return (
        <SidebarProvider>
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
                        <div className="w-full flex-1" />
                        <UserNav />
                    </header>
                    {children}
                </div>
            </SidebarInset>
        </SidebarProvider>
    )
}
