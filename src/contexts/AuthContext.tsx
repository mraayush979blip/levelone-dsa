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
            console.log('🔄 [Auth] Initializing...');

            // SAFETY TIMEOUT: Force stop loading if initialization takes > 15 seconds
            const watchdog = setTimeout(() => {
                if (mounted && loading) {
                    console.warn('⚠️ [Auth] Initialization watchdog triggered - forcing end of loading state.');
                    setLoading(false);
                }
            }, 15000);

            try {
                // race between getSession and a shorter timeout
                const sessionPromise = supabase.auth.getSession();
                const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject('Session check timeout'), 10000));

                const { data: { session: initialSession } } = await Promise.race([sessionPromise, timeoutPromise]) as any;

                console.log('🔄 [Auth] Initial session check:', initialSession ? 'Found' : 'Null');
                if (!initialSession && mounted) {
                    setLoading(false);
                    clearTimeout(watchdog);
                }
            } catch (err) {
                console.error('❌ [Auth] Error or timeout checking initial session:', err);
                if (mounted) {
                    setLoading(false);
                    clearTimeout(watchdog);
                }
            }

            // Listen for auth changes
            const { data: { subscription } } = supabase.auth.onAuthStateChange(
                async (event, session) => {
                    if (!mounted) return;
                    console.log(`🔔 [Auth] State change: ${event}`);

                    // Only set loading true if we are changing state or initializing
                    // Avoid setting it true if we already have a user and it's just a token refresh, 
                    // unless we need to re-fetch the profile.

                    if (session?.user) {
                        if (userRef.current && userRef.current.id === session.user.id) {
                            setSupabaseUser(session.user);
                            if (mounted) setLoading(false);
                            return;
                        }

                        try {
                            // Fetch profile with a small timeout
                            const profilePromise = supabase
                                .from('users')
                                .select('*')
                                .eq('id', session.user.id)
                                .single();

                            const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject('Profile fetch timeout'), 7000));

                            const { data: userData } = await Promise.race([profilePromise, timeoutPromise]) as any;

                            if (!mounted) return;

                            if (userData) {
                                console.log('✅ [Auth] Profile loaded');
                                const newUser = userData as User;
                                if (newUser.equipped_theme) {
                                    localStorage.setItem('levelone-theme', newUser.equipped_theme);
                                }
                                setUser(newUser);
                                userRef.current = newUser;
                                setSupabaseUser(session.user);
                            } else {
                                console.warn('⚠️ [Auth] Profile missing - using auth user only');
                                setSupabaseUser(session.user);
                            }
                        } catch (err) {
                            console.error('❌ [Auth] Profile fetch error/timeout:', err);
                            // FALLBACK: Allow session even if profile is blocked
                            setSupabaseUser(session.user);
                            setUser({ id: session.user.id, role: 'student', name: 'Student' } as any);
                        } finally {
                            if (mounted) setLoading(false);
                        }
                    } else {
                        if (mounted) {
                            setUser(null);
                            setSupabaseUser(null);
                            setLoading(false);
                        }
                    }
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
            const { data: userData } = await supabase
                .from('users')
                .select('*')
                .eq('id', userId)
                .single();

            if (userData) {
                console.log('✅ [Auth] Profile refreshed');
                const newUser = userData as User;
                setUser(newUser);
                userRef.current = newUser;
            }
        } catch (err) {
            console.error('❌ [Auth] Error refreshing profile:', err);
        }
    };

    const handleRefreshUser = async () => {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser) {
            await fetchUserProfile(authUser.id);
        }
    };

    const handleSignIn = async (email: string, password: string) => {
        try {
            setLoading(true);
            // Increased timeout for sign-in process
            const signPromise = signIn(email, password);
            const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject('Sign-in timeout'), 7000));

            await Promise.race([signPromise, timeoutPromise]);

            // Attempt manual profile fetch with short timeout
            try {
                const { data: { user: authUser } } = await supabase.auth.getUser();
                if (authUser) {
                    const profilePromise = supabase.from('users').select('*').eq('id', authUser.id).single();
                    const profileTimeout = new Promise((_, reject) => setTimeout(() => reject('Profile fetch timeout'), 3000));
                    const { data: userData } = await Promise.race([profilePromise, profileTimeout]) as any;

                    if (userData) {
                        setUser(userData as User);
                        userRef.current = userData as User;
                    } else {
                        // Fallback user state
                        setUser({ id: authUser.id, role: 'student', name: 'Student' } as any);
                    }
                }
            } catch (err) {
                console.warn('⚠️ [Auth] Manual profile fetch failed/timed out, using session only');
            }
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
            // Save to LocalStorage for immediate, flicker-free persistence
            localStorage.setItem('levelone-theme', theme);

            const { error } = await supabase
                .from('users')
                .update({ equipped_theme: theme })
                .eq('id', user.id);

            if (error) throw error;

            // Optimistic update
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
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
