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
import { deleteUserAccount, UserProfile } from "@/services/users.service";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

interface DeleteUserAlertProps {
    user: UserProfile;
    onUserDeleted: (uid: string) => void;
    children: React.ReactNode;
}

export function DeleteUserAlert({ user, onUserDeleted, children }: DeleteUserAlertProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleDelete = async () => {
    setLoading(true);
    try {
        await deleteUserAccount(user.uid);
        onUserDeleted(user.uid);
    } catch(error: any) {
        toast({
            variant: "destructive",
            title: "Deletion Failed",
            description: error.message || `Could not delete ${user.name}. Please try again.`
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
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the account for <span className="font-bold">{user.name}</span> and remove their data from our servers.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} asChild>
            <Button variant="destructive" disabled={loading}>
              {loading ? 'Deleting...' : 'Yes, delete user'}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
