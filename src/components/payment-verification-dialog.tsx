
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
import { useToast } from '@/hooks/use-toast';
import { Loader, Check, X } from 'lucide-react';
import { PaymentVerificationRequest } from '@/services/billing.service';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

interface PaymentVerificationDialogProps {
  children: React.ReactNode;
  request: PaymentVerificationRequest;
  action: 'approve' | 'reject';
  onConfirm: (request: PaymentVerificationRequest, reason: string) => Promise<void>;
  disabled: boolean;
}

const approvalReasons = [
    "UTR/Reference number verified successfully.",
    "Payment confirmed via bank statement.",
    "Manual activation as per user request.",
];

const rejectionReasons = [
    "UTR/Reference number not found in bank statement.",
    "Incorrect amount transferred.",
    "Screenshot/Reference number is invalid or unclear.",
    "Duplicate verification request.",
];


export function PaymentVerificationDialog({
  children,
  request,
  action,
  onConfirm,
  disabled
}: PaymentVerificationDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [reason, setReason] = useState('');
  const { toast } = useToast();

  const isApprove = action === 'approve';
  const reasonTemplates = isApprove ? approvalReasons : rejectionReasons;

  const handleSubmit = async () => {
    if (!reason.trim()) {
        toast({ variant: 'destructive', title: 'Reason Required', description: 'Please provide a reason for this action.'});
        return;
    }
    setLoading(true);
    await onConfirm(request, reason);
    setLoading(false);
    setOpen(false);
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setReason('');
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl flex items-center gap-2">
             {isApprove ? <Check className="w-6 h-6 text-green-500" /> : <X className="w-6 h-6 text-red-500" />}
            Confirm {isApprove ? 'Approval' : 'Rejection'}
          </DialogTitle>
          <DialogDescription>
            You are about to {action} the payment request from {request.userName}. Please provide a reason.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
            <div className="space-y-2">
                <Label>Quick Reasons</Label>
                <Select onValueChange={(value) => setReason(value)}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select a template..." />
                    </SelectTrigger>
                    <SelectContent>
                        {reasonTemplates.map((template) => (
                            <SelectItem key={template} value={template}>
                                {template}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-2">
                <Label htmlFor="reason">Reason for {isApprove ? 'Approval' : 'Rejection'}</Label>
                <Textarea
                id="reason"
                placeholder={isApprove ? 'e.g., UTR verified successfully.' : 'e.g., UTR not found in bank statement.'}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                />
            </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" onClick={handleSubmit} disabled={loading || disabled} variant={isApprove ? 'default' : 'destructive'}>
            {loading ? <Loader className="animate-spin mr-2" /> : (isApprove ? <Check className="mr-2 h-4 w-4" /> : <X className="mr-2 h-4 w-4" />)}
            {loading ? 'Confirming...' : `Confirm ${isApprove ? 'Approval' : 'Rejection'}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
