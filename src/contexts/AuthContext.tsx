import React, { createContext, useContext, useState, useEffect } from 'react';
import { AppUser, UserRole } from '../types';

interface AuthContextType {
    user: AppUser | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    demoLogin: (role: UserRole) => Promise<void>;
    register: (data: any) => Promise<void>;
    logout: () => void;
    updateUser: (updates: Partial<AppUser>) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth must be used within AuthProvider");
    return context;
};

import { account } from '../lib/appwrite';

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<AppUser | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            // 1. Detect if we are returning from an OAuth redirect
            const params = new URLSearchParams(window.location.search);
            const isOAuthRedirect = params.has('secret') && params.has('userId');

            try {
                // If redirecting, wait a split second for SDK to settle
                if (isOAuthRedirect) {
                    await new Promise(r => setTimeout(r, 500));
                }

                // 2. Attempt Appwrite Google OAuth Session Retrieval
                const session = await account.get();
                if (session) {
                    let photoURL = 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + session.$id;
                    try {
                        const activeSession = await account.getSession('current');
                        if (activeSession.provider === 'google' && activeSession.providerAccessToken) {
                            const gRes = await fetch(`https://www.googleapis.com/oauth2/v1/userinfo?access_token=${activeSession.providerAccessToken}`);
                            if (gRes.ok) {
                                const gData = await gRes.json();
                                if (gData.picture) photoURL = gData.picture;
                            }
                        }
                    } catch (e) { /* fallback */ }

                    const mappedUser: AppUser = {
                        uid: session.$id,
                        email: session.email,
                        displayName: session.name || 'Google User',
                        photoURL,
                        role: 'donor',
                        reputation: 0,
                    };

                    // Force clean URL by removing OAuth params
                    if (isOAuthRedirect) {
                        window.history.replaceState({}, document.title, window.location.pathname);
                    }

                    setUser(mappedUser);
                    localStorage.setItem('aidconnect_user', JSON.stringify(mappedUser));
                    setLoading(false);
                    return;
                }
            } catch (err: any) {
                console.error("Auth check failed:", err);
                if (isOAuthRedirect) {
                    localStorage.setItem('aidconnect_last_error', err.message || "Failed to sync session");
                }
            }

            // 3. Local backend fallback
            const savedUser = localStorage.getItem('aidconnect_user');
            const token = localStorage.getItem('aidconnect_token');
            if (savedUser && token) {
                setUser(JSON.parse(savedUser));
            }
            setLoading(false);
        };
        checkAuth();
    }, []);

    const handleAuthResponse = async (res: Response) => {
        if (!res.ok) {
            const text = await res.text();
            throw new Error(text);
        }
        const data = await res.json();
        setUser(data.user);
        localStorage.setItem('aidconnect_user', JSON.stringify(data.user));
        localStorage.setItem('aidconnect_token', data.token);
    };

    const login = async (email: string, password: string) => {
        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        await handleAuthResponse(res);
    };

    const demoLogin = async (role: UserRole) => {
        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ role })
        });
        await handleAuthResponse(res);
    };

    const register = async (userData: any) => {
        const res = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        });
        await handleAuthResponse(res);
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('aidconnect_user');
        localStorage.removeItem('aidconnect_token');
    };

    const updateUser = (updates: Partial<AppUser>) => {
        if (user) {
            const updated = { ...user, ...updates };
            setUser(updated);
            localStorage.setItem('aidconnect_user', JSON.stringify(updated));
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, demoLogin, register, logout, updateUser }}>
            {children}
        </AuthContext.Provider>
    );
};
