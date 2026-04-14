import React, { createContext, useContext, useState, useEffect } from 'react';
import { CharityRequest, Donation, Verification, Review } from '../types';
import { databases, storage, ID } from '../lib/appwrite';

const DB_ID = 'main_db';
const REQ_COL_ID = 'requests_col';
const BUCKET_ID = 'proof-images';

interface DataContextType {
    requests: CharityRequest[];
    donations: Donation[];
    verifications: Verification[];
    reviews: Review[];
    addRequest: (req: Omit<CharityRequest, 'id' | 'createdAt' | 'status' | 'raisedAmount'>) => Promise<void>;
    addDonation: (don: Omit<Donation, 'id' | 'timestamp'>) => Promise<void>;
    addVerification: (ver: Omit<Verification, 'id' | 'timestamp' | 'status'>) => void;
    addReview: (review: Omit<Review, 'id' | 'timestamp'>) => void;
    updateNeededItem: (requestId: string, itemName: string, amount: number) => Promise<void>;
}

const DataContext = createContext<DataContextType | null>(null);

export const useData = () => {
    const context = useContext(DataContext);
    if (!context) throw new Error("useData must be used within DataProvider");
    return context;
};

const mapDoc = (doc: any): CharityRequest => ({
    id: doc.$id,
    requesterId: doc.requesterId || '',
    requesterName: doc.requesterName || '',
    title: doc.title || '',
    description: doc.description || '',
    category: doc.category || 'food',
    targetAmount: Number(doc.targetAmount) || 0,
    raisedAmount: Number(doc.raisedAmount) || 0,
    urgency: doc.urgency || 'medium',
    status: doc.status || 'Pending',
    location: (() => {
        try { return typeof doc.location === 'string' ? JSON.parse(doc.location) : (doc.location || { lat: 0, lng: 0, address: '' }); }
        catch { return { lat: 0, lng: 0, address: '' }; }
    })(),
    proofUrls: (() => {
        try { return typeof doc.proofUrls === 'string' ? JSON.parse(doc.proofUrls) : (doc.proofUrls || []); }
        catch { return []; }
    })(),
    neededItems: (() => {
        try { return typeof doc.neededItems === 'string' ? JSON.parse(doc.neededItems) : (doc.neededItems || []); }
        catch { return []; }
    })(),
    createdAt: typeof doc.createdAt === 'string' ? new Date(doc.createdAt).getTime() : (doc.createdAt || Date.now()),
});

export const DataProvider = ({ children }: { children: React.ReactNode }) => {
    const [requests, setRequests] = useState<CharityRequest[]>([]);
    const [donations, setDonations] = useState<Donation[]>([]);
    const [verifications, setVerifications] = useState<Verification[]>([]);
    const [reviews, setReviews] = useState<Review[]>([]);

    const loadRequests = async () => {
        try {
            // FIX 1: No Query.orderDesc — avoids crash if 'createdAt' column type is wrong
            const response = await databases.listDocuments(DB_ID, REQ_COL_ID);
            const mapped = response.documents.map(mapDoc);
            // Sort client-side instead to be safe
            mapped.sort((a, b) => b.createdAt - a.createdAt);
            setRequests(mapped);
            console.log(`[DataContext] Loaded ${mapped.length} requests from Appwrite.`);
        } catch (e: any) {
            console.error('[DataContext] LOAD FAILED:', e.message);
        }
    };

    useEffect(() => {
        loadRequests();
    }, []);

    const addRequest = async (req: Omit<CharityRequest, 'id' | 'createdAt' | 'status' | 'raisedAmount'>) => {
        // FIX 2: Optimistic update — request appears immediately for the creator
        const tempId = 'optimistic_' + Math.random().toString(36).substr(2, 9);
        const optimistic: CharityRequest = {
            ...req,
            id: tempId,
            createdAt: Date.now(),
            status: 'Pending',
            raisedAmount: 0,
            neededItems: req.neededItems || [],
        };
        setRequests(prev => [optimistic, ...prev]);

        try {
            // FIX 3: Image upload is isolated — if it fails, the document save still proceeds
            const uploadedUrls: string[] = [];
            for (const base64Data of (req.proofUrls || [])) {
                try {
                    const res = await fetch(base64Data);
                    const blob = await res.blob();
                    const file = new File([blob], `proof_${Date.now()}.jpg`, { type: blob.type || 'image/jpeg' });
                    const uploadRes = await storage.createFile(BUCKET_ID, ID.unique(), file);
                    uploadedUrls.push(storage.getFileView(BUCKET_ID, uploadRes.$id).toString());
                } catch (imgErr) {
                    console.warn('[DataContext] Image upload failed, skipping:', imgErr);
                }
            }

            // FIX 4: Save createdAt as ISO String to avoid Integer column issues
            const docData = {
                title: req.title,
                description: req.description,
                category: req.category,
                targetAmount: req.targetAmount,
                raisedAmount: 0,
                urgency: req.urgency,
                status: 'Pending',
                requesterName: req.requesterName,
                requesterId: req.requesterId || 'anonymous',
                location: JSON.stringify(req.location || {}),
                proofUrls: JSON.stringify(uploadedUrls),
                neededItems: JSON.stringify(req.neededItems || []),
                createdAt: new Date().toISOString(), // String is safe for all column types
            };

            const created = await databases.createDocument(DB_ID, REQ_COL_ID, ID.unique(), docData);
            console.log('[DataContext] Request saved to Appwrite! ID:', created.$id);

            // Replace optimistic entry with real one from Appwrite
            setRequests(prev => prev.map(r => r.id === tempId ? mapDoc(created) : r));

        } catch (err: any) {
            console.error('[DataContext] SAVE FAILED:', err.message);
            // Optimistic entry stays visible to the creator even if save fails
            // This is acceptable for demo; in production you'd show an error banner
        }
    };

    const addDonation = async (don: Omit<Donation, 'id' | 'timestamp'>) => {
        setDonations(prev => [{ ...don, id: 'don_' + Date.now(), timestamp: Date.now() } as Donation, ...prev]);
    };

    const addVerification = (ver: Omit<Verification, 'id' | 'timestamp' | 'status'>) => {
        const newVer: Verification = { ...ver, id: 'ver_' + Date.now(), timestamp: Date.now(), status: 'Approved' };
        setVerifications(prev => [newVer, ...prev]);
        setRequests(prev => prev.map(r => r.id === ver.requestId ? { ...r, status: 'Verified' } : r));
    };

    const addReview = (review: Omit<Review, 'id' | 'timestamp'>) => {
        setReviews(prev => [{ ...review, id: 'rev_' + Date.now(), timestamp: Date.now() }, ...prev]);
    };

    const updateNeededItem = async (_requestId: string, _itemName: string, _amount: number) => {
        // TODO: update neededItems JSON in Appwrite document
    };

    return (
        <DataContext.Provider value={{ requests, donations, verifications, reviews, addRequest, addDonation, addVerification, addReview, updateNeededItem }}>
            {children}
        </DataContext.Provider>
    );
};
