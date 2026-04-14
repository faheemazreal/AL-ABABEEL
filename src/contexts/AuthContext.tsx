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

import { account, ID } from '../lib/appwrite';

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<AppUser | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            const params = new URLSearchParams(window.location.search);
            const isOAuthRedirect = params.has('secret') && params.has('userId');

            // STEP 1: Instantly restore from localStorage (no token required)
            // This prevents the login page from flashing on every reload
            const savedUser = localStorage.getItem('aidconnect_user');
            if (savedUser) {
                setUser(JSON.parse(savedUser));
                setLoading(false);
                // Don't return — still verify session with Appwrite in background
            }

            // STEP 2: Verify with Appwrite (updates photo, confirms session is alive)
            try {
                if (isOAuthRedirect) {
                    await new Promise(r => setTimeout(r, 800));
                }

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
                    } catch (e) { /* fallback to avatar */ }

                    const mappedUser: AppUser = {
                        uid: session.$id,
                        email: session.email,
                        displayName: session.name || 'Google User',
                        photoURL,
                        role: 'donor',
                        reputation: 0,
                    };

                    if (isOAuthRedirect) {
                        window.history.replaceState({}, document.title, window.location.pathname);
                    }

                    setUser(mappedUser);
                    localStorage.setItem('aidconnect_user', JSON.stringify(mappedUser));
                    setLoading(false);
                } else if (!savedUser) {
                    // No Appwrite session AND no localStorage — user is truly logged out
                    setLoading(false);
                }
            } catch (err: any) {
                console.error('Auth check:', err.message);
                if (isOAuthRedirect) {
                    localStorage.setItem('aidconnect_last_error', err.message || 'Failed to sync session');
                }
                if (!savedUser) {
                    // No session anywhere — show login
                    setLoading(false);
                }
            }
        };
        checkAuth();
    }, []);


    const login = async (email: string, password: string) => {
        // Use Appwrite SDK directly — works on Vercel, not just locally
        await account.createEmailPasswordSession(email, password);
        const session = await account.get();
        const mappedUser: AppUser = {
            uid: session.$id,
            email: session.email,
            displayName: session.name || email.split('@')[0],
            photoURL: `https://ui-avatars.com/api/?name=${encodeURIComponent(session.name || email)}&background=random`,
            role: 'donor',
            reputation: 0,
        };
        setUser(mappedUser);
        localStorage.setItem('aidconnect_user', JSON.stringify(mappedUser));
    };

    const demoLogin = async (role: UserRole) => {
        // Demo login is local-only, keep as is for development
        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ role })
            });
            if (res.ok) {
                const data = await res.json();
                setUser(data.user);
                localStorage.setItem('aidconnect_user', JSON.stringify(data.user));
                localStorage.setItem('aidconnect_token', data.token);
            }
        } catch (e) { console.warn('Demo login not available on Vercel'); }
    };

    const register = async (userData: any) => {
        const { email, password, firstName, lastName } = userData;
        const displayName = `${firstName} ${lastName}`.trim();
        // 1. Create Appwrite account
        await account.create(ID.unique(), email, password, displayName);
        // 2. Log in immediately after
        await account.createEmailPasswordSession(email, password);
        const session = await account.get();
        const mappedUser: AppUser = {
            uid: session.$id,
            email: session.email,
            displayName: session.name || displayName,
            photoURL: `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=random`,
            role: 'donor',
            reputation: 0,
        };
        setUser(mappedUser);
        localStorage.setItem('aidconnect_user', JSON.stringify(mappedUser));
    };

    const logout = () => {
        // Sign out from Appwrite too
        account.deleteSession('current').catch(() => { });
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
