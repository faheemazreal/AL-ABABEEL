import React, { createContext, useContext, useState, useEffect } from 'react';
import { CharityRequest, Donation, Verification, Review, Fulfillment } from '../types';
import { databases, storage, ID } from '../lib/appwrite';

const DB_ID = 'main_db';
const REQ_COL_ID = 'requests_col';
const BUCKET_ID = 'proof-images';

interface DataContextType {
    requests: CharityRequest[];
    donations: Donation[];
    verifications: Verification[];
    reviews: Review[];
    fulfillments: Fulfillment[];
    addRequest: (req: Omit<CharityRequest, 'id' | 'createdAt' | 'status' | 'raisedAmount'>) => Promise<void>;
    addDonation: (don: Omit<Donation, 'id' | 'timestamp'>) => Promise<void>;
    addVerification: (ver: Omit<Verification, 'id' | 'timestamp' | 'status'>) => void;
    addReview: (review: Omit<Review, 'id' | 'timestamp'>) => void;
    addFulfillment: (ful: Omit<Fulfillment, 'id' | 'timestamp'>) => void;
    updateNeededItem: (requestId: string, itemName: string, amount: number) => Promise<void>;
    // Community Validation
    validateRequest: (requestId: string, userId: string) => void;
    flagRequest: (requestId: string, userId: string) => void;
    // Admin Controls
    adminDeleteRequest: (requestId: string) => Promise<void>;
    adminOverrideStatus: (requestId: string, status: CharityRequest['status']) => Promise<void>;
    // Owner Controls
    deleteRequest: (requestId: string) => Promise<void>;
    updateRequest: (requestId: string, updates: Partial<Pick<CharityRequest, 'title' | 'description' | 'targetAmount' | 'urgency' | 'category'>>) => void;
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
    category: doc.category || 'Food',
    targetAmount: Number(doc.targetAmount) || 0,
    raisedAmount: Number(doc.raisedAmount) || 0,
    urgency: doc.urgency || 'Medium',
    status: doc.status || 'Pending',
    location: (() => {
        try { return typeof doc.location === 'string' ? JSON.parse(doc.location) : (doc.location || { lat: 0, lng: 0, address: '' }); }
        catch { return { lat: 0, lng: 0, address: '' }; }
    })(),
    proofUrls: Array.isArray(doc.proofUrls) ? doc.proofUrls : (() => { try { return JSON.parse(doc.proofUrls || '[]'); } catch { return []; } })(),
    neededItems: (() => { try { return Array.isArray(doc.neededItems) ? doc.neededItems : JSON.parse(doc.neededItems || '[]'); } catch { return []; } })(),
    createdAt: typeof doc.createdAt === 'string' ? new Date(doc.createdAt).getTime() : (doc.createdAt || Date.now()),
    validationCount: doc.validationCount || 0,
    flagCount: doc.flagCount || 0,
    validatedBy: [],
    flaggedBy: [],
});

export const DataProvider = ({ children }: { children: React.ReactNode }) => {
    const [requests, setRequests] = useState<CharityRequest[]>([]);
    const [donations, setDonations] = useState<Donation[]>([]);
    const [verifications, setVerifications] = useState<Verification[]>([]);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [fulfillments, setFulfillments] = useState<Fulfillment[]>([]);

    const loadRequests = async () => {
        try {
            const response = await databases.listDocuments(DB_ID, REQ_COL_ID);
            const mapped = response.documents.map(mapDoc);
            // Filter out soft-deleted documents
            const active = mapped.filter(r => r.status !== 'Deleted');
            active.sort((a, b) => b.createdAt - a.createdAt);
            setRequests(active);
            console.log(`[DataContext] Loaded ${active.length} active requests (${mapped.length - active.length} deleted filtered out).`);
        } catch (e: any) {
            console.error('[DataContext] LOAD FAILED:', e.message);
        }
    };

    useEffect(() => {
        loadRequests();
    }, []);

    const addRequest = async (req: Omit<CharityRequest, 'id' | 'createdAt' | 'status' | 'raisedAmount'>) => {
        const tempId = 'optimistic_' + Math.random().toString(36).substr(2, 9);
        const optimistic: CharityRequest = {
            ...req,
            id: tempId,
            createdAt: Date.now(),
            status: 'Pending',
            raisedAmount: 0,
            neededItems: req.neededItems || [],
            validationCount: 0,
            flagCount: 0,
            validatedBy: [],
            flaggedBy: [],
        };
        setRequests(prev => [optimistic, ...prev]);

        try {
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

            const docData = {
                title: req.title,
                description: req.description,
                category: req.category,
                targetAmount: Number(req.targetAmount) || 0,
                raisedAmount: 0,
                urgency: req.urgency,
                status: 'Pending',
                requesterName: req.requesterName,
                requesterId: req.requesterId || 'anonymous',
                location: JSON.stringify(req.location || {}).substring(0, 99),
                proofUrls: uploadedUrls,
                neededItems: JSON.stringify(req.neededItems || []),
                createdAt: Date.now(),
            };

            const created = await databases.createDocument(DB_ID, REQ_COL_ID, ID.unique(), docData);
            console.log('[DataContext] Request saved to Appwrite! ID:', created.$id);
            setRequests(prev => prev.map(r => r.id === tempId ? mapDoc(created) : r));
        } catch (err: any) {
            console.error('[DataContext] SAVE FAILED:', err?.message);
        }
    };

    const addDonation = async (don: Omit<Donation, 'id' | 'timestamp'>) => {
        const newDon: Donation = { ...don, id: 'don_' + Date.now(), timestamp: Date.now() };
        setDonations(prev => [newDon, ...prev]);
        // Update raisedAmount on the request
        setRequests(prev => prev.map(r =>
            r.id === don.requestId ? { ...r, raisedAmount: r.raisedAmount + don.amount } : r
        ));
    };

    const addVerification = (ver: Omit<Verification, 'id' | 'timestamp' | 'status'>) => {
        const newVer: Verification = { ...ver, id: 'ver_' + Date.now(), timestamp: Date.now(), status: 'Approved' };
        setVerifications(prev => [newVer, ...prev]);
        setRequests(prev => prev.map(r => r.id === ver.requestId ? { ...r, status: 'Verified' } : r));
    };

    const addReview = (review: Omit<Review, 'id' | 'timestamp'>) => {
        setReviews(prev => [{ ...review, id: 'rev_' + Date.now(), timestamp: Date.now() }, ...prev]);
    };

    const addFulfillment = (ful: Omit<Fulfillment, 'id' | 'timestamp'>) => {
        const newFul: Fulfillment = { ...ful, id: 'ful_' + Date.now(), timestamp: Date.now() };
        setFulfillments(prev => [newFul, ...prev]);
    };

    const updateNeededItem = async (requestId: string, itemName: string, amount: number) => {
        setRequests(prev => prev.map(r => {
            if (r.id !== requestId) return r;
            const updatedItems = (r.neededItems || []).map(item =>
                item.name === itemName
                    ? { ...item, fulfilled: Math.min(item.fulfilled + amount, item.total) }
                    : item
            );
            return { ...r, neededItems: updatedItems };
        }));
    };

    // Community Validation
    const validateRequest = (requestId: string, userId: string) => {
        setRequests(prev => prev.map(r => {
            if (r.id !== requestId) return r;
            const alreadyValidated = (r.validatedBy || []).includes(userId);
            if (alreadyValidated) return r;
            return {
                ...r,
                validationCount: (r.validationCount || 0) + 1,
                validatedBy: [...(r.validatedBy || []), userId],
            };
        }));
    };

    const flagRequest = (requestId: string, userId: string) => {
        setRequests(prev => prev.map(r => {
            if (r.id !== requestId) return r;
            const alreadyFlagged = (r.flaggedBy || []).includes(userId);
            if (alreadyFlagged) return r;
            const newFlagCount = (r.flagCount || 0) + 1;
            return {
                ...r,
                flagCount: newFlagCount,
                flaggedBy: [...(r.flaggedBy || []), userId],
                // Auto-flag status if threshold hit
                status: newFlagCount >= 3 ? 'Flagged' : r.status,
            };
        }));
    };

    // Admin Controls
    const adminDeleteRequest = async (requestId: string) => {
        // Optimistic local removal
        setRequests(prev => prev.filter(r => r.id !== requestId));
        try {
            // Soft-delete: set status to 'Deleted' via updateDocument
            // This works with Any-write permissions unlike deleteDocument
            await databases.updateDocument(DB_ID, REQ_COL_ID, requestId, { status: 'Deleted' });
            console.log('[DataContext] Admin soft-deleted request:', requestId);
        } catch (err: any) {
            console.error('[DataContext] Admin delete FAILED — trying hard delete:', err?.message);
            // Fallback: try actual deleteDocument
            try {
                await databases.deleteDocument(DB_ID, REQ_COL_ID, requestId);
                console.log('[DataContext] Admin hard-deleted request:', requestId);
            } catch (err2: any) {
                console.error('[DataContext] Both delete strategies failed:', err2?.message);
                // Revert optimistic update if both fail
                await loadRequests();
            }
        }
    };

    const adminOverrideStatus = async (requestId: string, status: CharityRequest['status']) => {
        // Optimistic local update
        setRequests(prev => prev.map(r =>
            r.id === requestId ? { ...r, status, flagCount: 0, flaggedBy: [] } : r
        ));
        try {
            // Persist status change to Appwrite
            await databases.updateDocument(DB_ID, REQ_COL_ID, requestId, { status });
            console.log('[DataContext] Admin status override persisted:', requestId, '->', status);
        } catch (err: any) {
            console.error('[DataContext] Status override persist FAILED:', err?.message);
        }
    };

    // Owner Controls
    const deleteRequest = async (requestId: string) => {
        // Optimistic local removal
        setRequests(prev => prev.filter(r => r.id !== requestId));
        try {
            await databases.updateDocument(DB_ID, REQ_COL_ID, requestId, { status: 'Deleted' });
            console.log('[DataContext] Owner soft-deleted request:', requestId);
        } catch (err: any) {
            console.error('[DataContext] Owner delete failed:', err?.message);
            // Fallback: try hard delete
            databases.deleteDocument(DB_ID, REQ_COL_ID, requestId).catch(() => { });
        }
    };

    const updateRequest = (
        requestId: string,
        updates: Partial<Pick<CharityRequest, 'title' | 'description' | 'targetAmount' | 'urgency' | 'category'>>
    ) => {
        setRequests(prev => prev.map(r => r.id === requestId ? { ...r, ...updates } : r));
        // Best-effort update to Appwrite
        databases.updateDocument(DB_ID, REQ_COL_ID, requestId, {
            ...(updates.title && { title: updates.title }),
            ...(updates.description && { description: updates.description }),
            ...(updates.targetAmount !== undefined && { targetAmount: Number(updates.targetAmount) }),
            ...(updates.urgency && { urgency: updates.urgency }),
            ...(updates.category && { category: updates.category }),
        }).catch(() => { });
    };

    return (
        <DataContext.Provider value={{
            requests, donations, verifications, reviews, fulfillments,
            addRequest, addDonation, addVerification, addReview, addFulfillment,
            updateNeededItem, validateRequest, flagRequest,
            adminDeleteRequest, adminOverrideStatus,
            deleteRequest, updateRequest,
        }}>
            {children}
        </DataContext.Provider>
    );
};
