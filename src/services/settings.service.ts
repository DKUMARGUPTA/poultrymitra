// src/services/settings.service.ts
import { getFirestore, Firestore } from 'firebase/firestore';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { z } from 'zod';

export const SubscriptionSettingsSchema = z.object({
  farmerPlanPrice: z.number().min(0, "Price must be non-negative."),
  dealerPlanPrice: z.number().min(0, "Price must be non-negative."),
  upiId: z.string().min(1, "UPI ID is required."),
  upiName: z.string().min(1, "UPI Name is required."),
});

export type SubscriptionSettings = z.infer<typeof SubscriptionSettingsSchema>;

/**
 * Fetches the current subscription settings.
 * If no settings exist, it creates and returns default values.
 */
export const getSubscriptionSettings = async (db: Firestore): Promise<SubscriptionSettings> => {
  const settingsDocRef = doc(db, 'appSettings', 'subscriptions');
  const docSnap = await getDoc(settingsDocRef);

  if (docSnap.exists()) {
    return docSnap.data() as SubscriptionSettings;
  } else {
    // If no settings exist, create with default values
    const defaultSettings: SubscriptionSettings = {
      farmerPlanPrice: 125,
      dealerPlanPrice: 499,
      upiId: 'poultrymitra-demo@okhdfcbank',
      upiName: 'Poultry Mitra',
    };
    await setDoc(settingsDocRef, defaultSettings);
    return defaultSettings;
  }
};

/**
 * Updates the subscription settings. Only for admins.
 */
export const updateSubscriptionSettings = async (db: Firestore, settings: SubscriptionSettings): Promise<void> => {
  const settingsDocRef = doc(db, 'appSettings', 'subscriptions');
  const validatedSettings = SubscriptionSettingsSchema.parse(settings);
  await updateDoc(settingsDocRef, validatedSettings);
};
