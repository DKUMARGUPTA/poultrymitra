// src/components/user-nav.tsx
"use client"

import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { useAuth } from "@/hooks/use-auth";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Crown, Copy, Bell, BellRing, CreditCard, Moon, Sun, User as UserIcon } from "lucide-react"
import { useToast } from "@/hooks/use-toast";
import { getUserProfile, UserProfile } from "@/services/users.service";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { getNotificationsForUser, markNotificationsAsRead, AppNotification } from "@/services/notifications.service";
import { formatDistanceToNow } from "date-fns";
import { useTheme } from "next-themes";
import { ThemeToggle } from "./theme-toggle";
import { useSidebar } from "./ui/sidebar";
import { useFirestore, useFirebaseAuth } from "@/firebase/provider";

export function UserNav() {
  const { user, userProfile } = useAuth();
  const auth = useFirebaseAuth();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { setOpenMobile } = useSidebar();


  useEffect(() => {
    if (user && db) {
      const unsubscribe = getNotificationsForUser(db, user.uid, (newNotifications) => {
        setNotifications(newNotifications);
        setUnreadCount(newNotifications.filter(n => !n.isRead).length);
      });
      return () => unsubscribe();
    }
  }, [user, db]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast({ title: "Logged out", description: "You have been successfully logged out." });
      router.push("/");
    } catch (error: any) {
      toast({ variant: "destructive", title: "Logout Failed", description: error.message });
    }
  };
  
  const handleLinkClick = () => {
    setOpenMobile(false);
  }

  const handleCopyCode = (code: string | undefined, type: string) => {
    if (code) {
        navigator.clipboard.writeText(code);
        toast({ title: "Copied!", description: `Your ${type} has been copied to the clipboard.`});
    }
  }
  
  const handleNotificationOpen = () => {
    if (unreadCount > 0 && user && db) {
        markNotificationsAsRead(db, user.uid);
    }
  };


  return (
    <div className="flex items-center gap-2">
    <Popover onOpenChange={(open) => open && handleNotificationOpen()}>
        <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="relative h-8 w-8 rounded-full">
                {unreadCount > 0 ? <BellRing className="h-5 w-5 text-primary animate-pulse" /> : <Bell className="h-5 w-5" />}
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">{unreadCount}</span>
                )}
            </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80" align="end">
            <div className="grid gap-4">
                <div className="space-y-2">
                    <h4 className="font-medium leading-none">Notifications</h4>
                    <p className="text-sm text-muted-foreground">
                    Your recent updates and alerts.
                    </p>
                </div>
                <div className="grid gap-2">
                {notifications.length > 0 ? notifications.slice(0,5).map(n => (
                     <Link href={n.link || '#'} key={n.id} className="block hover:bg-muted/50 -mx-2 px-2 py-2 rounded-md">
                        <div className="grid grid-cols-[25px_1fr] items-start">
                            {!n.isRead && <span className="flex h-2 w-2 translate-y-1 rounded-full bg-sky-500" />}
                            {n.isRead && <span/>}
                            <div className="grid gap-1">
                                <p className="text-sm font-medium leading-none">{n.title}</p>
                                <p className="text-sm text-muted-foreground">{n.message}</p>
                                <p className="text-xs text-muted-foreground">
                                    {n.createdAt ? formatDistanceToNow(n.createdAt.toDate(), { addSuffix: true }) : ''}
                                </p>
                            </div>
                        </div>
                     </Link>
                )) : (
                    <p className="text-sm text-muted-foreground text-center py-4">No new notifications.</p>
                )}
                </div>
            </div>
        </PopoverContent>
    </Popover>
    <ThemeToggle />
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-9 w-9">
            <AvatarImage src={user?.photoURL || `https://picsum.photos/seed/${user?.uid}/200`} alt="User Avatar" data-ai-hint="user avatar" />
            <AvatarFallback>{userProfile?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <div className="flex items-center gap-2">
                <p className="text-sm font-medium leading-none">{userProfile?.name || 'Poultry Mitra User'}</p>
                {userProfile?.isPremium && <Crown className="h-4 w-4 text-yellow-500" />}
            </div>
            <p className="text-xs leading-none text-muted-foreground">
              {user?.email}
            </p>
          </div>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
         <DropdownMenuGroup>
          <DropdownMenuItem asChild>
             <Link href={`/${userProfile?.username || 'settings'}`}>
                <UserIcon className="mr-2 h-4 w-4" />
                <span>My Profile</span>
            </Link>
          </DropdownMenuItem>
           {userProfile?.role !== 'admin' && (
          <DropdownMenuItem asChild>
            <Link href="/settings/billing">
                <CreditCard className="mr-2 h-4 w-4" />
                Billing
            </Link>
          </DropdownMenuItem>
          )}
           <DropdownMenuItem asChild>
            <Link href="/settings">
                Settings
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />
        
        {userProfile?.role === 'farmer' && userProfile.farmerCode && (
            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                <div className="flex items-center justify-between w-full text-xs">
                    <span>Farmer Code: <b>{userProfile.farmerCode}</b></span>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleCopyCode(userProfile.farmerCode, 'Farmer Code')}>
                        <Copy className="h-3 w-3" />
                    </Button>
                </div>
            </DropdownMenuItem>
        )}
        {userProfile?.role === 'dealer' && userProfile.invitationCode && (
             <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                <div className="flex items-center justify-between w-full text-xs">
                    <span>Invite Code: <b>{userProfile.invitationCode}</b></span>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleCopyCode(userProfile.invitationCode, 'Invitation Code')}>
                        <Copy className="h-3 w-3" />
                    </Button>
                </div>
            </DropdownMenuItem>
        )}
         {userProfile?.referralCode && (
            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                <div className="flex items-center justify-between w-full text-xs">
                    <span>Referral Code: <b>{userProfile.referralCode}</b></span>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleCopyCode(userProfile.referralCode, 'Referral Code')}>
                        <Copy className="h-3 w-3" />
                    </Button>
                </div>
            </DropdownMenuItem>
        )}
       
         {!userProfile?.isPremium && userProfile?.role !== 'admin' && (
            <>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild className="text-accent-foreground bg-accent/80 focus:bg-accent">
              <Link href="/settings/billing">
                <Crown className="mr-2 h-4 w-4" />
                Upgrade to Premium
              </Link>
            </DropdownMenuItem>
            </>
         )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
    </div>
  )
}
