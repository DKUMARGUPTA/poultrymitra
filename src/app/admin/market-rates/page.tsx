// src/app/admin/market-rates/page.tsx
'use client';

import { Bird, TrendingUp, PlusCircle, Upload } from "lucide-react"
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AddMarketRateModal } from '@/components/add-market-rate-modal';
import { BulkUploadMarketRatesModal } from '@/components/bulk-upload-market-rates-modal';
import { MarketRateDisplay } from '@/components/market-rate-display';

export default function AdminMarketRatesPage() {
    const handleRatesAdded = () => {
        // The MarketRateDisplay component will update automatically via its own subscription
    };

    return (
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="font-headline text-xl flex items-center gap-2">
                            <TrendingUp className="w-6 h-6 text-primary" />
                            Market Rate Management
                        </CardTitle>
                        <CardDescription>Add and view the daily broiler rates for different regions.</CardDescription>
                    </div>
                    <div className="flex gap-2">
                        <BulkUploadMarketRatesModal onRatesAdded={handleRatesAdded}>
                            <Button variant="outline">
                                <Upload className="mr-2 h-4 w-4" />
                                Upload
                            </Button>
                        </BulkUploadMarketRatesModal>
                        <AddMarketRateModal onRateAdded={handleRatesAdded}>
                            <Button>
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Add Market Rate
                            </Button>
                        </AddMarketRateModal>
                    </div>
                </CardHeader>
                <CardContent>
                    <MarketRateDisplay />
                </CardContent>
            </Card>
        </main>
    );
}
