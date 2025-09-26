// src/services/users.service.ts
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, updatePassword, sendPasswordResetEmail, deleteUser as deleteAuthUser, reauthenticateWithCredential, EmailAuthProvider, createUserWithEmailAndPassword } from 'firebase/auth';
import { collection, doc, setDoc, getDoc, getDocs, updateDoc, deleteDoc, query, where, writeBatch, Timestamp } from 'firebase/firestore';
import { generateAlphanumericCode } from '@/lib/utils';
import { deleteBatch } from './batches.service';
import { createFarmer, Farmer } from './farmers.service';
import { createNotification } from './notifications.service';
import { createConnectionRequest } from './connection.service';
import { app } from '@/lib/firebase';

export type UserRole = 'farmer' | 'dealer' | 'admin';
export type UserStatus = 'active' | 'suspended';

export interface RatePermission {
  state: string;
  districts: string[];
}

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  username: string;
  role: UserRole;
  status?: UserStatus;
  phoneNumber?: string;
  aboutMe?: string; // New field for bio/description
  dealerCode?: string; // For farmers, this is the UID of their dealer.
  invitationCode?: string; // For dealers, this is their shareable code
  farmerCode?: string; // For farmers, this is their shareable code
  referralCode?: string; // For all users to refer others
  isPremium?: boolean;
  ratePermissions?: RatePermission[];
}


// Function to check if a code is unique for a given field
const isCodeUnique = async (db: Firestore, fieldName: 'username' | 'invitationCode' | 'farmerCode' | 'referralCode', code: string): Promise<boolean> => {
    const usersCollection = collection(db, 'users');
    const q = query(usersCollection, where(fieldName, "==", code));
    const snapshot = await getDocs(q);
    return snapshot.empty;
};

// Function to generate a unique code
const generateUniqueCode = async (db: Firestore, fieldName: 'username' | 'invitationCode' | 'farmerCode' | 'referralCode', length: number, base: string = ''): Promise<string> => {
    let code = base ? `${base.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-')}-${generateAlphanumericCode(4)}` : generateAlphanumericCode(length);
    while (!(await isCodeUnique(db, fieldName, code))) {
        code = base ? `${base.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-')}-${generateAlphanumericCode(4)}` : generateAlphanumericCode(length);
    }
    return code;
};


export const createUser = async (db: Firestore, userProfile: Omit<UserProfile, 'isPremium' | 'status' | 'invitationCode' | 'farmerCode' | 'referralCode' | 'username' | 'ratePermissions'> & { referredBy?: string }) => {
  const usersCollection = collection(db, 'users');
  const isAdminByEmail = userProfile.email === 'admin@poultrymitra.com';
  let role = isAdminByEmail ? 'admin' : userProfile.role;
  
  // If the farmer is using a code to claim a pre-made profile
  if (role === 'farmer' && userProfile.dealerCode) {
    const farmerQuery = query(collection(db, 'farmers'), where("farmerCode", "==", userProfile.dealerCode));
    const farmerSnapshot = await getDocs(farmerQuery);

    if (!farmerSnapshot.empty) {
      const farmerDoc = farmerSnapshot.docs[0];
      const farmerData = farmerDoc.data() as Farmer;

      // This is a placeholder farmer, let's link it
      if (farmerData.isPlaceholder) { 
        const batch = writeBatch(db);
        const uniqueUsername = await generateUniqueCode(db, 'username', 12, farmerData.name);

        // Update the farmer document with the new user's UID and mark as not a placeholder
        const farmerRef = doc(db, 'farmers', farmerDoc.id);
        batch.update(farmerRef, { uid: userProfile.uid, isPlaceholder: false });

        // Create the user profile
        const newUserProfile: UserProfile = {
          uid: userProfile.uid,
          name: farmerData.name, // Use the name from the farmer record
          email: userProfile.email,
          username: uniqueUsername,
          role: 'farmer',
          status: 'active',
          dealerCode: farmerData.dealerId,
          phoneNumber: userProfile.phoneNumber,
          isPremium: false,
          ratePermissions: [],
          referralCode: await generateUniqueCode(db, 'referralCode', 8),
          farmerCode: userProfile.dealerCode, // Keep the same code
        };
        const userRef = doc(db, 'users', userProfile.uid);
        batch.set(userRef, newUserProfile);
        
        await batch.commit();

        // Notify both parties
        await createNotification(db, {
          userId: farmerData.dealerId,
          title: "Farmer Account Activated",
          message: `${farmerData.name} has joined the app and is now fully connected.`,
          type: 'connection_accepted',
          link: `/farmers/${userProfile.uid}`,
        });
         await createNotification(db, {
          userId: userProfile.uid,
          title: "Account Activated!",
          message: `Your account is now linked to the profile created by your dealer.`,
          type: 'connection_accepted',
          link: `/dashboard`,
        });

        return; // Exit the function as we have handled this special case
      }
    }
  }


  const profileToCreate: Partial<UserProfile> = {
    uid: userProfile.uid,
    name: userProfile.name,
    email: userProfile.email,
    username: await generateUniqueCode(db, 'username', 12, userProfile.name),
    phoneNumber: userProfile.phoneNumber,
    role: role,
    status: 'active',
    isPremium: role === 'admin',
    ratePermissions: role === 'admin' ? [{state: 'ALL', districts: ['ALL']}] : [],
    referralCode: await generateUniqueCode(db, 'referralCode', 8),
  };

  if (role === 'farmer') {
    profileToCreate.farmerCode = await generateUniqueCode(db, 'farmerCode', 10);
    // Create the associated farmer document right away
    await createFarmer(db, {
        uid: userProfile.uid,
        name: userProfile.name,
        location: 'Not Specified',
        batchSize: 1, // Default to 1 to pass validation
        dealerId: '', // This will be filled in upon connection approval
        outstanding: 0,
        isPlaceholder: false,
        farmerCode: profileToCreate.farmerCode,
    });

    if (userProfile.dealerCode) {
      const q = query(usersCollection, where("invitationCode", "==", userProfile.dealerCode));
      const dealerSnapshot = await getDocs(q);
      if (dealerSnapshot.empty) {
        throw new Error("Invalid Dealer Invitation Code provided.");
      }
      const dealerDoc = dealerSnapshot.docs[0];
      const dealerId = dealerDoc.id;
      
      await createConnectionRequest(db, userProfile.uid, dealerId);
    }
  }

  if (role === 'dealer') {
    profileToCreate.invitationCode = await generateUniqueCode(db, 'invitationCode', 8);
  }

  await setDoc(doc(usersCollection, userProfile.uid), profileToCreate);

  if (userProfile.referredBy) {
    console.log(`User ${userProfile.uid} was referred by user with code ${userProfile.referredBy}`);
    // Here you would add logic to attribute the referral, e.g.,
    // update a 'referrals' subcollection for the referring user.
  }
};


export const createUserByAdmin = async (
  db: Firestore,
  userData: { name: string; email: string; role: 'farmer' | 'dealer', password: string }
) => {
  const auth = getAuth(app);
  // This function is problematic on the client-side due to auth instance management.
  // In a real-world app, this should be a trusted backend operation (e.g., Cloud Function).
  
  // For now, we simulate success and create the Firestore documents.
  // We cannot create the real auth user here securely without complex admin SDK setup.
  console.warn(`Simulating admin creation of user: ${userData.email}. Auth user not created.`);
  
  const userCredential = await createUserWithEmailAndPassword(auth, userData.email, userData.password);
  const newUid = userCredential.user.uid;

  const newUserProfile: UserProfile = {
    uid: newUid,
    name: userData.name,
    email: userData.email,
    username: await generateUniqueCode(db, 'username', 12, userData.name),
    role: userData.role,
    status: 'active',
    isPremium: false,
    ratePermissions: [],
    referralCode: await generateUniqueCode(db, 'referralCode', 8),
    invitationCode: userData.role === 'dealer' ? await generateUniqueCode(db, 'invitationCode', 8) : undefined,
    farmerCode: userData.role === 'farmer' ? await generateUniqueCode(db, 'farmerCode', 10) : undefined,
  };

  await setDoc(doc(db, 'users', newUid), newUserProfile);
  
  if (userData.role === 'farmer') {
      await createFarmer(db, {
        uid: newUid,
        name: userData.name,
        location: 'Not Specified',
        batchSize: 1,
        dealerId: 'admin_created', // Placeholder
        outstanding: 0,
        isPlaceholder: false,
        farmerCode: newUserProfile.farmerCode,
    });
  }

  return newUserProfile;
};


export const getUserProfile = async (db: Firestore, uid: string): Promise<UserProfile | null> => {
    const docRef = doc(db, 'users', uid);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
        const data = docSnap.data();
        // Ensure status is set for older users
        if (!data.status) {
            data.status = 'active';
        }
        return data as UserProfile;
    } else {
        console.log("No such user profile!");
        return null;
    }
};

export const getUserByUsername = async (db: Firestore, username: string): Promise<UserProfile | null> => {
    const usersCollection = collection(db, 'users');
    const q = query(usersCollection, where("username", "==", username));
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
        return null;
    }
    const user = snapshot.docs[0].data() as UserProfile;
     if (!user.status) {
        user.status = 'active';
    }
    return user;
};


export const getAllUsers = async (db: Firestore): Promise<UserProfile[]> => {
    const usersCollection = collection(db, 'users');
    const querySnapshot = await getDocs(usersCollection);
    const users: UserProfile[] = [];
    querySnapshot.forEach((doc) => {
        const data = doc.data() as UserProfile;
         // Ensure status is set for older users
        if (!data.status) {
            data.status = 'active';
        }
        users.push(data);
    });
    return users;
};

export const updateUserPremiumStatus = async (db: Firestore, uid: string, isPremium: boolean): Promise<void> => {
    const userDocRef = doc(db, 'users', uid);
    await updateDoc(userDocRef, { isPremium });
};

export const updateUserRatePermissions = async (db: Firestore, uid: string, ratePermissions: RatePermission[]): Promise<void> => {
    const userDocRef = doc(db, 'users', uid);
    await updateDoc(userDocRef, { ratePermissions });
};


export const updateUserStatus = async (db: Firestore, uid: string, status: UserStatus): Promise<void> => {
    const userDocRef = doc(db, 'users', uid);
    await updateDoc(userDocRef, { status });
};

export const connectFarmerToDealer = async (db: Firestore, farmerCode: string, dealerId: string): Promise<Farmer> => {
    const usersCollection = collection(db, 'users');
    const q = query(usersCollection, where("farmerCode", "==", farmerCode));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
        throw new Error("Invalid Farmer Code. No farmer found with this code.");
    }
    const farmerUserDoc = snapshot.docs[0];
    const farmerUserProfile = farmerUserDoc.data() as UserProfile;

    if (farmerUserProfile.role !== 'farmer') {
         throw new Error("This code does not belong to a farmer.");
    }
    
    if (farmerUserProfile.dealerCode) {
        if (farmerUserProfile.dealerCode === dealerId) {
            throw new Error("This farmer is already connected to you.");
        } else {
            throw new Error("This farmer is already connected to another dealer.");
        }
    }

    const dealerProfile = await getUserProfile(db, dealerId);
    if (!dealerProfile) {
        throw new Error("Dealer profile not found.");
    }
    
    // Update the UserProfile
    await updateDoc(farmerUserDoc.ref, {
        dealerCode: dealerId
    });

    // Find the corresponding Farmer document and update its dealerId
    const farmerDocRef = doc(db, 'farmers', farmerUserProfile.uid);
    const farmerDocSnap = await getDoc(farmerDocRef);
    let farmerRecord: Farmer;

    if(farmerDocSnap.exists()){
        await updateDoc(farmerDocRef, { dealerId: dealerId });
        farmerRecord = { id: farmerDocSnap.id, ...farmerDocSnap.data() } as Farmer;
    } else {
        // If for some reason the farmer record doesn't exist, create it.
        const newFarmerData = {
            uid: farmerUserProfile.uid,
            name: farmerUserProfile.name,
            location: 'Not Specified',
            batchSize: 1,
            dealerId: dealerId,
            outstanding: 0,
            isPlaceholder: false,
            farmerCode: farmerUserProfile.farmerCode,
        };
        await createFarmer(db, newFarmerData);
        const createdDoc = await getDoc(doc(db, 'farmers', newFarmerData.uid));
        farmerRecord = { id: createdDoc.id, ...createdDoc.data() } as Farmer;
    }

    // Notify dealer of new connection
    await createNotification(db, {
        userId: dealerId,
        title: "New Farmer Connected",
        message: `${farmerUserProfile.name} has successfully connected to your network.`,
        type: 'connection_accepted',
        link: `/farmers/${farmerUserProfile.uid}`
    });

    // Notify farmer of new connection
    await createNotification(db, {
        userId: farmerUserProfile.uid,
        title: "Successfully Connected!",
        message: `You have successfully connected with your new dealer, ${dealerProfile.name}.`,
        type: 'connection_accepted',
        link: `/dashboard`
    });
    
    return farmerRecord;
};


const deleteAllUserData = async (db: Firestore, uid: string, role: UserRole) => {
    const batch = writeBatch(db);

    // Delete transactions where the user is either the primary user or the dealer
    const transactionsAsUserQuery = query(collection(db, 'transactions'), where('userId', '==', uid));
    const transactionsAsDealerQuery = query(collection(db, 'transactions'), where('dealerId', '==', uid));
    const [transactionsAsUserSnap, transactionsAsDealerSnap] = await Promise.all([
        getDocs(transactionsAsUserQuery),
        getDocs(transactionsAsDealerQuery)
    ]);
    transactionsAsUserSnap.forEach(doc => batch.delete(doc.ref));
    transactionsAsDealerSnap.forEach(doc => batch.delete(doc.ref));
    
    if (role === 'farmer') {
        // Delete farmer record using the UID as the document ID
        const farmerDocRef = doc(db, 'farmers', uid);
        batch.delete(farmerDocRef);

        // Delete batches and their entries
        const batchesQuery = query(collection(db, 'batches'), where('farmerId', '==', uid));
        const batchesSnap = await getDocs(batchesQuery);
        for (const batchDoc of batchesSnap.docs) {
            // Re-using deleteBatch function which handles daily entries
            await deleteBatch(db, batchDoc.id); 
        }
    }

    if (role === 'dealer') {
        // Delete all farmers associated with this dealer
        const farmersQuery = query(collection(db, 'farmers'), where('dealerId', '==', uid));
        const farmersSnap = await getDocs(farmersQuery);
        farmersSnap.forEach(doc => batch.delete(doc.ref));

        // Delete all inventory items for this dealer
        const inventoryQuery = query(collection(db, 'inventory'), where('ownerId', '==', uid));
        const inventorySnap = await getDocs(inventoryQuery);
        inventorySnap.forEach(doc => batch.delete(doc.ref));
    }
    
    // Finally, delete the user profile itself
    const userDocRef = doc(db, 'users', uid);
    batch.delete(userDocRef);

    await batch.commit();
}


export const deleteUserAccount = async (db: Firestore, uid: string): Promise<void> => {
    const auth = getAuth(app);
    const userProfile = await getUserProfile(db, uid);
    if (!userProfile) {
        throw new Error("User profile not found, cannot delete data.");
    }
    
    await deleteAllUserData(db, uid, userProfile.role);

    // IMPORTANT: This is a privileged action and will FAIL on the client-side.
    // It must be moved to a backend Cloud Function for production use.
    console.warn(
      `Firestore data for user ${uid} has been deleted. For this project, we are not deleting the actual auth user. In a real app, this would be a backend operation.`
    );
};

export const updateUserProfile = async (db: Firestore, uid: string, data: { name?: string; phoneNumber?: string; aboutMe?: string; }): Promise<void> => {
    const userDocRef = doc(db, 'users', uid);
    await updateDoc(userDocRef, data);
};

export const updateUserPassword = async (newPassword: string): Promise<void> => {
    const auth = getAuth(app);
    const user = auth.currentUser;
    if (!user) throw new Error("No user is currently signed in.");
    await updatePassword(user, newPassword);
};

export const sendPasswordReset = async (email: string): Promise<void> => {
    const auth = getAuth(app);
    await sendPasswordResetEmail(auth, email);
}

export const deleteCurrentUserAccount = async (db: Firestore, password: string): Promise<void> => {
    const auth = getAuth(app);
    const user = auth.currentUser;
    if (!user || !user.email) throw new Error("No user is currently signed in.");

    const credential = EmailAuthProvider.credential(user.email, password);
    
    // Re-authenticate the user to confirm their identity
    await reauthenticateWithCredential(user, credential);

    const userProfile = await getUserProfile(db, user.uid);
    if (userProfile) {
        await deleteAllUserData(db, user.uid, userProfile.role);
    }
    
    // After cleaning up Firestore data, delete the auth user
    await deleteAuthUser(user);
};
