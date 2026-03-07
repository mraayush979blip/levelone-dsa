'use client';

import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { supabase, signIn, signOut } from '@/lib/supabase';
import { User } from '@/types/database';

interface AuthContextType {
    user: User | null;
    supabaseUser: SupabaseUser | null;
    loading: boolean;
    signIn: (email: string, password: string) => Promise<void>;
    signOut: () => Promise<void>;
    refreshUser: () => Promise<void>;
    updateTheme: (theme: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
    const [loading, setLoading] = useState(true);
    const userRef = useRef<User | null>(null);

    useEffect(() => {
        let mounted = true;

        const initializeAuth = async () => {
            console.log('🔄 [Auth] Initializing (Bypass Active)...');

            // EMERGENCY WATCHDOG: Force app open in 3 seconds NO MATTER WHAT
            const watchdog = setTimeout(() => {
                if (mounted && loading) {
                    console.warn('⚠️ [Auth] Watchdog forced end of loading state.');
                    setLoading(false);
                }
            }, 3000);

            try {
                // Determine session with 5s timeout
                const sessionPromise = supabase.auth.getSession();
                const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject('Session timeout'), 5000));

                const { data: { session: initialSession } } = await Promise.race([sessionPromise, timeoutPromise]) as any;

                if (initialSession && mounted) {
                    console.log('🔄 [Auth] Session restored silently');
                    setSupabaseUser(initialSession.user);

                    // Fetch profile silently, don't block the UI if it's too slow
                    fetchUserProfile(initialSession.user.id).catch(() => { });
                }
            } catch (err) {
                console.error('❌ [Auth] Init error or timeout:', err);
            } finally {
                if (mounted) {
                    setLoading(false);
                    clearTimeout(watchdog);
                }
            }

            // Listen for auth changes
            const { data: { subscription } } = supabase.auth.onAuthStateChange(
                async (event, session) => {
                    if (!mounted) return;
                    console.log(`🔔 [Auth] Event: ${event}`);

                    if (session?.user) {
                        setSupabaseUser(session.user);
                        if (!userRef.current || userRef.current.id !== session.user.id) {
                            fetchUserProfile(session.user.id).catch(() => { });
                        }
                    } else {
                        setUser(null);
                        setSupabaseUser(null);
                        userRef.current = null;
                    }
                    if (mounted) setLoading(false);
                }
            );

            return () => {
                mounted = false;
                subscription.unsubscribe();
            };
        };

        initializeAuth();
    }, []);

    const fetchUserProfile = async (userId: string) => {
        try {
            console.log('🔄 [Auth] Fetching profile for:', userId);
            const { data: userData, error } = await supabase
                .from('users')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) throw error;

            if (userData) {
                console.log('✅ [Auth] Profile loaded');
                const newUser = userData as User;
                setUser(newUser);
                userRef.current = newUser;
                if (newUser.equipped_theme) {
                    localStorage.setItem('levelone-theme', newUser.equipped_theme);
                }
            }
        } catch (err) {
            console.warn('⚠️ [Auth] Profile fetch failed (ISP Block?), using fallback student state:', err);
            // DO NOT set user to null, just keep what we have or set a basic template 
            // to allow navigation to continue
            if (!userRef.current) {
                const fallback = { id: userId, role: 'student', name: 'Student' } as any;
                setUser(fallback);
                userRef.current = fallback;
            }
        }
    };

    const handleRefreshUser = async () => {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser) await fetchUserProfile(authUser.id);
    };

    const handleSignIn = async (email: string, password: string) => {
        try {
            setLoading(true);
            await signIn(email, password);
            // Refresh explicitly after sign-in for speed
            const { data: { user: authUser } } = await supabase.auth.getUser();
            if (authUser) await fetchUserProfile(authUser.id);
        } catch (error) {
            setLoading(false);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const handleSignOut = async () => {
        await signOut();
        setUser(null);
        userRef.current = null;
        setSupabaseUser(null);
    };

    const handleUpdateTheme = async (theme: string) => {
        if (!user) return;
        try {
            localStorage.setItem('levelone-theme', theme);
            const { error } = await supabase.from('users').update({ equipped_theme: theme }).eq('id', user.id);
            if (error) throw error;
            const updatedUser = { ...user, equipped_theme: theme };
            setUser(updatedUser);
            userRef.current = updatedUser;
        } catch (err) {
            console.error('❌ [Auth] Error updating theme:', err);
            throw err;
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                supabaseUser,
                loading,
                signIn: handleSignIn,
                signOut: handleSignOut,
                refreshUser: handleRefreshUser,
                updateTheme: handleUpdateTheme,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
    return context;
}
