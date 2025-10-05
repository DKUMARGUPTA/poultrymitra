// src/services/dashboard.service.ts
import { getFirestore, Firestore } from 'firebase/firestore';
import { getClientFirestore } from '@/lib/firebase';
import { collection, query, where, onSnapshot, Unsubscribe, getDocs, orderBy, getDoc, doc, getCountFromServer } from 'firebase/firestore';
import { DailyEntry } from './daily-entries.service';
import { InventoryItem } from './inventory.service';
import { Transaction } from './transactions.service';
import { UserProfile, getAllUsers } from './users.service';
import { Farmer, getAllFarmers } from './farmers.service';


const db = getClientFirestore();

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
    const usersCollection = collection(db, 'users');
    
    const farmersQuery = query(usersCollection, where('role', '==', 'farmer'));
    const dealersQuery = query(usersCollection, where('role', '==', 'dealer'));
    const premiumQuery = query(usersCollection, where('isPremium', '==', true));

    const [
      farmersSnapshot,
      dealersSnapshot,
      premiumSnapshot,
    ] = await Promise.all([
      getCountFromServer(farmersQuery),
      getCountFromServer(dealersQuery),
      getCountFromServer(premiumQuery),
    ]);
    
    const totalFarmers = farmersSnapshot.data().count;
    const totalDealers = dealersSnapshot.data().count;

    return {
      totalUsers: totalFarmers + totalDealers,
      totalFarmers: totalFarmers,
      totalDealers: totalDealers,
      premiumUsers: premiumSnapshot.data().count,
    };
};

export const getDealerDashboardStats = async (dealerId: string): Promise<DealerStats> => {
  // This is a simplified implementation for demonstration.
  // A real-world scenario would likely use Cloud Functions for aggregation for performance.

  const farmersQuery = query(collection(db, 'farmers'), where("dealerId", "==", dealerId));
  const inventoryQuery = query(collection(db, 'inventory'), where("ownerId", "==", dealerId));
  const transactionsQuery = query(collection(db, 'transactions'), where("dealerId", "==", dealerId));

  const [farmersSnapshot, inventorySnapshot, transactionsSnapshot] = await Promise.all([
    getDocs(farmersQuery),
    getDocs(inventoryQuery),
    getDocs(transactionsQuery),
  ]);

  const totalFarmers = farmersSnapshot.size;
  let totalOutstanding = 0;
  farmersSnapshot.forEach(doc => {
      const farmer = doc.data() as Farmer;
      if(farmer.outstanding > 0) {
          totalOutstanding += farmer.outstanding;
      }
  });

  let totalValue = 0;
  inventorySnapshot.forEach(doc => {
    const item = doc.data() as InventoryItem;
    totalValue += (item.purchasePrice || 0) * item.quantity;
  });

  let totalOrderValue = 0;
  let salesCount = 0;
  const monthlyData: { [key: string]: { revenue: number, cogs: number } } = {};

  transactionsSnapshot.forEach(doc => {
    const trans = doc.data() as Transaction;
    
    if (trans.amount > 0 && trans.userId !== dealerId) {
        totalOrderValue += trans.amount;
        salesCount++;
    }

    const month = new Date(trans.date).toLocaleString('default', { month: 'short' });
     if (!monthlyData[month]) {
        monthlyData[month] = { revenue: 0, cogs: 0 };
     }

    if (trans.amount > 0 && trans.userId !== dealerId) {
      monthlyData[month].revenue += Math.abs(trans.amount);
    }
     if (trans.costOfGoodsSold) {
      monthlyData[month].cogs += trans.costOfGoodsSold;
    }
  });

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const monthlyRevenue = monthNames.map(name => ({
      name,
      revenue: monthlyData[name]?.revenue || 0,
      cogs: monthlyData[name]?.cogs || 0
  }));

  return {
    totalFarmers: totalFarmers,
    pendingPayments: totalOutstanding,
    stockValue: totalValue,
    avgOrderValue: salesCount > 0 ? totalOrderValue / salesCount : 0,
    recentTransactionsCount: transactionsSnapshot.size,
    monthlyRevenue: monthlyRevenue,
  };
};

export const getFarmerDashboardStats = async (farmerId: string): Promise<FarmerStats> => {
    const db = getClientFirestore();
    const batchesQuery = query(collection(db, 'batches'), where("farmerId", "==", farmerId));
    const farmerDocRef = doc(db, 'farmers', farmerId);

    const batchesSnapshot = await getDocs(batchesQuery);
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
    return stats;
};
