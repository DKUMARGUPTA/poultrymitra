'use client';
import { UserProfile } from "@/services/users.service";
import { Button } from "./ui/button";
import { Download } from "lucide-react";
import QRCode from 'qrcode.react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"


function generateVCardString(user: UserProfile): string {
    const vCard = [
        'BEGIN:VCARD',
        'VERSION:3.0',
        `FN:${user.name}`,
        `EMAIL:${user.email}`,
        user.phoneNumber ? `TEL;TYPE=CELL:${user.phoneNumber}` : '',
        `ORG:Poultry Mitra`,
        `TITLE:${user.role === 'dealer' ? 'Poultry Dealer' : 'Poultry Farmer'}`,
        'END:VCARD'
    ].filter(Boolean).join('\n');
    return vCard;
}

export function VCard({ user }: { user: UserProfile }) {
    const vCardString = generateVCardString(user);

    const handleDownload = () => {
        const blob = new Blob([vCardString], { type: 'text/vcard;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${user.name.replace(/\s/g, '_')}.vcf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="flex flex-col items-center gap-4 pt-4">
            <Dialog>
                <DialogTrigger asChild>
                    <div className="p-2 border rounded-md cursor-pointer hover:bg-muted">
                         <QRCode value={vCardString} size={128} />
                    </div>
                </DialogTrigger>
                <DialogContent className="sm:max-w-xs">
                     <DialogHeader>
                        <DialogTitle>Scan to Save Contact</DialogTitle>
                        <DialogDescription>
                            Open your phone's camera and point it at this QR code to save {user.name}'s contact details.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex justify-center p-4">
                        <QRCode value={vCardString} size={200} />
                    </div>
                </DialogContent>
            </Dialog>

            <Button onClick={handleDownload} className="w-full">
                <Download className="mr-2 h-4 w-4" />
                Save to Contacts
            </Button>
        </div>
    );
}
