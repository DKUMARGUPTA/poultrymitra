
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader, UserPlus } from 'lucide-react';
import { createUserByAdmin, UserProfile } from '@/services/users.service';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

const AddUserFormSchema = z.object({
    name: z.string().min(1, { message: "Name is required." }),
    email: z.string().email({ message: "Invalid email address." }),
    password: z.string().min(6, { message: "Password must be at least 6 characters."}),
    role: z.enum(['farmer', 'dealer'], { required_error: "You must select a role."}),
});
type AddUserFormValues = z.infer<typeof AddUserFormSchema>;


interface AddUserModalProps {
  children: React.ReactNode;
  onUserAdded: (user: UserProfile) => void;
}

export function AddUserModal({ children, onUserAdded }: AddUserModalProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const addUserForm = useForm<AddUserFormValues>({
    resolver: zodResolver(AddUserFormSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      role: "farmer",
    },
  });

  const handleCreateUser = async (values: AddUserFormValues) => {
    setLoading(true);
    try {
      const newUserProfile = await createUserByAdmin(values);
      
      toast({
        title: 'User Created Successfully',
        description: `An account for ${values.name} has been created.`,
        duration: 10000,
      });
      onUserAdded(newUserProfile);
      setOpen(false);
    } catch (error: any) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Error Creating User',
        description: error.message || 'Failed to create user. The email may already be in use.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      addUserForm.reset();
      setLoading(false);
    }
  };


  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
          {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl flex items-center gap-2">
            <UserPlus className="w-6 h-6 text-primary" />
            Create a New User
          </DialogTitle>
          <DialogDescription>
            Enter the new user's details and a temporary password. They can change it later in their settings.
          </DialogDescription>
        </DialogHeader>
        <Form {...addUserForm}>
          <form onSubmit={addUserForm.handleSubmit(handleCreateUser)} className="space-y-4" id="add-user-form">
            <FormField
              control={addUserForm.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Ram Singh" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={addUserForm.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., user@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
                control={addUserForm.control}
                name="password"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Temporary Password</FormLabel>
                        <FormControl>
                            <Input type="password" placeholder="Set a temporary password" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
            <FormField
                control={addUserForm.control}
                name="role"
                render={({ field }) => (
                    <FormItem>
                         <FormLabel>User Role</FormLabel>
                         <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a role" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectItem value="farmer">Farmer</SelectItem>
                                <SelectItem value="dealer">Dealer</SelectItem>
                            </SelectContent>
                         </Select>
                         <FormMessage />
                    </FormItem>
                )}
            />
          </form>
        </Form>
        <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Cancel
            </Button>
            <Button type="submit" form="add-user-form" disabled={loading}>
                {loading ? <><Loader className="animate-spin mr-2" /> Creating...</> : 'Create User'}
            </Button>
        </DialogFooter>

      </DialogContent>
    </Dialog>
  );
}
