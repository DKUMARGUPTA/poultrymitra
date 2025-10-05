// src/components/connection-requests.tsx
'use client';

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Skeleton } from "./ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { useAuth } from "@/hooks/use-auth";
import { ConnectionRequest, getConnectionRequestsForDealer, acceptConnectionRequest, rejectConnectionRequest } from "@/services/connection.service";
import { Check, UserPlus, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function ConnectionRequests() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [requests, setRequests] = useState<ConnectionRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState<string | null>(null);

    useEffect(() => {
        if (user) {
            setLoading(true);
            getConnectionRequestsForDealer(user.uid).then(newRequests => {
                setRequests(newRequests);
                setLoading(false);
            });
        }
    }, [user]);

    const handleAccept = async (request: ConnectionRequest) => {
        setUpdating(request.id);
        try {
            await acceptConnectionRequest(request.id, request.requesterId, request.recipientId);
            setRequests(prev => prev.filter(r => r.id !== request.id));
            toast({
                title: "Connection Accepted",
                description: `You are now connected with ${request.requesterProfile.name}.`,
            });
        } catch (error: any) {
            toast({ variant: 'destructive', title: "Acceptance Failed", description: error.message });
        } finally {
            setUpdating(null);
        }
    };

    const handleReject = async (request: ConnectionRequest) => {
        setUpdating(request.id);
        try {
            await rejectConnectionRequest(request.id, request.requesterId);
            setRequests(prev => prev.filter(r => r.id !== request.id));
            toast({
                title: "Connection Rejected",
                description: `You have rejected the request from ${request.requesterProfile.name}.`,
            });
        } catch (error: any) {
            toast({ variant: 'destructive', title: "Rejection Failed", description: error.message });
        } finally {
            setUpdating(null);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline text-xl flex items-center gap-2">
                    <UserPlus className="w-5 h-5 text-primary" />
                    Connection Requests
                </CardTitle>
                <CardDescription>Farmers who want to connect with you will appear here.</CardDescription>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="space-y-4">
                        <Skeleton className="h-16 w-full" />
                        <Skeleton className="h-16 w-full" />
                    </div>
                ) : requests.length === 0 ? (
                    <p className="text-sm text-center text-muted-foreground py-4">No pending connection requests.</p>
                ) : (
                    <div className="space-y-4">
                        {requests.map(req => (
                            <div key={req.id} className="flex items-center gap-4 p-2 rounded-md border">
                                <Avatar>
                                    <AvatarImage src={`https://picsum.photos/seed/${req.requesterId}/100`} />
                                    <AvatarFallback>{req.requesterProfile.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                    <p className="font-medium">{req.requesterProfile.name}</p>
                                    <p className="text-xs text-muted-foreground">{req.requesterProfile.email}</p>
                                </div>
                                <div className="flex gap-2">
                                    <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => handleReject(req)} disabled={!!updating}>
                                        <X className="w-4 h-4 text-destructive" />
                                    </Button>
                                    <Button size="icon" className="h-8 w-8" onClick={() => handleAccept(req)} disabled={!!updating}>
                                        <Check className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
