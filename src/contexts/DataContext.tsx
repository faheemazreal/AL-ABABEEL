import React, { createContext, useContext, useState, useEffect } from 'react';
import { CharityRequest, Donation, Verification, Review } from '../types';

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

const getHeaders = () => {
    const token = localStorage.getItem('aidconnect_token');
    return {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
};

export const DataProvider = ({ children }: { children: React.ReactNode }) => {
    const [requests, setRequests] = useState<CharityRequest[]>([]);
    const [donations, setDonations] = useState<Donation[]>([]);
    const [verifications, setVerifications] = useState<Verification[]>([]);
    const [reviews, setReviews] = useState<Review[]>([]);

    useEffect(() => {
        const loadConfigCode = async () => {
            try {
                const r = await fetch('/api/requests');
                if (r.ok) {
                    const data = await r.json();
                    setRequests(data);
                }
            } catch (e) { console.error(e); }
        };
        loadConfigCode();
    }, []);

    const addRequest = async (req: Omit<CharityRequest, 'id' | 'createdAt' | 'status' | 'raisedAmount'>) => {
        // 1. Optimistic local update — request appears live immediately
        const tempId = "req_local_" + Math.random().toString(36).substr(2, 9);
        const optimisticRequest: CharityRequest = {
            ...req,
            id: tempId,
            createdAt: Date.now(),
            status: 'Pending',
            raisedAmount: 0,
            neededItems: req.neededItems || [],
        };
        setRequests(prev => [optimisticRequest, ...prev]);

        // 2. Try to persist to the backend (works for email/password users with JWT)
        try {
            const res = await fetch('/api/requests', {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(req)
            });
            if (res.ok) {
                // Successfully saved — refresh from backend to get canonical ID
                const r = await fetch('/api/requests');
                const data = await r.json();
                setRequests(data);
            }
            // If res is not ok (401 for Google users etc.), optimistic entry stays visible
        } catch (err) {
            // Network error — optimistic entry stays visible
            console.warn('Request save to backend failed, showing optimistically:', err);
        }
    };

    const addDonation = async (don: Omit<Donation, 'id' | 'timestamp'>) => {
        try {
            const res = await fetch('/api/donations', {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(don)
            });
            if (res.ok) {
                setDonations([don as Donation, ...donations]);
                const r = await fetch('/api/requests');
                const data = await r.json();
                setRequests(data);
            }
        } catch (err) { console.error(err); }
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
        try {
            const res = await fetch('/api/fulfill', {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({ requestId, itemName, amount })
            });
            if (res.ok) {
                const r = await fetch('/api/requests');
                const data = await r.json();
                setRequests(data);
            }
        } catch (err) { console.error(err); }
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
