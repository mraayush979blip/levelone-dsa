'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, LogOut, Palette, MessageSquare, Bug, ChevronRight, Sun, Zap, Check, Users, Download, Smartphone, Sparkles } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import Link from 'next/link';
import { cn } from '@/lib/utils';

const themes = [
    { id: 'theme-light', name: 'Premium Ivory', icon: Sun, color: '#0f172a' },
    { id: 'theme-dark', name: 'Midnight Pro', icon: Zap, color: '#f59e0b' }
];

export default function NavigationMenu() {
    const [isOpen, setIsOpen] = useState(false);
    const { user, signOut, updateTheme } = useAuth();
    const { isInstallable, handleInstallClick } = usePWAInstall();
    const [mounted, setMounted] = useState(false);
    const [showIOSGuide, setShowIOSGuide] = useState(false);
    const [showInstallModal, setShowInstallModal] = useState(false);

    // Use a combined condition or just depend on the hook entirely (we'll relax it to show it more often for desktops)
    const isIOS = typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isStandalone = typeof window !== 'undefined' && window.matchMedia('(display-mode: standalone)').matches;

    useEffect(() => {
        setMounted(true);
    }, []);

    const currentTheme = user?.equipped_theme || 'theme-light';

    const menuVariants = {
        closed: {
            opacity: 0,
            scale: 0.95,
            y: -10,
            transition: {
                type: 'spring',
                stiffness: 300,
                damping: 30
            }
        },
        open: {
            opacity: 1,
            scale: 1,
            y: 0,
            transition: {
                type: 'spring',
                stiffness: 300,
                damping: 30
            }
        }
    } as const;

    if (!mounted) {
        return (
            <button className="p-3 rounded-xl bg-card border border-card-border opacity-50">
                <Menu className="h-5 w-5 text-foreground" />
            </button>
        );
    }

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-3 rounded-xl bg-card border border-card-border hover:border-primary/30 transition-all active:scale-95 group relative z-50 shadow-sm"
                aria-label="Toggle Menu"
            >
                {isOpen ? <X className="h-5 w-5 text-foreground" /> : <Menu className="h-5 w-5 text-foreground" />}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Overlay */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsOpen(false)}
                            className="fixed inset-0 z-40 bg-black/5 dark:bg-black/40 backdrop-blur-[2px]"
                        />

                        {/* Dropdown Card */}
                        <motion.div
                            variants={menuVariants}
                            initial="closed"
                            animate="open"
                            exit="closed"
                            className="absolute right-0 mt-3 w-72 bg-card border border-card-border rounded-[2.5rem] shadow-2xl z-50 p-6 space-y-6 overflow-hidden"
                        >
                            {/* User Info Header */}
                            <div className="flex items-center gap-4 pb-4 border-b border-card-border">
                                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-lg border border-primary/20">
                                    {user?.equipped_avatar || '👤'}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm font-black text-foreground truncate">{user?.name || 'Student'}</p>
                                    <p className="text-[9px] font-black uppercase tracking-widest text-muted">Academic Node</p>
                                </div>
                            </div>

                            {/* Menu Sections */}
                            <div className="space-y-6">
                                {/* Appearance Section */}
                                <div className="px-1">
                                    <p className="text-[9px] font-black uppercase tracking-widest text-muted mb-4 flex items-center gap-2">
                                        <Palette className="w-3 h-3" /> Appearance
                                    </p>
                                    <div className="grid grid-cols-3 gap-2">
                                        {themes.map((t) => (
                                            <button
                                                key={t.id}
                                                onClick={() => updateTheme(t.id)}
                                                className={cn(
                                                    "flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all relative group",
                                                    currentTheme === t.id
                                                        ? "bg-primary/10 border-primary text-primary shadow-sm shadow-primary/10"
                                                        : "bg-background border-card-border text-muted hover:border-primary/30 hover:text-foreground"
                                                )}
                                            >
                                                <t.icon className={cn("w-4 h-4 transition-transform", currentTheme === t.id ? "scale-110" : "group-hover:scale-110")} />
                                                <span className="text-[9px] font-black uppercase tracking-widest">{t.name}</span>
                                                {currentTheme === t.id && (
                                                    <div className="absolute top-1 right-1">
                                                        <div className="bg-primary p-0.5 rounded-full">
                                                            <Check className="w-2.5 h-2.5 text-white" />
                                                        </div>
                                                    </div>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="h-px bg-card-border mx-2" />

                                {/* LeetCode Setup Section */}
                                <div className="px-1">
                                    <p className="text-[9px] font-black uppercase tracking-widest text-muted mb-2 flex items-center gap-2">
                                        <Zap className="w-3 h-3 text-orange-500" /> LeetCode Profile
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="text"
                                            id="nav-leetcode-input"
                                            placeholder="Enter LeetCode username"
                                            defaultValue={user?.leetcode_username || ''}
                                            className="w-full text-xs px-3 py-2 bg-background border border-card-border rounded-xl focus:outline-none focus:border-orange-500 transition-colors"
                                        />
                                        <button
                                            type="button"
                                            onClick={async () => {
                                                const val = (document.getElementById('nav-leetcode-input') as HTMLInputElement).value.trim();
                                                if (user?.id) {
                                                    try {
                                                        const { supabase } = await import('@/lib/supabase');
                                                        await supabase.from('users').update({ leetcode_username: val }).eq('id', user.id);
                                                        alert('✅ LeetCode Profile Saved!');
                                                    } catch (err) { }
                                                }
                                            }}
                                            className="bg-orange-500 hover:bg-orange-600 px-3 py-2 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all active:scale-95 shadow-sm shadow-orange-500/20"
                                        >
                                            Save
                                        </button>
                                    </div>
                                    <p className="text-[8px] text-muted font-medium mt-1.5 ml-1 opacity-70">Used for auto-verifying assignments.</p>
                                </div>

                                <div className="h-px bg-card-border mx-2" />

                                {/* Action Buttons */}
                                <div className="space-y-1">
                                    <Link
                                        href="/student/report"
                                        onClick={() => setIsOpen(false)}
                                        className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-primary/5 text-muted hover:text-primary transition-all group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20">
                                                <Bug className="h-4 w-4 text-primary" />
                                            </div>
                                            <span className="text-xs font-bold tracking-tight">Report Bug or Review</span>
                                        </div>
                                        <ChevronRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </Link>

                                    <Link
                                        href="/student/team"
                                        onClick={() => setIsOpen(false)}
                                        className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-primary/5 text-muted hover:text-primary transition-all group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20">
                                                <Users className="h-4 w-4 text-primary" />
                                            </div>
                                            <span className="text-xs font-bold tracking-tight">Our Team</span>
                                        </div>
                                        <ChevronRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </Link>

                                    {/* App Management Button (Always Visible) */}
                                    <button
                                        onClick={() => {
                                            setShowInstallModal(true);
                                            setIsOpen(false);
                                        }}
                                        className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-primary/5 text-muted hover:text-primary transition-all group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20">
                                                {isStandalone ? <Sparkles className="h-4 w-4 text-primary" /> : <Download className="h-4 w-4 text-primary" />}
                                            </div>
                                            <span className="text-xs font-bold tracking-tight">{isStandalone ? 'Update App' : 'Install App'}</span>
                                        </div>
                                        <ChevronRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </button>

                                    {/* iOS Manual Guide */}
                                    <AnimatePresence>
                                        {showIOSGuide && isIOS && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="overflow-hidden"
                                            >
                                                <div className="mx-3 p-4 bg-primary/5 rounded-2xl border border-primary/10 space-y-2">
                                                    <p className="text-[9px] font-black uppercase tracking-widest text-primary">How to Install on iOS</p>
                                                    <ol className="text-[11px] text-muted font-medium space-y-1.5 list-decimal list-inside">
                                                        <li>Tap the <strong className="text-foreground">Share</strong> button (□↑) in Safari</li>
                                                        <li>Scroll down and tap <strong className="text-foreground">Add to Home Screen</strong></li>
                                                        <li>Tap <strong className="text-foreground">Add</strong> to confirm</li>
                                                    </ol>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    <button
                                        onClick={() => {
                                            signOut();
                                            setIsOpen(false);
                                        }}
                                        className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-red-500/5 text-muted hover:text-red-500 transition-all group mt-2"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-red-500/10 rounded-lg group-hover:bg-red-500/20">
                                                <LogOut className="h-4 w-4 text-red-500" />
                                            </div>
                                            <span className="text-xs font-bold tracking-tight text-red-500/80">Logout</span>
                                        </div>
                                    </button>
                                </div>
                            </div>

                            <div className="pt-2 text-center">
                                <p className="text-[8px] font-black uppercase tracking-widest text-muted opacity-40">Levelone Node v2.4.0</p>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Install / Update Modal */}
            <AnimatePresence>
                {showInstallModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="bg-card w-full max-w-sm rounded-[2.5rem] border border-card-border shadow-2xl p-8 relative overflow-hidden"
                        >
                            <button
                                onClick={() => setShowInstallModal(false)}
                                className="absolute top-6 right-6 p-2 rounded-full hover:bg-background transition-colors"
                            >
                                <X className="h-4 w-4 text-muted" />
                            </button>

                            <div className="text-center mb-8">
                                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mx-auto mb-4 border border-primary/20 shadow-glow">
                                    {isStandalone ? <Sparkles className="h-8 w-8" /> : <Zap className="h-8 w-8" />}
                                </div>
                                <h2 className="text-2xl font-black tracking-tight">{isStandalone ? 'Update Levelone' : 'Install Levelone'}</h2>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-muted mt-2">
                                    {isStandalone ? 'Sync to the latest version' : 'Supercharge your experience'}
                                </p>
                            </div>

                            {!isStandalone ? (
                                <div className="space-y-4 mb-8 bg-background border border-card-border rounded-2xl p-5">
                                    <div className="flex items-start gap-4">
                                        <div className="w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0 mt-0.5"><Check className="h-3 w-3 text-emerald-500" /></div>
                                        <div>
                                            <p className="text-xs font-bold">Lightning Fast</p>
                                            <p className="text-[10px] text-muted">Bypasses browser overhead for instant loading</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-4">
                                        <div className="w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0 mt-0.5"><Check className="h-3 w-3 text-emerald-500" /></div>
                                        <div>
                                            <p className="text-xs font-bold">Native Experience</p>
                                            <p className="text-[10px] text-muted">Runs standalone without URL bars or distractions</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-4">
                                        <div className="w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0 mt-0.5"><Check className="h-3 w-3 text-emerald-500" /></div>
                                        <div>
                                            <p className="text-xs font-bold">Offline Resilience</p>
                                            <p className="text-[10px] text-muted">Advanced caching for poor network conditions</p>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center text-sm text-muted mb-8 px-4 leading-relaxed">
                                    You already have the premium Levelone app installed! If you feel like your app is out of date or experiencing bugs, click below to force a core engine update.
                                </div>
                            )}

                            {isStandalone ? (
                                <button
                                    onClick={async () => {
                                        if (confirm('Verify: Update Levelone Node? This will reload the app.')) {
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
                                    className="w-full h-12 bg-primary text-white font-black uppercase tracking-[0.15em] text-[10px] rounded-xl transition-all shadow-glow hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2"
                                >
                                    <Sparkles className="h-4 w-4" /> Force Core Update
                                </button>
                            ) : (
                                <div className="space-y-3">
                                    <button
                                        onClick={() => {
                                            if (isInstallable) {
                                                handleInstallClick();
                                                setShowInstallModal(false);
                                            } else {
                                                setShowIOSGuide(true);
                                            }
                                        }}
                                        className="w-full h-12 bg-primary text-white font-black uppercase tracking-[0.15em] text-[10px] rounded-xl transition-all shadow-glow hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2"
                                    >
                                        <Download className="h-4 w-4" /> {isIOS ? 'Show iOS Install Steps' : 'Install PWA Native Engine'}
                                    </button>

                                    <AnimatePresence>
                                        {showIOSGuide && (
                                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="pt-2">
                                                <div className="p-4 bg-primary/5 rounded-xl border border-primary/10 space-y-2 text-left">
                                                    <p className="text-[9px] font-black uppercase tracking-widest text-primary mb-3">Apple iOS Device Detected</p>
                                                    <ol className="text-[10px] text-muted font-medium space-y-2 list-decimal list-inside leading-relaxed">
                                                        <li>Tap the <strong className="text-foreground">Share</strong> icon (□↑) at the bottom</li>
                                                        <li>Scroll down the sheet options</li>
                                                        <li>Select <strong className="text-foreground">"Add to Home Screen"</strong></li>
                                                    </ol>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
