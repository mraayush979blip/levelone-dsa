'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import NeonLoader from '@/components/NeonLoader';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { signIn, user, loading: authLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!authLoading && user) {
            console.log('🔄 [Login] Active session detected, auto-redirecting...');
            router.push('/');
        }
    }, [user, authLoading, router]);


    const [showLoader, setShowLoader] = useState(false);

    useEffect(() => {
        let timeoutId: NodeJS.Timeout;
        if (authLoading) {
            timeoutId = setTimeout(() => setShowLoader(true), 500);
        } else {
            setShowLoader(false);
        }
        return () => clearTimeout(timeoutId);
    }, [authLoading]);

    if (authLoading) {
        if (showLoader) {
            return <NeonLoader />;
        }
        return null;
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            console.log('Attempting login for:', email);

            console.log('Attempting login for:', email);

            await signIn(email, password);

            console.log('Login successful, checking user profile...');

            // The AuthContext handleSignIn now waits for the profile. 
            // We can add a small delay or check here as well if needed, 
            // but the improved AuthContext should be enough.

            router.push('/');
        } catch (err: any) {
            console.error('Login error:', err);
            setError(err.message || 'Failed to sign in');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
            <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
                <h1 className="text-4xl font-black text-center mb-1 text-gray-900 tracking-tighter">
                    Levelone
                </h1>
                <p className="text-center text-sm text-blue-600 font-medium mb-8 uppercase tracking-widest">
                    sab ka sath sab vikas
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                            Email
                        </label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="student@example.com"
                        />
                    </div>

                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                            Password
                        </label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="••••••••"
                        />
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>

                <div className="mt-8 pt-6 border-t border-gray-100 flex flex-col items-center gap-4">
                    <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">
                        System Diagnostics
                    </p>
                    <button
                        type="button"
                        onClick={async () => {
                            if (confirm('This will reset your local app cache and log you out. Continue?')) {
                                localStorage.clear();
                                if ('serviceWorker' in navigator) {
                                    const regs = await navigator.serviceWorker.getRegistrations();
                                    for (const reg of regs) await reg.unregister();
                                }
                                const cacheNames = await caches.keys();
                                for (const name of cacheNames) await caches.delete(name);
                                window.location.reload();
                            }
                        }}
                        className="text-gray-400 hover:text-red-500 text-[10px] font-bold uppercase tracking-widest transition-colors flex items-center gap-1.5"
                    >
                        Trouble logging in? Reset App Cache
                    </button>
                    <p className="text-gray-300 text-[9px] font-medium tracking-tight">
                        Levelone v2.1.0 Stable
                    </p>
                </div>
            </div>
        </div>
    );
}
