import { db } from '@/lib/firebase';
import { collection, getDocs, doc, deleteDoc, setDoc, addDoc, serverTimestamp, query, orderBy, updateDoc, increment, getDoc } from 'firebase/firestore';
import type { Material, Feedback, SocialLink, BugReport } from '@/types';

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

export const addMaterial = (materialData: Omit<Material, 'id' | 'uploadDate' | 'downloads'>) => {
    return addDoc(collection(db, 'materials'), {
        ...materialData,
        uploadDate: serverTimestamp(),
        downloads: 0,
    });
};

export const updateMaterial = (id: string, materialData: Partial<Omit<Material, 'id'>>) => {
    const materialRef = doc(db, 'materials', id);
    return updateDoc(materialRef, materialData);
};

export const deleteMaterial = (id: string) => deleteDoc(doc(db, 'materials', id));

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
        const batch = links.map(link => setDoc(doc(db, 'social-links', link.id), { name: link.name, url: link.url }, { merge: true }));
        await Promise.all(batch);
    } catch (error) {
        console.error("Error updating social links:", error);
        throw error;
    }
};

// Analytics
export const getSiteStats = async () => {
    try {
        const statsRef = doc(db, 'analytics', 'siteStats');
        const docSnap = await getDoc(statsRef);
        if (docSnap.exists()) {
            return docSnap.data() as { visits: number };
        }
        return { visits: 0 };
    } catch (error) {
        console.error("Error fetching site stats:", error);
        return { visits: 0 };
    }
};

export const incrementSiteVisit = () => {
    const statsRef = doc(db, 'analytics', 'siteStats');
    return updateDoc(statsRef, {
        visits: increment(1)
    }).catch(error => {
        if (error.code === 'not-found') {
            return setDoc(statsRef, { visits: 1 });
        }
        console.error("Error incrementing site visit:", error);
    });
};
