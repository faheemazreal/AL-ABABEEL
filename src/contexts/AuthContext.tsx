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
            // Appwrite OAuth callback includes both 'userId' and 'secret' params
            const isOAuthRedirect = params.has('secret') && params.has('userId');

            // On OAuth redirect, keep loading=true the whole time so we NEVER flash
            // the AuthPage — we wait until the session is fully confirmed.
            if (!isOAuthRedirect) {
                // Non-OAuth: instantly restore from localStorage so there's no flash
                const savedUser = localStorage.getItem('aidconnect_user');
                if (savedUser) {
                    try {
                        setUser(JSON.parse(savedUser));
                    } catch { /* ignore malformed data */ }
                    setLoading(false);
                    // Continue in background to verify / update the stored user
                }
            }

            // Verify with Appwrite (confirm session is alive and get latest profile)
            try {
                if (isOAuthRedirect) {
                    // Small delay to give Appwrite's OAuth handler time to finalize the session
                    await new Promise(r => setTimeout(r, 1000));
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

                    // Clean OAuth params from URL without causing a reload
                    if (isOAuthRedirect) {
                        window.history.replaceState({}, document.title, window.location.pathname);
                    }

                    setUser(mappedUser);
                    localStorage.setItem('aidconnect_user', JSON.stringify(mappedUser));
                    setLoading(false);

                    // Signal the router that OAuth login finished so it can navigate to home
                    if (isOAuthRedirect) {
                        window.dispatchEvent(new CustomEvent('aidconnect:auth-ready'));
                    }
                } else {
                    const savedUser = localStorage.getItem('aidconnect_user');
                    if (!savedUser) {
                        // No session anywhere — show login
                        setLoading(false);
                    }
                }
            } catch (err: any) {
                console.error('Auth check failed:', err.message);
                if (isOAuthRedirect) {
                    localStorage.setItem('aidconnect_last_error', err.message || 'Failed to sync Google session');
                }
                const savedUser = localStorage.getItem('aidconnect_user');
                if (!savedUser) {
                    setLoading(false);
                }
            }
        };
        checkAuth();
    }, []);


    const login = async (email: string, password: string) => {
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
        } catch (e) { console.warn('Demo login not available'); }
    };

    const register = async (userData: any) => {
        const { email, password, firstName, lastName } = userData;
        const displayName = `${firstName} ${lastName}`.trim();
        await account.create(ID.unique(), email, password, displayName);
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
