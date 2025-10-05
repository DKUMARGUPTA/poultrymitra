// src/components/main-nav.tsx
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bird, Users, Warehouse, BookText, LineChart, Bot, MessageCircle, Briefcase, Shield, Settings, TrendingUp, Building, ShoppingCart, PencilRuler, Megaphone, BrainCircuit, CreditCard, TicketPercent, BarChart, Wallet, Image as ImageIcon } from "lucide-react";
import { SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarGroup, SidebarGroupLabel, SidebarSeparator, useSidebar } from "./ui/sidebar";
import { UserProfile } from '@/services/users.service';
import { useUser } from '@/firebase';
import { Skeleton } from './ui/skeleton';

export function MainNav() {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();
  const { userProfile } = useUser();
  const userRole = userProfile?.role;

  const handleLinkClick = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setOpenMobile(false);
    }
  }

  const isNavItemActive = (href: string) => {
    if (href === '/dashboard' || href === '/admin') {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };
  
  const navItems = {
    farmer: [],
    dealer: {
      main: [],
      management: [],
      financials: [],
    },
    admin: {
        platform: [],
        subscription: [],
        management: [],
        content: []
    }
  };

  const renderAdminNav = () => (
    <>
        <SidebarGroup>
            <SidebarGroupLabel>Platform</SidebarGroupLabel>
            <SidebarMenu>
                {navItems.admin.platform.map((item) => (
                    <SidebarMenuItem key={item.href}>
                        <Link href={item.href} passHref onClick={handleLinkClick}>
                            <SidebarMenuButton asChild isActive={isNavItemActive(item.href)}>
                                <span>{item.icon}<span>{item.label}</span></span>
                            </SidebarMenuButton>
                        </Link>
                    </SidebarMenuItem>
                ))}
            </SidebarMenu>
        </SidebarGroup>
        <SidebarGroup>
            <SidebarGroupLabel>Subscription</SidebarGroupLabel>
            <SidebarMenu>
                {navItems.admin.subscription.map((item) => (
                     <SidebarMenuItem key={item.href}>
                        <Link href={item.href} passHref onClick={handleLinkClick}>
                            <SidebarMenuButton asChild isActive={isNavItemActive(item.href)}>
                                <span>{item.icon}<span>{item.label}</span></span>
                            </SidebarMenuButton>
                        </Link>
                    </SidebarMenuItem>
                ))}
            </SidebarMenu>
        </SidebarGroup>
        <SidebarGroup>
            <SidebarGroupLabel>Management</SidebarGroupLabel>
            <SidebarMenu>
                {navItems.admin.management.map((item) => (
                     <SidebarMenuItem key={item.href}>
                        <Link href={item.href} passHref onClick={handleLinkClick}>
                            <SidebarMenuButton asChild isActive={isNavItemActive(item.href)}>
                                <span>{item.icon}<span>{item.label}</span></span>
                            </SidebarMenuButton>
                        </Link>
                    </SidebarMenuItem>
                ))}
            </SidebarMenu>
        </SidebarGroup>
        <SidebarGroup>
            <SidebarGroupLabel>Content</SidebarGroupLabel>
            <SidebarMenu>
                {navItems.admin.content.map((item) => (
                     <SidebarMenuItem key={item.href}>
                        <Link href={item.href} passHref onClick={handleLinkClick}>
                            <SidebarMenuButton asChild isActive={isNavItemActive(item.href)}>
                                <span>{item.icon}<span>{item.label}</span></span>
                            </SidebarMenuButton>
                        </Link>
                    </SidebarMenuItem>
                ))}
            </SidebarMenu>
        </SidebarGroup>
    </>
  );

  const renderDealerNav = () => (
    <>
        <SidebarGroup>
            <SidebarMenu>
                {navItems.dealer.main.map((item) => (
                    <SidebarMenuItem key={item.href}>
                        <Link href={item.href} passHref onClick={handleLinkClick}>
                            <SidebarMenuButton asChild isActive={isNavItemActive(item.href)}>
                                <span>{item.icon}<span>{item.label}</span></span>
                            </SidebarMenuButton>
                        </Link>
                    </SidebarMenuItem>
                ))}
            </SidebarMenu>
        </SidebarGroup>
        <SidebarGroup>
            <SidebarGroupLabel>Management</SidebarGroupLabel>
            <SidebarMenu>
                {navItems.dealer.management.map((item) => (
                    <SidebarMenuItem key={item.href}>
                        <Link href={item.href} passHref onClick={handleLinkClick}>
                            <SidebarMenuButton asChild isActive={isNavItemActive(item.href)}>
                                <span>{item.icon}<span>{item.label}</span></span>
                            </SidebarMenuButton>
                        </Link>
                    </SidebarMenuItem>
                ))}
            </SidebarMenu>
        </SidebarGroup>
        <SidebarGroup>
            <SidebarGroupLabel>Financials</SidebarGroupLabel>
            <SidebarMenu>
                {navItems.dealer.financials.map((item) => (
                    <SidebarMenuItem key={item.href}>
                        <Link href={item.href} passHref onClick={handleLinkClick}>
                            <SidebarMenuButton asChild isActive={isNavItemActive(item.href)}>
                                <span>{item.icon}<span>{item.label}</span></span>
                            </SidebarMenuButton>
                        </Link>
                    </SidebarMenuItem>
                ))}
            </SidebarMenu>
        </SidebarGroup>
    </>
  );

  const renderFarmerNav = () => (
    <>
     <SidebarGroup>
        <SidebarMenu>
        {navItems.farmer.map((item) => (
            <SidebarMenuItem key={item.href}>
                <Link href={item.href} passHref onClick={handleLinkClick}>
                    <SidebarMenuButton asChild isActive={isNavItemActive(item.href)}>
                        <span>
                            {item.icon}
                            <span>{item.label}</span>
                        </span>
                    </SidebarMenuButton>
                </Link>
            </SidebarMenuItem>
        ))}
        </SidebarMenu>
    </SidebarGroup>
    </>
  );

  const renderCoreNav = () => {
    switch (userRole) {
        case 'admin': return renderAdminNav();
        case 'dealer': return renderDealerNav();
        case 'farmer': return renderFarmerNav();
        default: return null;
    }
  }

  if (!userProfile) {
    return (
        <div className="p-4 space-y-4">
            <Skeleton className="h-8" />
            <Skeleton className="h-8" />
            <Skeleton className="h-8" />
        </div>
    )
  }

  return (
    <>
    {renderCoreNav()}
    {userRole !== 'admin' && (
      <>
        <SidebarGroup>
            <SidebarGroupLabel>AI Suite</SidebarGroupLabel>
            <SidebarMenu>
                <SidebarMenuItem>
                    <Link href="/ai-chat" passHref onClick={handleLinkClick}>
                        <SidebarMenuButton asChild isActive={isNavItemActive('/ai-chat')}>
                            <span><Bot /><span>AI Assistant</span></span>
                        </SidebarMenuButton>
                    </Link>
                </SidebarMenuItem>
                <SidebarMenuItem>
                    <Link href="/ai-tools/image-generation" passHref onClick={handleLinkClick}>
                        <SidebarMenuButton asChild isActive={isNavItemActive('/ai-tools/image-generation')}>
                            <span><ImageIcon /><span>Image Generation</span></span>
                        </SidebarMenuButton>
                    </Link>
                </SidebarMenuItem>
                <SidebarMenuItem>
                    <Link href="/ai-tools" passHref onClick={handleLinkClick}>
                        <SidebarMenuButton asChild isActive={isNavItemActive('/ai-tools')}>
                            <span><BrainCircuit /><span>AI Tools</span></span>
                        </SidebarMenuButton>
                    </Link>
                </SidebarMenuItem>
                {userRole === 'dealer' && (
                    <SidebarMenuItem>
                        <Link href="/whatsapp" passHref onClick={handleLinkClick}>
                            <SidebarMenuButton asChild isActive={isNavItemActive('/whatsapp')}>
                                <span><MessageCircle /><span>WhatsApp</span></span>
                            </SidebarMenuButton>
                        </Link>
                    </SidebarMenuItem>
                )}
            </SidebarMenu>
        </SidebarGroup>
      </>
    )}
     <SidebarGroup>
        <SidebarGroupLabel>Account</SidebarGroupLabel>
        <SidebarMenu>
             <SidebarMenuItem>
                <Link href="/settings" passHref onClick={handleLinkClick}>
                    <SidebarMenuButton asChild isActive={isNavItemActive('/settings')}>
                        <span><Settings /><span>Settings</span></span>
                    </SidebarMenuButton>
                </Link>
            </SidebarMenuItem>
              {userRole !== 'admin' && (
                <SidebarMenuItem>
                    <Link href="/settings/billing" passHref onClick={handleLinkClick}>
                        <SidebarMenuButton asChild isActive={isNavItemActive('/settings/billing')}>
                            <span><CreditCard /><span>Billing</span></span>
                        </SidebarMenuButton>
                    </Link>
                </SidebarMenuItem>
            )}
        </SidebarMenu>
    </SidebarGroup>
    </>
  );
}
