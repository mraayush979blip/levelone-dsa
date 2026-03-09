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
        <div className="min-h-screen flex items-center justify-center bg-black relative overflow-hidden">
            {/* Subtle radial gradient */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(30,30,35,0.8),transparent_80%)]"></div>

            <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 p-8 rounded-2xl shadow-2xl w-full max-w-md relative z-10">
                <h1 className="text-4xl font-black text-center mb-1 text-white tracking-tighter">
                    Levelone
                </h1>
                <p className="text-center text-sm text-zinc-400 font-medium mb-8 uppercase tracking-widest">
                    sab ka sath sab vikas
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-zinc-300 mb-1">
                            Email
                        </label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full px-4 py-2 border border-zinc-700 bg-zinc-800/50 text-white rounded-md focus:ring-2 focus:ring-zinc-500 focus:border-transparent placeholder:text-zinc-600 outline-none transition-all"
                            placeholder="student@example.com"
                        />
                    </div>

                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-zinc-300 mb-1">
                            Password
                        </label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full px-4 py-2 border border-zinc-700 bg-zinc-800/50 text-white rounded-md focus:ring-2 focus:ring-zinc-500 focus:border-transparent placeholder:text-zinc-600 outline-none transition-all"
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
                        className="w-full bg-white hover:bg-zinc-200 text-black font-bold py-3 px-4 rounded-md transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                    >
                        {loading ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>

                <div className="mt-8 pt-6 border-t border-zinc-800 flex flex-col items-center gap-4 relative z-10">
                    <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">
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
                        className="text-zinc-500 hover:text-white text-[10px] font-bold uppercase tracking-widest transition-colors flex items-center gap-1.5"
                    >
                        Trouble logging in? Reset App Cache
                    </button>
                    <p className="text-zinc-600 text-[9px] font-medium tracking-tight">
                        Levelone v2.4.0
                    </p>
                </div>
            </div>
        </div>
    );
}
