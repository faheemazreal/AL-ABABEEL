import React, { createContext, useContext, useState, useEffect } from 'react';
import { CharityRequest, Donation, Verification, Review } from '../types';
import { databases, storage, ID } from '../lib/appwrite';
import { Query } from 'appwrite';

const DB_ID = 'main_db'; // Your Appwrite Database ID
const REQ_COL_ID = 'requests_col'; // Your CharityRequests Collection ID
const BUCKET_ID = 'proof-images'; // Your proof-images Bucket ID

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

export const DataProvider = ({ children }: { children: React.ReactNode }) => {
    const [requests, setRequests] = useState<CharityRequest[]>([]);
    const [donations, setDonations] = useState<Donation[]>([]);
    const [verifications, setVerifications] = useState<Verification[]>([]);
    const [reviews, setReviews] = useState<Review[]>([]);

    const loadRequests = async () => {
        try {
            const response = await databases.listDocuments(DB_ID, REQ_COL_ID, [
                Query.orderDesc('createdAt')
            ]);

            const mappedRequests = response.documents.map((doc: any) => ({
                id: doc.$id,
                requesterId: doc.requesterId,
                requesterName: doc.requesterName,
                title: doc.title,
                description: doc.description,
                category: doc.category,
                targetAmount: doc.targetAmount,
                raisedAmount: doc.raisedAmount || 0,
                urgency: doc.urgency,
                status: doc.status,
                location: typeof doc.location === 'string' ? JSON.parse(doc.location) : doc.location,
                proofUrls: typeof doc.proofUrls === 'string' ? JSON.parse(doc.proofUrls) : doc.proofUrls,
                neededItems: typeof doc.neededItems === 'string' ? JSON.parse(doc.neededItems) : doc.neededItems,
                createdAt: doc.createdAt
            }));
            setRequests(mappedRequests);
        } catch (e) {
            console.warn("Could not load from Appwrite. Ensure you created the database and collection!", e);
        }
    };

    useEffect(() => {
        loadRequests();
    }, []);

    const addRequest = async (req: Omit<CharityRequest, 'id' | 'createdAt' | 'status' | 'raisedAmount'>) => {
        try {
            // 1. Upload Images to Appwrite Storage first
            const uploadedUrls: string[] = [];
            for (const base64Data of (req.proofUrls || [])) {
                // Convert base64 to File object
                const res = await fetch(base64Data);
                const blob = await res.blob();
                const file = new File([blob], `proof_${Date.now()}.png`, { type: 'image/png' });

                const uploadRes = await storage.createFile(BUCKET_ID, ID.unique(), file);
                const fileUrl = storage.getFileView(BUCKET_ID, uploadRes.$id).toString();
                uploadedUrls.push(fileUrl);
            }

            // 2. Save Document to Appwrite Database
            await databases.createDocument(DB_ID, REQ_COL_ID, ID.unique(), {
                title: req.title,
                description: req.description,
                category: req.category,
                targetAmount: req.targetAmount,
                raisedAmount: 0,
                urgency: req.urgency,
                status: 'Pending',
                requesterName: req.requesterName,
                requesterId: req.requesterId || 'anonymous',
                location: JSON.stringify(req.location),
                proofUrls: JSON.stringify(uploadedUrls),
                neededItems: JSON.stringify(req.neededItems || []),
                createdAt: Date.now()
            });

            // 3. Reload list
            await loadRequests();
        } catch (err) {
            console.error('Appwrite Save Failed:', err);
            // Fallback: stay visible optimistically if needed, but Appwrite is persistent
            throw err;
        }
    };

    const addDonation = async (don: Omit<Donation, 'id' | 'timestamp'>) => {
        // Simplified for now: logic to update raisedAmount in requests collection would go here
        setDonations([don as Donation, ...donations]);
    };

    const addVerification = (ver: Omit<Verification, 'id' | 'timestamp' | 'status'>) => {
        const newVer: Verification = {
            ...ver,
            id: 'ver_' + Math.random().toString(36).substr(2, 9),
            timestamp: Date.now(),
            status: 'Approved'
        };
        setVerifications([newVer, ...verifications]);
        setRequests(prev => prev.map(r => r.id === ver.requestId ? { ...r, status: 'Verified' } : r));
    };

    const addReview = (review: Omit<Review, 'id' | 'timestamp'>) => {
        const newReview: Review = {
            ...review,
            id: 'rev_' + Math.random().toString(36).substr(2, 9),
            timestamp: Date.now()
        };
        setReviews([newReview, ...reviews]);
    };

    const updateNeededItem = async (requestId: string, itemName: string, amount: number) => {
        // Logic to update neededItems JSON in Appwrite would go here
    };

    return (
        <DataContext.Provider value={{
            requests, donations, verifications, reviews,
            addRequest, addDonation, addVerification, addReview, updateNeededItem
        }}>
            {children}
        </DataContext.Provider>
    );
};
