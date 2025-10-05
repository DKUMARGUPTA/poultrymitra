// src/components/main-nav.tsx
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bird, Users, Warehouse, BookText, LineChart, Bot, MessageCircle, Briefcase, Shield, Settings, TrendingUp, Building, ShoppingCart, PencilRuler, Megaphone, BrainCircuit, CreditCard, TicketPercent, BarChart, Wallet, Image as ImageIcon } from "lucide-react";
import { SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarGroup, SidebarGroupLabel, SidebarSeparator, useSidebar } from "./ui/sidebar";
import { UserProfile } from '@/services/users.service';
import { useUser } from '@/firebase';

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
    farmer: [
        { href: "/dashboard", icon: <LineChart />, label: "Dashboard" },
        { href: "/batches", icon: <Bird />, label: "Batches" },
        { href: "/orders", icon: <ShoppingCart />, label: "Orders" },
        { href: "/ledger", icon: <BookText />, label: "My Ledger" },
        { href: "/reports", icon: <BarChart />, label: "Reports" },
    ],
    dealer: {
      main: [
        { href: "/dashboard", icon: <LineChart />, label: "Dashboard" },
        { href: "/batches", icon: <Bird />, label: "My Batches" },
      ],
      management: [
        { href: "/farmers", icon: <Users />, label: "Farmers" },
        { href: "/suppliers", icon: <Building />, label: "Suppliers" },
        { href: "/inventory", icon: <Warehouse />, label: "Inventory" },
        { href: "/orders", icon: <ShoppingCart />, label: "Orders" },
      ],
      financials: [
        { href: "/expenses", icon: <Wallet />, label: "Business Expenses" },
        { href: "/reports", icon: <BarChart />, label: "Reports" },
      ],
    },
    admin: {
        platform: [
            { href: "/admin", icon: <Shield />, label: "Admin Panel" },
            { href: "/admin/users", icon: <Users />, label: "User Management" },
            { href: "/admin/transactions", icon: <Briefcase />, label: "All Transactions" },
        ],
        subscription: [
            { href: "/admin/billing", icon: <CreditCard />, label: "Payment Verification" },
            { href: "/admin/offers", icon: <TicketPercent />, label: "Subscription Offers" },
            { href: "/admin/subscriptions", icon: <Settings />, label: "Subscription Settings" },
        ],
        management: [
            { href: "/market-rates", icon: <TrendingUp />, label: "Market Rates" },
        ],
        content: [
            { href: "/admin/blog", icon: <PencilRuler />, label: "Blog" },
            { href: "/admin/notifications", icon: <Megaphone />, label: "Announcements" },
        ]
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
