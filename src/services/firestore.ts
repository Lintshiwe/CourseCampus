import { db } from '@/lib/firebase';
import { collection, getDocs, doc, deleteDoc, setDoc, addDoc, serverTimestamp, query, orderBy, updateDoc } from 'firebase/firestore';
import type { Material, Feedback, SocialLink } from '@/types';

// Generic function to fetch a collection
async function getCollection<T>(collectionName: string): Promise<T[]> {
    try {
        const q = query(collection(db, collectionName));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
    } catch (error) {
        console.error(`Error fetching ${collectionName}:`, error);
        return [];
    }
}

// Materials
export const getMaterials = () => getCollection<Material>('materials');
export const addMaterial = (materialData: Omit<Material, 'id'>) => {
    return addDoc(collection(db, 'materials'), materialData);
};
export const updateMaterial = (id: string, materialData: Partial<Omit<Material, 'id'>>) => {
    const materialRef = doc(db, 'materials', id);
    return updateDoc(materialRef, materialData);
};
export const deleteMaterial = (id: string) => deleteDoc(doc(db, 'materials', id));

// Feedback
export const getFeedback = async (): Promise<Feedback[]> => {
    try {
        const q = query(collection(db, "feedback"), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                text: data.text,
                createdAt: data.createdAt?.toDate() || new Date(), // Convert Firestore Timestamp to Date
            } as Feedback;
        });
    } catch (error) {
        console.error("Error fetching feedback:", error);
        return [];
    }
}
export const addFeedback = (text: string) => addDoc(collection(db, 'feedback'), { text, createdAt: serverTimestamp() });
export const deleteFeedback = (id: string) => deleteDoc(doc(db, 'feedback', id));


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
