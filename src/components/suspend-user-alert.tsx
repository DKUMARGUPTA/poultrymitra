'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { updateUserStatus, UserProfile } from "@/services/users.service";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

interface SuspendUserAlertProps {
    user: UserProfile;
    onStatusChange: (user: UserProfile, newStatus: 'active' | 'suspended') => void;
    children: React.ReactNode;
}

export function SuspendUserAlert({ user, onStatusChange, children }: SuspendUserAlertProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const isSuspended = user.status === 'suspended';
  const newStatus = isSuspended ? 'active' : 'suspended';
  const actionText = isSuspended ? 'Reactivate' : 'Suspend';

  const handleAction = async () => {
    setLoading(true);
    try {
        await updateUserStatus(user.uid, newStatus);
        onStatusChange(user, newStatus);
    } catch(error) {
        toast({
            variant: "destructive",
            title: "Update Failed",
            description: `Could not ${actionText.toLowerCase()} ${user.name}. Please try again.`
        });
    } finally {
        setLoading(false);
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        {children}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirm {actionText}</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to {actionText.toLowerCase()} the account for <span className="font-bold">{user.name}</span>? {isSuspended ? 'They will regain access to their account.' : 'They will temporarily lose access to their account.'}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleAction} asChild>
             <Button variant={isSuspended ? 'default' : 'destructive'} disabled={loading}>
              {loading ? `${actionText}ing...` : `Yes, ${actionText} User`}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
