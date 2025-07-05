
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, deleteDoc, setDoc, addDoc, serverTimestamp, query, orderBy, updateDoc, increment, getDoc, writeBatch, runTransaction, Timestamp, where } from 'firebase/firestore';
import type { Material, Feedback, SocialLink, BugReport, SiteStats, DailyVisit } from '@/types';

// Generic function to fetch a collection
async function getCollection<T>(collectionName: string, orderField?: string, orderDirection: 'asc' | 'desc' = 'asc'): Promise<T[]> {
    try {
        const collRef = collection(db, collectionName);
        const q = orderField ? query(collRef, orderBy(orderField, orderDirection)) : query(collRef);
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => {
            const data = doc.data();
            // Convert any Firestore Timestamps to JS Date objects
            for (const key in data) {
                if (data[key]?.toDate) {
                    data[key] = data[key].toDate();
                }
            }
            return { id: doc.id, ...data } as T;
        });
    } catch (error) {
        console.error(`Error fetching ${collectionName}:`, error);
        return [];
    }
}


// Materials
export const getMaterials = () => getCollection<Material>('materials', 'uploadDate', 'desc');

export const addMaterial = (materialData: Omit<Material, 'id' | 'uploadDate' | 'downloads' | 'isAccessible'>) => {
    return addDoc(collection(db, 'materials'), {
        ...materialData,
        uploadDate: serverTimestamp(),
        downloads: 0,
        isAccessible: true,
    });
};

export const updateMaterial = (id: string, materialData: Partial<Omit<Material, 'id'>>) => {
    const materialRef = doc(db, 'materials', id);
    return updateDoc(materialRef, materialData);
};

export const deleteMaterial = (id: string) => deleteDoc(doc(db, 'materials', id));

export const batchUpdateMaterials = async (ids: string[], data: Partial<Omit<Material, 'id'>>) => {
    const batch = writeBatch(db);
    ids.forEach(id => {
        const docRef = doc(db, 'materials', id);
        batch.update(docRef, data);
    });
    return batch.commit();
}

export const batchDeleteMaterials = async (ids: string[]) => {
    const batch = writeBatch(db);
    ids.forEach(id => {
        const docRef = doc(db, 'materials', id);
        batch.delete(docRef);
    });
    return batch.commit();
}

export const incrementMaterialDownload = (id: string) => {
    const materialRef = doc(db, 'materials', id);
    return updateDoc(materialRef, {
        downloads: increment(1)
    });
};

// Feedback
export const getFeedback = () => getCollection<Feedback>('feedback', 'createdAt', 'desc');
export const addFeedback = (text: string) => addDoc(collection(db, 'feedback'), { text, createdAt: serverTimestamp() });
export const deleteFeedback = (id: string) => deleteDoc(doc(db, 'feedback', id));

// Bug Reports
export const getBugReports = () => getCollection<BugReport>('bug-reports', 'createdAt', 'desc');
export const addBugReport = (text: string) => addDoc(collection(db, 'bug-reports'), { text, createdAt: serverTimestamp() });
export const deleteBugReport = (id: string) => deleteDoc(doc(db, 'bug-reports', id));


// Social Links
export const getSocialLinks = () => getCollection<SocialLink>('social-links');

export const updateSocialLinks = async (links: SocialLink[]) => {
    try {
        const batch = writeBatch(db);
        links.forEach(link => {
            const docRef = doc(db, 'social-links', link.id);
            batch.set(docRef, { name: link.name, url: link.url }, { merge: true });
        });
        await batch.commit();
    } catch (error) {
        console.error("Error updating social links:", error);
        throw error;
    }
};

// Analytics
export const getSiteStats = async (): Promise<SiteStats> => {
    const docRef = doc(db, 'analytics', 'siteStats');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return docSnap.data() as SiteStats;
    }
    return { totalVisits: 0 };
};

export const getDailyVisits = async (): Promise<DailyVisit[]> => {
    const collRef = collection(db, 'dailyVisits');
    // Fetch all daily visits, ordered by date.
    // The client will handle filtering/aggregation by period.
    const q = query(collRef, orderBy('date', 'asc'));

    try {
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                count: data.count,
                date: data.date.toDate()
            } as DailyVisit;
        });
    } catch (error) {
        console.error("Error fetching daily visits:", error);
        return [];
    }
};


export const logVisit = async () => {
    if (typeof window === 'undefined' || !window.sessionStorage) return;
    
    if (sessionStorage.getItem('siteVisited')) {
        return;
    }
    sessionStorage.setItem('siteVisited', 'true');

    const today = new Date();
    const dateKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    
    const siteStatsRef = doc(db, 'analytics', 'siteStats');
    const dailyVisitRef = doc(db, 'dailyVisits', dateKey);

    try {
        await runTransaction(db, async (transaction) => {
            const dailyVisitDoc = await transaction.get(dailyVisitRef);

            transaction.set(siteStatsRef, { totalVisits: increment(1) }, { merge: true });

            if (!dailyVisitDoc.exists()) {
                const startOfDay = new Date(today);
                startOfDay.setHours(0, 0, 0, 0);
                transaction.set(dailyVisitRef, { 
                    count: 1,
                    date: Timestamp.fromDate(startOfDay)
                });
            } else {
                transaction.update(dailyVisitRef, { count: increment(1) });
            }
        });
    } catch (e) {
        console.error("Visit logging failed: ", e);
    }
};
