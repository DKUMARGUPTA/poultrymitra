
'use client';

import { useState } from 'react';
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader, MessageSquare } from 'lucide-react';
import { UserProfile } from '@/services/users.service';
import { Checkbox } from './ui/checkbox';
import { createNotification } from '@/services/notifications.service';

interface SendNotificationModalProps {
  children: React.ReactNode;
  farmer: UserProfile;
}

export function SendNotificationModal({ children, farmer }: SendNotificationModalProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const [message, setMessage] = useState('');
  const [sendSystemNotif, setSendSystemNotif] = useState(true);
  const [sendOnWhatsApp, setSendOnWhatsApp] = useState(false);

  const handleSubmit = async () => {
    if (!message.trim()) {
      toast({ variant: 'destructive', title: 'Message cannot be empty.' });
      return;
    }
    if (!sendSystemNotif && !sendOnWhatsApp) {
      toast({ variant: 'destructive', title: 'No channel selected.', description: 'Please select at least one notification channel.' });
      return;
    }
    setLoading(true);
    try {
      if (sendSystemNotif) {
        await createNotification({
          userId: farmer.uid,
          title: 'Message from your Dealer',
          message: message,
          type: 'announcement', // Using general purpose type
          link: '/dashboard',
        });
      }

      if (sendOnWhatsApp) {
        const farmerPhone = farmer.phoneNumber;
        if (!farmerPhone) {
          throw new Error(`${farmer.name} does not have a phone number saved.`);
        }
        const encodedMessage = encodeURIComponent(message);
        // Format number to include country code if not present, assuming Indian numbers
        const formattedPhone = farmerPhone.startsWith('+') ? farmerPhone : `91${farmerPhone}`;
        const whatsappUrl = `https://wa.me/${formattedPhone.replace(/\D/g, '')}?text=${encodedMessage}`;
        window.open(whatsappUrl, '_blank');
      }

      toast({ title: 'Notification Sent', description: `Your message has been dispatched to ${farmer.name}.` });
      handleOpenChange(false);
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Failed to Send', description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setMessage('');
      setSendSystemNotif(true);
      setSendOnWhatsApp(false);
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-primary" />
            Send Notification
          </DialogTitle>
          <DialogDescription>
            Send a message to {farmer.name}.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              placeholder="Type your message here..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
            />
          </div>
          <div className="space-y-3">
             <Label>Channels</Label>
             <div className="flex items-center space-x-2">
                <Checkbox id="system" checked={sendSystemNotif} onCheckedChange={(checked) => setSendSystemNotif(!!checked)} />
                <label htmlFor="system" className="text-sm font-medium leading-none">
                    System Notification
                </label>
             </div>
             <div className="flex items-center space-x-2">
                <Checkbox id="whatsapp" checked={sendOnWhatsApp} onCheckedChange={(checked) => setSendOnWhatsApp(!!checked)} />
                <label htmlFor="whatsapp" className="text-sm font-medium leading-none">
                    Send on WhatsApp
                </label>
             </div>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" onClick={handleSubmit} disabled={loading}>
            {loading ? <><Loader className="animate-spin mr-2" /> Sending...</> : 'Send Notification'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
