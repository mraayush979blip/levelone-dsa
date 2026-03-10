import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, LogOut, Palette, MessageSquare, Bug, ChevronRight, Sun, Zap, Check, Users, Download, Smartphone, Sparkles, LayoutDashboard } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import InstallPWA from './InstallPWA';

const themes = [
    { id: 'theme-light', name: 'Premium Ivory', icon: Sun, color: '#0f172a' },
    { id: 'theme-dark', name: 'Midnight Pro', icon: Zap, color: '#f59e0b' }
];

export default function NavigationMenu() {
    const [isOpen, setIsOpen] = useState(false);
    const { user, signOut, updateTheme } = useAuth();
    const [mounted, setMounted] = useState(false);

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

                                    <InstallPWA variant="menu" />

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
        </div>
    );
}
