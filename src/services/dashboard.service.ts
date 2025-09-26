// src/services/dashboard.service.ts
import { getFirestore, Firestore } from 'firebase/firestore';
import { collection, query, where, onSnapshot, Unsubscribe, getDocs, orderBy, getDoc, doc } from 'firebase/firestore';
import { DailyEntry } from './daily-entries.service';
import { InventoryItem } from './inventory.service';
import { Transaction } from './transactions.service';
import { UserProfile, getAllUsers } from './users.service';
import { Farmer } from './farmers.service';
import { app } from '@/lib/firebase';

const db = getFirestore(app);


export interface DealerStats {
  totalFarmers: number;
  pendingPayments: number;
  stockValue: number;
  avgOrderValue: number;
  recentTransactionsCount: number;
  monthlyRevenue: { name: string; revenue: number; cogs: number }[];
}

export interface FarmerStats {
  activeBatches: number;
  avgMortalityRate: number;
  avgWeight: number;
  feedConversionRatio: number;
  outstandingBalance: number;
}

export interface AdminStats {
  totalUsers: number;
  totalFarmers: number;
  totalDealers: number;
  premiumUsers: number;
}

export const getAdminDashboardStats = async (): Promise<AdminStats> => {
  const allUsers = await getAllUsers();
  
  const totalUsers = allUsers.length;
  const totalFarmers = allUsers.filter(u => u.role === 'farmer').length;
  const totalDealers = allUsers.filter(u => u.role === 'dealer').length;
  const premiumUsers = allUsers.filter(u => u.isPremium).length;

  return {
    totalUsers,
    totalFarmers,
    totalDealers,
    premiumUsers,
  };
};

export const getDealerDashboardStats = (dealerId: string, callback: (stats: DealerStats) => void): Unsubscribe => {
  // This is a simplified implementation for demonstration.
  // A real-world scenario would likely use Cloud Functions for aggregation for performance.

  const farmersQuery = query(collection(db, 'farmers'), where("dealerId", "==", dealerId));
  const inventoryQuery = query(collection(db, 'inventory'), where("ownerId", "==", dealerId));
  const transactionsQuery = query(collection(db, 'transactions'), where("dealerId", "==", dealerId));

  let stats: Partial<DealerStats> = {
    totalFarmers: 0,
    pendingPayments: 0,
    stockValue: 0,
    avgOrderValue: 0,
    recentTransactionsCount: 0,
    monthlyRevenue: [],
  };

  const emitUpdate = () => {
    // Ensure all stats are numbers before sending
    const completeStats: DealerStats = {
      totalFarmers: stats.totalFarmers ?? 0,
      pendingPayments: stats.pendingPayments ?? 0,
      stockValue: stats.stockValue ?? 0,
      avgOrderValue: stats.avgOrderValue ?? 0,
      recentTransactionsCount: stats.recentTransactionsCount ?? 0,
      monthlyRevenue: stats.monthlyRevenue ?? [],
    };
    callback(completeStats);
  };

  const unsubFarmers = onSnapshot(farmersQuery, (snapshot) => {
    stats.totalFarmers = snapshot.size;
    let totalOutstanding = 0;
    snapshot.forEach(doc => {
        const farmer = doc.data() as Farmer;
        if(farmer.outstanding > 0) {
            totalOutstanding += farmer.outstanding;
        }
    });
    stats.pendingPayments = totalOutstanding;
    emitUpdate();
  });

  const unsubInventory = onSnapshot(inventoryQuery, (snapshot) => {
    let totalValue = 0;
    snapshot.forEach(doc => {
      const item = doc.data() as InventoryItem;
      totalValue += (item.purchasePrice || 0) * item.quantity;
    });
    stats.stockValue = totalValue;
    emitUpdate();
  });

  const unsubTransactions = onSnapshot(transactionsQuery, (snapshot) => {
    let totalOrderValue = 0;
    let salesCount = 0;
    const monthlyData: { [key: string]: { revenue: number, cogs: number } } = {};

    snapshot.forEach(doc => {
      const trans = doc.data() as Transaction;
      
      // Calculate average order value from sales to farmers (debits for the farmer)
      if (trans.amount > 0 && trans.userId !== dealerId) {
          totalOrderValue += trans.amount;
          salesCount++;
      }

      // Aggregate revenue by month
      const month = new Date(trans.date).toLocaleString('default', { month: 'short' });
       if (!monthlyData[month]) {
          monthlyData[month] = { revenue: 0, cogs: 0 };
       }

      // Revenue for a dealer is positive amounts (sales) to farmers
      if (trans.amount > 0 && trans.userId !== dealerId) {
        monthlyData[month].revenue += Math.abs(trans.amount);
      }
       if (trans.costOfGoodsSold) {
        monthlyData[month].cogs += trans.costOfGoodsSold;
      }
    });

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    stats.monthlyRevenue = monthNames.map(name => ({
        name,
        revenue: monthlyData[name]?.revenue || 0,
        cogs: monthlyData[name]?.cogs || 0
    }));

    stats.recentTransactionsCount = snapshot.size;
    stats.avgOrderValue = salesCount > 0 ? totalOrderValue / salesCount : 0;
    emitUpdate();
  });

  // Return a function that unsubscribes from all listeners
  return () => {
    unsubFarmers();
    unsubInventory();
    unsubTransactions();
  };
};

export const getFarmerDashboardStats = (farmerId: string, callback: (stats: FarmerStats) => void): Unsubscribe => {
  const batchesQuery = query(collection(db, 'batches'), where("farmerId", "==", farmerId));
  
  // Also get farmer's own document for outstanding balance
  const farmerDocRef = doc(db, 'farmers', farmerId);

  const unsubBatches = onSnapshot(batchesQuery, async (batchesSnapshot) => {
    const activeBatchesCount = batchesSnapshot.size;
    let totalInitialBirds = 0;
    let totalMortality = 0;
    let totalFeedConsumed = 0;
    let latestAvgWeight = 0;

    if (activeBatchesCount > 0) {
      for (const batchDoc of batchesSnapshot.docs) {
        const batchData = batchDoc.data();
        totalInitialBirds += batchData.initialBirdCount;

        const entriesQuery = query(collection(db, 'daily-entries'), where("batchId", "==", batchDoc.id), orderBy("date", "desc"));
        const entriesSnapshot = await getDocs(entriesQuery);

        if (!entriesSnapshot.empty) {
            const latestEntry = entriesSnapshot.docs[0].data() as DailyEntry;
            if(latestEntry.averageWeightInGrams > 0) {
                latestAvgWeight = latestEntry.averageWeightInGrams;
            }
        }

        entriesSnapshot.forEach(entryDoc => {
          const entry = entryDoc.data() as DailyEntry;
          totalMortality += entry.mortality;
          totalFeedConsumed += entry.feedConsumedInKg;
        });
      }
    }

    const currentBirdCount = totalInitialBirds - totalMortality;
    const avgMortalityRate = totalInitialBirds > 0 ? (totalMortality / totalInitialBirds) * 100 : 0;
    
    const avgWeightKg = latestAvgWeight > 0 ? latestAvgWeight / 1000 : 0;

    const totalWeightGain = currentBirdCount * avgWeightKg;
    const feedConversionRatio = totalWeightGain > 0 ? totalFeedConsumed / totalWeightGain : 0;

    const farmerSnap = await getDoc(farmerDocRef);
    const outstandingBalance = farmerSnap.exists() ? (farmerSnap.data() as Farmer).outstanding : 0;
    
    const stats: FarmerStats = {
      activeBatches: activeBatchesCount,
      avgMortalityRate: avgMortalityRate,
      avgWeight: avgWeightKg,
      feedConversionRatio: feedConversionRatio,
      outstandingBalance: outstandingBalance,
    };
    callback(stats);
  });

  return () => {
    unsubBatches();
  };
};
