// src/app/(main)/[username]/page.tsx
import { getUserByUsername, UserProfile } from '@/services/users.service';
import { notFound } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Mail, Phone, BookOpen, TrendingUp, Users, Warehouse, Package } from 'lucide-react';
import { VCard } from '@/components/v-card';
import { LandingPageHeader } from '@/components/landing-page-header';
import { getPostsByAuthor } from '@/services/blog.service';
import { getRatesByUser } from '@/services/market-rates.service';
import { SerializablePost } from '../page';
import { RecentPosts } from '@/components/recent-posts';
import { MarketRateDisplay } from '@/components/market-rate-display';
import { Timestamp, collection, query, where, orderBy, limit, getDocs, getFirestore } from 'firebase/firestore';
import { app } from '@/lib/firebase';
import { Farmer } from '@/services/farmers.service';
import { InventoryItem } from '@/services/inventory.service';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Link from 'next/link';


export const revalidate = 3600; // Revalidate every hour

async function getRecentFarmers(dealerId: string, count: number): Promise<Farmer[]> {
    const db = getFirestore(app);
    const q = query(collection(db, 'farmers'), where('dealerId', '==', dealerId), orderBy('createdAt', 'desc'), limit(count));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Farmer));
}

async function getRecentInventory(dealerId: string, count: number): Promise<InventoryItem[]> {
    const db = getFirestore(app);
    const q = query(collection(db, 'inventory'), where('ownerId', '==', dealerId), orderBy('createdAt', 'desc'), limit(count));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as InventoryItem));
}


export default async function UserVCardPage({ params }: { params: { username: string } }) {
  const db = getFirestore(app);
  const user = await getUserByUsername(db, params.username);

  if (!user || user.status === 'suspended') {
    notFound();
  }

  let posts: SerializablePost[] = [];
  let recentFarmers: Farmer[] = [];
  let recentInventory: InventoryItem[] = [];

  if (user.role === 'admin' || user.role === 'dealer') {
     const authorPosts = await getPostsByAuthor(db, user.uid, 3);
     posts = authorPosts.map(post => ({
        ...post,
        createdAt: (post.createdAt as Timestamp).toDate().toISOString(),
     }));
  }
  
  if (user.role === 'dealer') {
      recentFarmers = await getRecentFarmers(user.uid, 5);
      recentInventory = await getRecentInventory(user.uid, 5);
  }

  const contributedRates = user.role === 'dealer' ? await getRatesByUser(db, user.uid, 5) : [];

  const roleDescription = user.role === 'dealer' ? 'Poultry Dealer' : user.role === 'admin' ? 'Administrator' : 'Poultry Farmer';

  return (
    <>
    <LandingPageHeader />
    <main className="flex min-h-screen flex-col items-center bg-gray-100 dark:bg-gray-900 p-4 pt-24">
        <div className="w-full max-w-4xl space-y-8">
            <Card className="overflow-hidden shadow-lg border-2 border-primary/20">
                <CardHeader className="p-0">
                    <div className="bg-gradient-to-r from-primary to-green-400 h-24 relative" />
                     <div className="relative flex justify-center -mt-12">
                        <Avatar className="w-24 h-24 border-4 border-background">
                            <AvatarImage src={`https://picsum.photos/seed/${user.uid}/200`} data-ai-hint="person portrait" />
                            <AvatarFallback className="text-3xl">{user.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                    </div>
                </CardHeader>
                <CardContent className="text-center p-6 space-y-6">
                    <div className="space-y-1">
                        <CardTitle className="text-3xl font-headline">{user.name}</CardTitle>
                        <CardDescription className="text-primary font-semibold">{roleDescription}</CardDescription>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
                         <Card>
                            <CardHeader>
                                <CardTitle className="font-headline text-lg">Contact</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                {user.phoneNumber && (
                                    <a href={`tel:${user.phoneNumber}`} className="flex items-center gap-3 p-2 rounded-md hover:bg-muted">
                                        <Phone className="h-5 w-5 text-muted-foreground" />
                                        <span className="text-sm">{user.phoneNumber}</span>
                                    </a>
                                )}
                                <a href={`mailto:${user.email}`} className="flex items-center gap-3 p-2 rounded-md hover:bg-muted">
                                    <Mail className="h-5 w-5 text-muted-foreground" />
                                     <span className="text-sm">{user.email}</span>
                                </a>
                            </CardContent>
                         </Card>
                          <Card>
                            <CardHeader>
                                <CardTitle className="font-headline text-lg">Digital Card</CardTitle>
                            </CardHeader>
                            <CardContent>
                               <VCard user={user} />
                            </CardContent>
                         </Card>
                    </div>

                    {user.aboutMe && (
                        <Card>
                             <CardHeader>
                                <CardTitle className="font-headline text-lg">About {user.name.split(' ')[0]}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground text-left">{user.aboutMe}</p>
                            </CardContent>
                        </Card>
                    )}
                    
                </CardContent>
            </Card>
            
            {user.role === 'dealer' && (recentFarmers.length > 0 || recentInventory.length > 0) && (
                 <Card>
                    <CardHeader>
                        <CardTitle className="font-headline">Recent Activity</CardTitle>
                        <CardDescription>Latest updates from {user.name}.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Tabs defaultValue="farmers">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="farmers"><Users className="mr-2"/>New Farmers</TabsTrigger>
                                <TabsTrigger value="inventory"><Warehouse className="mr-2"/>New Inventory</TabsTrigger>
                            </TabsList>
                            <TabsContent value="farmers">
                                {recentFarmers.length === 0 ? <p className="text-muted-foreground text-center p-8">No new farmers recently.</p> : (
                                    <div className="space-y-2 mt-4">
                                        {recentFarmers.map(farmer => (
                                            <Link href={`/farmers/${farmer.id}`} key={farmer.id} className="block p-3 rounded-md border hover:bg-muted">
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-10 w-10">
                                                        <AvatarImage src={`https://picsum.photos/seed/${farmer.id}/100`} data-ai-hint="person portrait" />
                                                        <AvatarFallback>{farmer.name.charAt(0)}</AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <p className="font-semibold">{farmer.name}</p>
                                                        <p className="text-sm text-muted-foreground">{farmer.location}</p>
                                                    </div>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </TabsContent>
                            <TabsContent value="inventory">
                               {recentInventory.length === 0 ? <p className="text-muted-foreground text-center p-8">No new inventory recently.</p> : (
                                    <div className="space-y-2 mt-4">
                                        {recentInventory.map(item => (
                                            <div key={item.id} className="p-3 rounded-md border">
                                                <div className="flex items-center gap-3">
                                                     <div className="p-2 bg-muted rounded-md"><Package className="h-6 w-6 text-muted-foreground"/></div>
                                                    <div>
                                                        <p className="font-semibold">{item.name}</p>
                                                        <p className="text-sm text-muted-foreground">{item.quantity} {item.unit} added</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </TabsContent>
                        </Tabs>
                    </CardContent>
                </Card>
            )}

            {posts.length > 0 && (
                <div>
                     <h2 className="text-2xl font-headline font-bold mb-4 flex items-center gap-2"><BookOpen/> Recent Posts</h2>
                     <RecentPosts posts={posts} />
                </div>
            )}
            
            {contributedRates.length > 0 && (
                <div>
                     <h2 className="text-2xl font-headline font-bold mb-4 flex items-center gap-2"><TrendingUp/> Recent Market Rates</h2>
                     <MarketRateDisplay initialRates={contributedRates} />
                </div>
            )}
        </div>
    </main>
    </>
  );
}
