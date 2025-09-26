
// src/components/manage-rate-permissions-modal.tsx
'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader, MapPin, PlusCircle, Save, Trash2, X } from 'lucide-react';
import { UserProfile, RatePermission, updateUserRatePermissions } from '@/services/users.service';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { indianStates } from '@/lib/indian-states';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from './ui/command';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Label } from './ui/label';

interface ManageRatePermissionsModalProps {
  children: React.ReactNode;
  user: UserProfile;
  onPermissionsChange: (uid: string, newPermissions: RatePermission[]) => void;
}

export function ManageRatePermissionsModal({ children, user, onPermissionsChange }: ManageRatePermissionsModalProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const [currentPermissions, setCurrentPermissions] = useState<RatePermission[]>(user.ratePermissions || []);
  const [newState, setNewState] = useState('');
  const [newDistricts, setNewDistricts] = useState<string[]>([]);

  const handleAddPermission = () => {
    if (!newState || newDistricts.length === 0) {
      toast({ variant: 'destructive', title: 'Incomplete Selection', description: 'Please select a state and at least one district.' });
      return;
    }

    setCurrentPermissions(prev => {
        const existingStateIndex = prev.findIndex(p => p.state === newState);
        if (existingStateIndex > -1) {
            // Merge districts, avoiding duplicates
            const existing = prev[existingStateIndex];
            const updatedDistricts = [...new Set([...existing.districts, ...newDistricts])].sort();
            const updatedPermissions = [...prev];
            updatedPermissions[existingStateIndex] = { ...existing, districts: updatedDistricts };
            return updatedPermissions;
        } else {
            // Add new state permission
            return [...prev, { state: newState, districts: newDistricts.sort() }];
        }
    });

    // Reset inputs
    setNewState('');
    setNewDistricts([]);
  };

  const handleRemoveDistrict = (state: string, district: string) => {
    setCurrentPermissions(prev => {
        const stateIndex = prev.findIndex(p => p.state === state);
        if (stateIndex === -1) return prev;

        const updatedPermissions = [...prev];
        const permission = updatedPermissions[stateIndex];
        const updatedDistricts = permission.districts.filter(d => d !== district);

        if (updatedDistricts.length === 0) {
            // Remove the state entry if no districts are left
            updatedPermissions.splice(stateIndex, 1);
        } else {
            updatedPermissions[stateIndex] = { ...permission, districts: updatedDistricts };
        }
        return updatedPermissions;
    });
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await updateUserRatePermissions(user.uid, currentPermissions);
      onPermissionsChange(user.uid, currentPermissions);
      toast({ title: 'Permissions Updated', description: `${user.name}'s rate permissions have been saved.` });
      setOpen(false);
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Update Failed', description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
        setCurrentPermissions(user.ratePermissions || []);
        setNewState('');
        setNewDistricts([]);
    }
  }

  const availableDistricts = indianStates.find(s => s.name === newState)?.districts || [];
  
  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl flex items-center gap-2">
            <MapPin className="w-6 h-6 text-primary" />
            Manage Rate Permissions for {user.name}
          </DialogTitle>
          <DialogDescription>
            Grant this dealer permission to post market rates for specific states and districts.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-6 py-4">
            {/* Add Permissions Column */}
            <div className="space-y-4">
                <h3 className="font-semibold text-lg">Add New Permission</h3>
                <div className="space-y-2">
                    <Label>State</Label>
                    <Select onValueChange={setNewState} value={newState}>
                        <SelectTrigger><SelectValue placeholder="Select a state" /></SelectTrigger>
                        <SelectContent><ScrollArea className="h-72">{indianStates.map(s => <SelectItem key={s.name} value={s.name}>{s.name}</SelectItem>)}</ScrollArea></SelectContent>
                    </Select>
                </div>
                 <div className="space-y-2">
                    <Label>Districts</Label>
                    <MultiSelect options={availableDistricts} selected={newDistricts} onChange={setNewDistricts} placeholder="Select districts..."/>
                </div>
                <Button onClick={handleAddPermission} disabled={!newState || newDistricts.length === 0} className="w-full">
                    <PlusCircle className="mr-2 h-4 w-4"/> Add to Permissions
                </Button>
            </div>

            {/* Current Permissions Column */}
            <div className="space-y-4">
                 <h3 className="font-semibold text-lg">Current Permissions</h3>
                 <ScrollArea className="h-72 border rounded-md p-4">
                    {currentPermissions.length === 0 ? (
                        <p className="text-sm text-center text-muted-foreground pt-10">No permissions granted yet.</p>
                    ) : (
                        <div className="space-y-4">
                        {currentPermissions.map(perm => (
                            <div key={perm.state}>
                                <h4 className="font-medium">{perm.state}</h4>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {perm.districts.map(district => (
                                        <Badge key={district} variant="secondary" className="flex items-center gap-1">
                                            {district}
                                            <button onClick={() => handleRemoveDistrict(perm.state, district)} className="rounded-full hover:bg-destructive/20 text-destructive">
                                                <X className="h-3 w-3" />
                                            </button>
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        ))}
                        </div>
                    )}
                 </ScrollArea>
            </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? <><Loader className="animate-spin mr-2" /> Saving...</> : <><Save className="mr-2 h-4 w-4"/> Save Permissions</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Simple MultiSelect Component
function MultiSelect({ options, selected, onChange, placeholder }: { options: string[], selected: string[], onChange: (selected: string[]) => void, placeholder: string }) {
    const [open, setOpen] = useState(false);
    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start font-normal h-auto py-2">
                    <div className="flex gap-1 flex-wrap">
                        {selected.length > 0 ? selected.map(s => <Badge key={s} variant="secondary">{s}</Badge>) : placeholder}
                    </div>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0" align="start">
                <Command>
                    <CommandInput placeholder="Search..." />
                    <CommandList>
                        <CommandEmpty>No results found.</CommandEmpty>
                        <CommandGroup>
                            <ScrollArea className="h-48">
                            {options.map(option => (
                                <CommandItem key={option} onSelect={() => {
                                    onChange(selected.includes(option) ? selected.filter(s => s !== option) : [...selected, option])
                                }}>{option}</CommandItem>
                            ))}
                            </ScrollArea>
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
